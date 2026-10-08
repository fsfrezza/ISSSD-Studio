import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS,playerOffset,knownMirrorSlices,surgicalWritesForRecord,reconcileKnownPlayerIntegrityMirrors
} from '../src/core/plus-player.mjs';

test('Brazil player 1 mirrors only bytes 1..6 into Plus integrity table',()=>{
  const before=Uint8Array.from([0x89,0x65,0x78,0x97,0x38,0x05,0x11]);
  const after=Uint8Array.from([0x88,0x56,0x77,0x76,0x39,0x01,0x11]);
  assert.deepEqual(knownMirrorSlices(30,1),[{mainStart:1,mirror:0x78C0,length:6}]);
  const writes=surgicalWritesForRecord(30,1,before,after);
  assert.ok(writes.some(w=>w.off===playerOffset(30,1)&&w.kind==='main'));
  assert.ok(!writes.some(w=>w.off===0x78BF));
  for(let i=1;i<=5;i++)assert.ok(writes.some(w=>w.off===0x78C0+(i-1)&&w.value===after[i]&&w.kind==='mirror'));
});

test('build-time reconciliation repairs one-sided Brazil player 1 persisted edits',()=>{
  const rom=new Uint8Array(PLUS.baseSize);
  const main=playerOffset(30,1);
  rom.set([0x88,0x56,0x77,0x76,0x39,0x01,0x11],main);
  rom[0x78BF]=0x08;
  rom.set([0x65,0x78,0x97,0x38,0x05,0x11],0x78C0);
  const out=reconcileKnownPlayerIntegrityMirrors(rom);
  assert.equal(out[0x78BF],0x08);
  assert.deepEqual([...out.slice(0x78C0,0x78C6)],[0x56,0x77,0x76,0x39,0x01,0x11]);
  assert.deepEqual([...rom.slice(0x78C0,0x78C6)],[0x65,0x78,0x97,0x38,0x05,0x11]);
});

test('existing Brazil players 2..7 remain full 7-byte integrity copies',()=>{
  assert.deepEqual(knownMirrorSlices(30,2),[{mainStart:0,mirror:0x78C6,length:7}]);
  assert.deepEqual(knownMirrorSlices(30,7),[{mainStart:0,mirror:0x78E9,length:7}]);
});
