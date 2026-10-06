import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePlayerRecord,writeSkill,writeNaturalPosition,writeJersey,knownMirrorOffset,surgicalWritesForRecord,playerOffset} from '../src/core/plus-player.mjs';

test('Plus player address uses 56x20x7 bank model',()=>assert.equal(playerOffset(30,7),0x151099));

test('decode keeps natural position, jersey and raw appearance separate',()=>{
 const d=decodePlayerRecord(Uint8Array.from([0x98,0x87,0x76,0x54,0x39,0x08,0xAB]));
 assert.deepEqual({position:d.naturalPosition,energy:d.energy,jersey:d.jersey,appearance:d.appearanceRaw},{position:3,energy:9,jersey:9,appearance:0xAB});
});

for (const field of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy']) {
 test(field+' skill write is nibble-surgical and preserves unrelated player data',()=>{
  const r=Uint8Array.from([0x12,0x34,0x56,0x78,0x39,0x08,0xAB]);
  const before=r.slice();
  const decodedBefore=decodePlayerRecord(before);
  writeSkill(r,field,10);
  const after=decodePlayerRecord(r);

  assert.equal(after[field],9); // raw nibble: UI 10 -> 9
  assert.equal(after.naturalPosition,decodedBefore.naturalPosition);
  assert.equal(after.jersey,decodedBefore.jersey);
  assert.equal(after.appearanceRaw,decodedBefore.appearanceRaw);
  assert.equal(r[6],before[6]);

  const changed=[];
  for(let i=0;i<7;i++) if(r[i]!==before[i]) changed.push(i);
  const expectedByte={acceleration:0,speed:0,shot:1,curve:1,balance:2,intelligence:2,dribbling:3,jump:3,energy:4}[field];
  assert.deepEqual(changed,[expectedByte]);
 });
}

test('jersey write preserves every other byte including appearance',()=>{
 const r=Uint8Array.from([1,2,3,4,5,8,0xEF]), b=r.slice(); writeJersey(r,10);
 assert.equal(r[5],9); for(const i of [0,1,2,3,4,6]) assert.equal(r[i],b[i]);
});

test('natural position write preserves energy low nibble and appearance',()=>{
 const r=Uint8Array.from([0,0,0,0,0x39,0,0xCD]); writeNaturalPosition(r,6);
 assert.equal(r[4],0x69);
 assert.equal(r[6],0xCD);
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

test('all known Brazil mirror slots map every changed record byte exactly 1:1',()=>{
 for(let player=2;player<=7;player++){
  const before=Uint8Array.from([1,2,3,4,5,6,7]);
  const after=before.slice(); after[6]=0xFE;
  assert.deepEqual(surgicalWritesForRecord(30,player,before,after),[
   {off:playerOffset(30,player)+6,value:0xFE,kind:'main'},
   {off:knownMirrorOffset(30,player)+6,value:0xFE,kind:'mirror'}
  ]);
 }
});

test('Argentina surgical write never inherits Brazil mirror',()=>{
 const b=new Uint8Array(7),a=b.slice();a[1]=0x97;
 const w=surgicalWritesForRecord(31,7,b,a);
 assert.equal(w.length,1); assert.equal(w[0].kind,'main');
});
