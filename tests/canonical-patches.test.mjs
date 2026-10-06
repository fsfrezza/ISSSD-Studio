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

test('overlapping non-identical patches are rejected',()=>{
  assert.throws(()=>canonicalizePatches([
    {off:0x100,data:[1,2,3]},
    {off:0x102,data:[3,4]}
  ]),/overlapping patches/);
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
