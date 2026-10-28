import test from 'node:test';
import assert from 'node:assert/strict';
import {executeHook} from './65816-hook-harness.mjs';
import {experimentalBackpassHooks,BACKPASS_EXPERIMENT_EVENT,buildExperimentalBackpassPenalty} from '../src/core/experimental-backpass-penalty.mjs';

const write=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>8;};
const read=(m,a)=>m[a]|m[a+1]<<8;
function fixture(keeper=0x500){
 const m=new Uint8Array(0x1000000),h=experimentalBackpassHooks();m.set(h.contact,h.entry);m.set(h.restart,h.dispatch);m.set(h.capture,h.captureEntry);
 const own=keeper===0x500?0xD00:0xE00,opp=own===0xD00?0xE00:0xD00,passer=keeper+0x100;
 for(const [a,v]of [[0x70,8],[keeper+0x30,1],[keeper+0x9A,own],[keeper+0x88,opp],[passer+0x9A,own],[0xC8,passer],[opp+0xD4,keeper===0x500?0x1100:0x600],[own+0xA4,0x8080],[opp+0xA4,3]])write(m,a,v);
 return {m,h,keeper,own,opp,passer};
}
const stops=new Set([0x84B9EB,0x85F91D,0x84BA05,0x80D38E,0xA4DE9F,0xA4DC03,0x85F8CB]);
const initial=dp=>({a:0x1234,x:0x2345,y:0x3456,p:0x85,dp,s:0x1AF,db:0x81});
test('both keepers: teammate contact schedules a penalty and aborts capture',()=>{
 for(const keeper of [0x500,0x1000]){
  const {m,h,opp}=fixture(keeper),before=initial(keeper),result=executeHook(m,h.entry,before,stops);
  assert.equal(read(m,0xBA),BACKPASS_EXPERIMENT_EVENT);assert.equal(read(m,0xC4),keeper);assert.equal(read(m,0xC6),read(m,opp+0xD4));
  assert.deepEqual(result.r,before);assert.deepEqual(result.calls.map(c=>c.target),[0x84B9EB]);
 }
});
test('opponent shots, keeper release, outfield contact and active restarts follow original path',()=>{
 const variants=[f=>write(f.m,f.passer+0x9A,f.opp),f=>write(f.m,0xC8,f.keeper),f=>write(f.m,f.keeper+0x30,0x102),f=>write(f.m,0xBA,3),f=>write(f.m,0xBC,3),f=>write(f.m,0xC0,6),f=>write(f.m,0xC8,0),f=>write(f.m,0xC8,0x601),f=>write(f.m,0x70,0x11)];
 for(const change of variants){const f=fixture();change(f);const {calls,r}=executeHook(f.m,f.h.entry,initial(f.keeper),stops);assert.deepEqual(calls.map(c=>c.target),[0x85F91D,0x84BA05]);assert.equal(r.dp,f.keeper);assert.equal(read(f.m,0xC4),0);}
});
test('private restart selects opposing possession and enters native penalty preparation',()=>{
 const {m,h,own,opp}=fixture();write(m,0xC4,0x500);write(m,0xC6,0x1100);write(m,0xBC,BACKPASS_EXPERIMENT_EVENT);write(m,0xBA,BACKPASS_EXPERIMENT_EVENT);write(m,0x12DE,2);
 const result=executeHook(m,h.dispatch,{dp:0},stops);
 assert.deepEqual(result.calls.map(c=>c.target),[0x80D38E,0xA4DE9F]);
 assert.equal(read(m,0xE6),0x100);assert.equal(read(m,0xBA),3);assert.equal(read(m,0xBC),3);assert.equal(read(m,0x12DE),0);
 assert.equal(read(m,own+0xA4),0x8000);assert.equal(read(m,opp+0xA4),0x83);
});
test('ordinary restart preserves native table dispatch',()=>{
 const {m,h}=fixture();write(m,0xBC,3);const result=executeHook(m,h.dispatch,{dp:0},stops);
 assert.deepEqual(result.calls.map(c=>c.target),[0x80D38E,0xA4DC03]);assert.equal(read(m,0xBC),3);
});
test('writer rejects a mismatched or expanded base without mutating it',()=>{
 const base=new Uint8Array(0x200000),before=base.slice();assert.throws(()=>buildExperimentalBackpassPenalty(base),/divergente/);assert.deepEqual(base,before);
 assert.throws(()=>buildExperimentalBackpassPenalty(new Uint8Array(0x400000)),/2 MiB/);
});

test('alternate ball-possession entry schedules penalty and preserves native setup',()=>{
 const {m,h,keeper}=fixture();write(m,0x17CA,4);write(m,0xAE,5);
 const result=executeHook(m,h.captureEntry,initial(keeper),stops);
 assert.equal(read(m,0xBA),BACKPASS_EXPERIMENT_EVENT);
 assert.equal(read(m,0x17CA),0);assert.equal(read(m,0xAE),0);
 assert.deepEqual(result.calls.map(c=>c.target),[0x85F8CB]);
});
