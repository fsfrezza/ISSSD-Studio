import test from 'node:test';
import assert from 'node:assert/strict';
import {
  konamiLzCompress,
  konamiLzDecompress,
  konamiLzRoundTrip,
} from '../src/core/konami-lz.mjs';

function stream(body){
  const bytes=Uint8Array.from([0,0,...body]);
  bytes[0]=bytes.length&0xFF;bytes[1]=(bytes.length>>8)&0xFF;
  return bytes;
}

test('Konami LZ decodes literal zero repeat and alternating-zero commands',()=>{
  const literal=konamiLzDecompress(stream([0x83,1,2,3])).data;
  assert.deepEqual([...literal],[1,2,3]);

  const zeros=konamiLzDecompress(stream([0xE3])).data;
  assert.deepEqual([...zeros],[0,0,0,0,0]);

  const repeat=konamiLzDecompress(stream([0xC2,0x7A])).data;
  assert.deepEqual([...repeat],[0x7A,0x7A,0x7A,0x7A]);

  const pairs=konamiLzDecompress(stream([0xA1,0x11,0x22,0x33])).data;
  assert.deepEqual([...pairs],[0,0x11,0,0x22,0,0x33]);
});

test('Konami LZ decodes long zero command 0xFF',()=>{
  const decoded=konamiLzDecompress(stream([0xFF,40])).data;
  assert.equal(decoded.length,42);
  assert.ok(decoded.every(value=>value===0));
});

test('Konami LZ compressor reproduces compact deterministic command choices',()=>{
  assert.deepEqual([...konamiLzCompress(Uint8Array.from([1,2,3]))],[6,0,0x83,1,2,3]);
  assert.deepEqual([...konamiLzCompress(new Uint8Array(5))],[3,0,0xE3]);
  assert.deepEqual([...konamiLzCompress(Uint8Array.from([7,7,7,7]))],[4,0,0xC2,7]);
  assert.deepEqual([...konamiLzCompress(Uint8Array.from([0,1,0,2,0,3]))],[6,0,0xA1,1,2,3]);
});

test('Konami LZ back-reference round-trips repeated tile-like material',()=>{
  const raw=Uint8Array.from([
    1,2,3,4,5,6,7,8,
    1,2,3,4,5,6,7,8,
    1,2,3,4,5,6,7,8,
  ]);
  const packed=konamiLzCompress(raw);
  assert.ok(packed.length<raw.length+3);
  assert.deepEqual(konamiLzDecompress(packed).data,raw);
  assert.ok([...packed.slice(2)].some(value=>value<0x80));
});

test('Konami LZ exact compressor round-trips representative planar buffers',()=>{
  const samples=[
    new Uint8Array(2240),
    Uint8Array.from({length:4032},(_,i)=>i%17===0?0xFF:i%5===0?0:(i*37)&0xFF),
    Uint8Array.from({length:2048},(_,i)=>((i>>3)^(i*11))&0xFF),
    Uint8Array.from({length:284},(_,i)=>i%7?0:(i*13)&0xFF),
  ];
  for(const raw of samples){
    const result=konamiLzRoundTrip(raw);
    assert.equal(result.equal,true);
    assert.deepEqual(result.decoded,raw);
    assert.equal((result.compressed[0]|(result.compressed[1]<<8))&0x7FFF,result.compressed.length);
  }
});

test('Konami LZ rejects truncated streams instead of silently accepting damaged data',()=>{
  assert.throws(()=>konamiLzDecompress(stream([0x83,1,2])),/truncated/i);
  assert.throws(()=>konamiLzDecompress(stream([0xC0])),/truncated/i);
  assert.throws(()=>konamiLzDecompress(stream([0xFF])),/truncated/i);
});
