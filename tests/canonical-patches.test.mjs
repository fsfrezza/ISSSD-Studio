import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalizePatches,applyCanonicalPatches} from '../src/core/canonical-patches.mjs';

const plain = patches => patches.map(p => ({off:p.off,data:[...p.data]}));

test('canonical patches are sorted by offset deterministically',()=>{
  const got=canonicalizePatches([{off:9,data:[3]},{off:1,data:[1]},{off:5,data:[2]}]);
  assert.deepEqual(plain(got),[
    {off:1,data:[1]},{off:5,data:[2]},{off:9,data:[3]}
  ]);
});

test('exact duplicate patches collapse to one canonical patch',()=>{
  const got=canonicalizePatches([
    {off:0x100,data:'AABB'},
    {offset:0x100,data:[0xAA,0xBB]},
    {off:0x100,data:Uint8Array.from([0xAA,0xBB])}
  ]);
  assert.deepEqual(plain(got),[{off:0x100,data:[0xAA,0xBB]}]);
});

test('historical rle-base64 literal patch is decoded exactly like monolithic Studio',()=>{
  const got=canonicalizePatches([{off:30918,len:4,encoding:'rle-base64',data:'A1ZEiFg='}]);
  assert.deepEqual(plain(got),[{off:30918,data:[0x56,0x44,0x88,0x58]}]);
});

test('historical rle-base64 repeat run is decoded exactly like monolithic Studio',()=>{
  const got=canonicalizePatches([{off:0x200,len:4,encoding:'rle-base64',data:'g1o='}]);
  assert.deepEqual(plain(got),[{off:0x200,data:[0x5A,0x5A,0x5A,0x5A]}]);
});

test('rle-base64 reconstructed length must match persisted len',()=>{
  assert.throws(()=>canonicalizePatches([
    {off:0x100,len:5,encoding:'rle-base64',data:'A1ZEiFg='}
  ]),/reconstructed length mismatch/);
});

test('plain string patches remain hexadecimal only',()=>{
  const got=canonicalizePatches([{off:0x100,data:'AABB'}]);
  assert.deepEqual(plain(got),[{off:0x100,data:[0xAA,0xBB]}]);
  assert.throws(()=>canonicalizePatches([{off:0x200,data:'A1ZEiFg='}]),/must be hexadecimal/);
});

test('invalid string patch reports index offset and preview',()=>{
  assert.throws(()=>canonicalizePatches([
    {off:0x100,data:'AABB'},
    {off:0x2345,data:'not-hex-format'}
  ]),error=>{
    assert.match(error.message,/index 1/);
    assert.match(error.message,/offset 9029/);
    assert.match(error.message,/not-hex-format/);
    assert.match(error.message,/must be hexadecimal/);
    return true;
  });
});

test('byte-identical contained overlap is safely collapsed',()=>{
  const got=canonicalizePatches([
    {off:390115,data:[0xAA,0xF0,0xF5]},
    {off:390116,data:[0xF0,0xF5]}
  ]);
  assert.deepEqual(plain(got),[{off:390115,data:[0xAA,0xF0,0xF5]}]);
});

test('byte-identical overlap with a trailing extension is merged',()=>{
  const got=canonicalizePatches([
    {off:0x100,data:[1,2,3]},
    {off:0x102,data:[3,4,5]}
  ]);
  assert.deepEqual(plain(got),[{off:0x100,data:[1,2,3,4,5]}]);
});

test('overlapping non-identical patches report both source patches and overlapping bytes',()=>{
  assert.throws(()=>canonicalizePatches([
    {off:0x100,data:[1,2,3]},
    {off:0x102,data:[9,4]}
  ]),error=>{
    assert.match(error.message,/overlapping patches/);
    assert.match(error.message,/previous index 0 offset 256 len 3/);
    assert.match(error.message,/current index 1 offset 258 len 2/);
    assert.match(error.message,/overlap 258\.\.258/);
    assert.match(error.message,/previous bytes \[03\]/);
    assert.match(error.message,/current bytes \[09\]/);
    return true;
  });
});

test('historical full 2 MiB expansion persistence is rejected',()=>{
  assert.throws(()=>canonicalizePatches([
    {off:0x200000,data:new Uint8Array(0x200000)}
  ]),/immutable base boundary/);
});

test('patch crossing the base boundary is rejected',()=>{
  assert.throws(()=>canonicalizePatches([
    {off:0x1FFFFF,data:[1,2]}
  ]),/immutable base boundary/);
});

test('applying canonical patches never mutates immutable base',()=>{
  const base=Uint8Array.from([0,0,0,0]);
  const out=applyCanonicalPatches(base,[{off:2,value:9}]);
  assert.deepEqual([...base],[0,0,0,0]);
  assert.deepEqual([...out],[0,0,9,0]);
});

test('same logical patch set yields byte-identical output regardless of input order',()=>{
  const base=new Uint8Array(16);
  const a=applyCanonicalPatches(base,[{off:10,data:[3,4]},{off:2,data:[1,2]}]);
  const b=applyCanonicalPatches(base,[{off:2,data:'0102'},{off:10,data:'0304'}]);
  assert.deepEqual(a,b);
});
