import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePlayerRecord,writeSkill,writeNaturalPosition,writeJersey,knownMirrorOffset,surgicalWritesForRecord,playerOffset} from '../src/core/plus-player.mjs';

test('Plus player address uses 56x20x7 bank model',()=>assert.equal(playerOffset(30,7),0x151099));

test('decode keeps natural position, jersey and raw appearance separate',()=>{
 const d=decodePlayerRecord(Uint8Array.from([0x98,0x87,0x76,0x54,0x39,0x08,0xAB]));
 assert.deepEqual({position:d.naturalPosition,energy:d.energy,jersey:d.jersey,appearance:d.appearanceRaw},{position:3,energy:9,jersey:9,appearance:0xAB});
});

test('skill write is nibble-surgical and preserves position/jersey/appearance',()=>{
 const r=Uint8Array.from([0x12,0x34,0x56,0x78,0x39,0x08,0xAB]);
 const before=decodePlayerRecord(r.slice());
 writeSkill(r,'energy',10);
 const after=decodePlayerRecord(r);
 assert.equal(after.energy,9); // raw nibble: UI 10 -> 9
 assert.equal(after.naturalPosition,before.naturalPosition);
 assert.equal(after.jersey,before.jersey);
 assert.equal(after.appearanceRaw,before.appearanceRaw);
 assert.equal(r[4],0x39);
});

test('jersey write preserves every other byte',()=>{
 const r=Uint8Array.from([1,2,3,4,5,8,0xEF]), b=r.slice(); writeJersey(r,10);
 assert.equal(r[5],9); for(const i of [0,1,2,3,4,6]) assert.equal(r[i],b[i]);
});

test('natural position write preserves energy low nibble',()=>{
 const r=Uint8Array.from([0,0,0,0,0x39,0,0]); writeNaturalPosition(r,6); assert.equal(r[4],0x69);
});

test('only empirically known Brazil slots 3-8 receive low mirror',()=>{
 assert.equal(knownMirrorOffset(30,2),0x78C6);
 assert.equal(knownMirrorOffset(30,7),0x78E9);
 assert.equal(knownMirrorOffset(30,1),null);
 assert.equal(knownMirrorOffset(30,8),null);
 assert.equal(knownMirrorOffset(31,2),null);
});

test('Pardilla/Pele slot 8 skill byte writes high and low mirror',()=>{
 const b=Uint8Array.from([0x11,0x47,0,0,0,7,0]), a=b.slice(); a[1]=0x97;
 assert.deepEqual(surgicalWritesForRecord(30,7,b,a),[
  {off:0x15109A,value:0x97,kind:'main'},
  {off:0x78EA,value:0x97,kind:'mirror'}
 ]);
});

test('Argentina surgical write never inherits Brazil mirror',()=>{
 const b=new Uint8Array(7),a=b.slice();a[1]=0x97;
 const w=surgicalWritesForRecord(31,7,b,a);
 assert.equal(w.length,1); assert.equal(w[0].kind,'main');
});
