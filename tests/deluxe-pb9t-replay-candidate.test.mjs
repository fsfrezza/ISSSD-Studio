import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';import {applyDeluxeGameplay,PENALTY_INPUT_HELPER} from '../src/core/deluxe-gameplay.mjs';
import {applyPB9TReplayCandidate,PB9T_REPLAY_CANDIDATE} from '../src/core/deluxe-pb9t-replay-candidate.mjs';
import {executeHook} from './65816-hook-harness.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,pb9t=process.env.ISSSD_PB9T_ROM;
test('reachable PB9T helper matches the reference and does not overlap the Plus penalty input fix',{skip:!fixture||!pb9t},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,ref=new Uint8Array(fs.readFileSync(pb9t));assert.deepEqual(ref.slice(0x27fb3,0x27fb3+PB9T_REPLAY_CANDIDATE.length),PB9T_REPLAY_CANDIDATE);
 const input=applyDeluxeGameplay(base,base,['penalty-interference']),out=applyPB9TReplayCandidate(input,base);assert.deepEqual(out.slice(0x26a1c,0x26a1f),Uint8Array.of(0x20,0xdb,0xff));assert.deepEqual(out.slice(0x27fc0,0x27fc0+PENALTY_INPUT_HELPER.length),PENALTY_INPUT_HELPER);assert.deepEqual(out.slice(0x27fdb,0x27fdb+PB9T_REPLAY_CANDIDATE.length),PB9T_REPLAY_CANDIDATE);assert.deepEqual(input.slice(0x26a1c,0x26a1f),base.slice(0x26a1c,0x26a1f));
});
test('relocated PB9T routine retains controller handling and restores native Y',()=>{
 const m=new Uint8Array(0x1000000);
 m.set(PB9T_REPLAY_CANDIDATE,0x84fdb0);m.set(PB9T_REPLAY_CANDIDATE,0x84ffdb);
 const x=0x1aa0,write=(a,v)=>{m[a]=v&255;m[a+1]=v>>8;},read=a=>m[a]|m[a+1]<<8;
 for(const p1 of [0,0x20,0x8000,0x8020])for(const p2 of [0,0x20,0x8000,0x8020]){
  write(0x28,p1);write(0x2a,p2);write(x+0x8e,0x1234);
  const original=executeHook(m,0x84fdb0,{x,y:0x9999});
  const expected=read(x+0x8e);write(x+0x8e,0x1234);
  const moved=executeHook(m,0x84ffdb,{x,y:0x9999});
  assert.deepEqual(moved.r,original.r);assert.equal(read(x+0x8e),expected);
  assert.equal(moved.r.y,0x24);assert.equal(moved.r.x,x);assert.equal(read(0x28),p1);assert.equal(read(0x2a),p2);
 }
});
