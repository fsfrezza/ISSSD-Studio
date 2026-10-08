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
  const base=new Uint8Array(PLUS.baseSize);
  const main=playerOffset(30,1);
  base.set([0x89,0x65,0x78,0x97,0x38,0x05,0x11],main);
  base[0x78BF]=0x08;
  base.set([0x65,0x78,0x97,0x38,0x05,0x11],0x78C0);
  const patched=base.slice();
  patched.set([0x88,0x56,0x77,0x76,0x39,0x01,0x11],main);
  const out=reconcileKnownPlayerIntegrityMirrors(base,patched);
  assert.equal(out[0x78BF],0x08);
  assert.deepEqual([...out.slice(0x78C0,0x78C6)],[0x56,0x77,0x76,0x39,0x01,0x11]);
  assert.deepEqual([...base.slice(0x78C0,0x78C6)],[0x65,0x78,0x97,0x38,0x05,0x11]);
});

test('reconciliation preserves pre-existing base mismatch when project did not touch either side',()=>{
  const base=new Uint8Array(PLUS.baseSize);
  const main=playerOffset(30,7);
  const mirror=0x78E9;
  base[main+6]=0x55;
  base[mirror+6]=0x66;
  const out=reconcileKnownPlayerIntegrityMirrors(base,base);
  assert.equal(out[main+6],0x55);
  assert.equal(out[mirror+6],0x66);
  assert.deepEqual(out,base);
});

test('reconciliation rejects conflicting persisted edits on both sides',()=>{
  const base=new Uint8Array(PLUS.baseSize);
  const main=playerOffset(30,2);
  const mirror=0x78C6;
  base[main]=0x77;
  base[mirror]=0x77;
  const patched=base.slice();
  patched[main]=0x56;
  patched[mirror]=0x44;
  assert.throws(()=>reconcileKnownPlayerIntegrityMirrors(base,patched),/conflicting persisted Plus integrity edits/i);
});

test('existing Brazil players 2..7 remain full 7-byte integrity copies',()=>{
  assert.deepEqual(knownMirrorSlices(30,2),[{mainStart:0,mirror:0x78C6,length:7}]);
  assert.deepEqual(knownMirrorSlices(30,7),[{mainStart:0,mirror:0x78E9,length:7}]);
});
