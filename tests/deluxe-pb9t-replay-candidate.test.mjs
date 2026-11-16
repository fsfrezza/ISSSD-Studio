import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';import {applyDeluxeGameplay,PENALTY_INPUT_HELPER} from '../src/core/deluxe-gameplay.mjs';
import {applyPB9TReplayCandidate,PB9T_REPLAY_CANDIDATE} from '../src/core/deluxe-pb9t-replay-candidate.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,pb9t=process.env.ISSSD_PB9T_ROM;
test('reachable PB9T helper matches the reference and does not overlap the Plus penalty input fix',{skip:!fixture||!pb9t},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,ref=new Uint8Array(fs.readFileSync(pb9t));assert.deepEqual(ref.slice(0x27fb3,0x27fb3+PB9T_REPLAY_CANDIDATE.length),PB9T_REPLAY_CANDIDATE);
 const input=applyDeluxeGameplay(base,base,['penalty-interference']),out=applyPB9TReplayCandidate(input,base);assert.deepEqual(out.slice(0x26a1c,0x26a1f),Uint8Array.of(0x20,0xdb,0xff));assert.deepEqual(out.slice(0x27fc0,0x27fc0+PENALTY_INPUT_HELPER.length),PENALTY_INPUT_HELPER);assert.deepEqual(out.slice(0x27fdb,0x27fdb+PB9T_REPLAY_CANDIDATE.length),PB9T_REPLAY_CANDIDATE);assert.deepEqual(input.slice(0x26a1c,0x26a1f),base.slice(0x26a1c,0x26a1f));
});
