import test from 'node:test';
import assert from 'node:assert/strict';
import {executeHook} from './65816-hook-harness.mjs';
import {experimentalBackpassHooks,BACKPASS_EXPERIMENT_EVENT,BACKPASS_HANDS_DELAY_FRAMES,BACKPASS_PENALTY_TRANSITION_FRAMES,buildExperimentalBackpassPenalty} from '../src/core/experimental-backpass-penalty.mjs';

const write=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>8;};
const read=(m,a)=>m[a]|m[a+1]<<8;
const flags=[0x28,0x28,0x28,0x89,0x0F,0x0F,0x8F,0x28,0,0x60,0,1,8,8,0,0x80,8,8,0x10,0x90,0,0,0x0D,8,0x15,0x40,0,0,0,0,0x30,0x60,0x90];
function fixture(keeper=0x500){
 const m=new Uint8Array(0x1000000),h=experimentalBackpassHooks();m.set(h.hands,h.entry);m.set(h.restart,h.dispatch);m.set(h.blank,h.transition);m.set(h.manual,h.manualEntry);m.set(flags,0x81DB1E);
 const own=keeper===0x500?0xD00:0xE00,opp=own===0xD00?0xE00:0xD00,passer=keeper+0x100;
 for(const [a,v]of [[0x70,8],[keeper+0x30,1],[keeper+0x32,0x608],[keeper+0x70,48],[keeper+0x78,2],[keeper+0x9A,own],[keeper+0x88,opp],[passer+0x9A,own],[0xC8,keeper],[0x12A0,passer],[0x12F4,0xE],[0x11FA,0x40],[opp+0xD4,keeper===0x500?0x1100:0x600],[own+0xA4,0x8080],[opp+0xA4,3]])write(m,a,v);
 return {m,h,keeper,own,opp,passer};
}
const stops=new Set([0x84EB85,0x84EB92,0x84EB76,0x80D38E,0xA4DE9F,0xA4DC03,0x8082E0,0xA4DAC6,0x85F8B9,0x85EE9B]);
const initial=dp=>({a:0x1234,x:0x2345,y:0x3456,p:0x85,dp,s:0x1AF,db:0x81});
test('both keepers finish standing and hold the ball for 30 gameplay ticks before penalty',()=>{
 for(const keeper of [0x500,0x1000]){
  const {m,h,opp}=fixture(keeper);
  for(let tick=0;tick<=BACKPASS_HANDS_DELAY_FRAMES;tick++){
   const result=executeHook(m,h.entry,initial(keeper),stops);
   assert.deepEqual(result.calls.map(c=>c.target),[0x84EB92]);
   assert.deepEqual(result.r,{...initial(keeper),a:keeper,p:5});
   assert.equal(read(m,0xA6),keeper);
   if(tick<BACKPASS_HANDS_DELAY_FRAMES){assert.equal(read(m,0xBA),0);write(m,keeper+0x70,read(m,keeper+0x70)-1);}
   else {assert.equal(read(m,0xBA),BACKPASS_EXPERIMENT_EVENT);assert.equal(read(m,0xC4),keeper);assert.equal(read(m,0xC6),read(m,opp+0xD4));}
  }
 }
});
test('feet, rising animation, legal headers, adversary shots, own release and restarts stay native',()=>{
 const variants=[
  f=>write(f.m,f.keeper+0x32,0x600), // rising is not yet standing
  f=>write(f.m,0x11FA,0x80), // foot possession
  f=>write(f.m,0x12F4,0),
  f=>write(f.m,f.keeper+0x78,0x1A), // native legal header flag
  f=>write(f.m,f.passer+0x9A,f.opp),
  f=>write(f.m,0x12A0,f.keeper),
  f=>write(f.m,0xC8,f.passer),
  f=>write(f.m,f.keeper+0x30,0x102),
  f=>write(f.m,0xBA,3),f=>write(f.m,0xBC,3),f=>write(f.m,0xC0,6),
  f=>write(f.m,0x12A0,0),f=>write(f.m,0x12A0,0x601),f=>write(f.m,0x12A0,0x1B00),
  f=>write(f.m,0x70,0x11),f=>write(f.m,f.keeper+0x78,0xFFFF),
 ];
 for(const change of variants){const f=fixture();change(f);write(f.m,f.keeper+0x70,18);const {calls}=executeHook(f.m,f.h.entry,initial(f.keeper),stops);assert.deepEqual(calls.map(c=>c.target),[0x84EB85]);assert.equal(read(f.m,0xC4),0);}
});
test('old any-contact and ball-release sites are no longer patched',()=>{
 const {writes}=experimentalBackpassHooks();const offsets=writes.map(([at])=>at);
 assert.ok(!offsets.includes(0x23A01));assert.ok(!offsets.includes(0x2F8C5));
 assert.ok(offsets.includes(0x26B81));
});
test('private restart chooses adversary, native penalty setup and its transition postlude',()=>{
 const {m,h,own,opp}=fixture();write(m,0xC4,0x500);write(m,0xC6,0x1100);write(m,0xBC,BACKPASS_EXPERIMENT_EVENT);write(m,0xBA,BACKPASS_EXPERIMENT_EVENT);write(m,0x12DE,2);
 const result=executeHook(m,h.dispatch,{dp:0},stops);
 assert.deepEqual(result.calls.map(c=>c.target),[0x80D38E,0xA4DE9F]);
 assert.equal(read(m,0xE6),BACKPASS_PENALTY_TRANSITION_FRAMES);assert.equal(read(m,0xBA),3);assert.equal(read(m,0xBC),3);assert.equal(read(m,0x12DE),0);
 assert.equal(read(m,own+0xA4),0x8000);assert.equal(read(m,opp+0xA4),0x83);
});
test('ordinary restarts preserve the native table',()=>{
 const {m,h}=fixture();write(m,0xBC,3);const {calls}=executeHook(m,h.dispatch,{dp:0},stops);
 assert.deepEqual(calls.map(c=>c.target),[0x80D38E,0xA4DC03]);
});
test('penalty transition forces blank before loading screens; other transitions stay native',()=>{
 for(const state of [6,3]){
  const {m,h}=fixture();write(m,0xC2,state);write(m,0x1EA0,15);write(m,0x1EA2,0x81);m[0x2101]=0xA5;
  const {calls,r}=executeHook(m,h.transition,{p:5,dp:0},stops);
  assert.deepEqual(calls.map(c=>c.target),[0xA4DAC6]);
  assert.equal(read(m,0x1EA0),state===6?0x80:15);assert.equal(read(m,0x1EA2),0x81);assert.equal(m[0x2101],0xA5);if(state===6)assert.equal(m[0x2100],0x80);
  assert.equal(read(m,0x1E6C),0xFFFF);assert.equal(r.a,0xFFFF);assert.equal(r.p,0x85);
 }
});
test('writer rejects incompatible bases without mutating them',()=>{
 const base=new Uint8Array(0x200000),before=base.slice();assert.throws(()=>buildExperimentalBackpassPenalty(base),/divergente/);assert.deepEqual(base,before);
 assert.throws(()=>buildExperimentalBackpassPenalty(new Uint8Array(0x400000)),/2 MiB/);
});

test('infracting keeper cannot distribute the ball during the whistle and fade',()=>{
 const {m,h,keeper}=fixture();write(m,0xC2,6);write(m,0xC4,keeper);write(m,0xBA,3);write(m,keeper+0x70,0);
 const {calls}=executeHook(m,h.entry,initial(keeper),stops);
 assert.deepEqual(calls.map(c=>c.target),[0x84EB76]);assert.equal(read(m,0xBA),3);
});

test('manual diving catch preserves incoming pass kind before native possession overwrites it',()=>{
 for(const action of [2,0x1A]){
  const {m,h,keeper}=fixture();write(m,0x12F4,action);write(m,keeper+0x78,0x400);
  const {calls,r}=executeHook(m,h.manualEntry,initial(keeper),stops);
  assert.equal(read(m,keeper+0x78),action);assert.equal(r.a,0x1234);assert.equal(r.x,0x0E);
  assert.deepEqual(calls.map(c=>c.target),[0x85F8B9,0x85EE9B]);
 }
});
