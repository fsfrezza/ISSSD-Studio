import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameImprovementsWriter,GAME_IMPROVEMENT_RANGES} from '../src/core/game-improvements.mjs';
import {experimentalBackpassHooks,buildExperimentalBackpassPenalty} from '../src/core/experimental-backpass-penalty.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {seedCursorTextFixture} from './cursor-text-fixture.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
// The native signature fixture is shared with the ROM validator, not a ROM.
const source=readFileSync(new URL('../src/core/experimental-backpass-penalty.mjs',import.meta.url),'utf8');
const signatures=Function('return '+source.split('const signatures=')[1].split(';\nexport function')[0])();
function fixture(){const base=seedCursorTextFixture(makePlusTacticalFixture());for(const [a,bytes]of signatures)base.set(bytes,((a>>16)&127)*0x8000+(a&0x7FFF));return base;}
const state=enabled=>({specialRulesV1:{schema:'isssd-special-rules-v1',goalkeeperBackpassNoHands:enabled}});
const project=enabled=>({state:{patchesCompact:[],semantic:state(enabled)}});
test('disabled and unselected improvement leave all ROM bytes unchanged',()=>{
 const base=fixture(),work=new Uint8Array(0x400000).fill(255);work.set(base);const before=work.slice();
 gameImprovementsWriter(work,state(false),base);assert.deepEqual(work,before);
 gameImprovementsWriter(work,state(true),base,['jogadores']);assert.deepEqual(work,before);
});
test('selected improvement uses exact validated v4 bytes and rejects conflicting writers',()=>{
 const base=fixture(),before=base.slice(),work=new Uint8Array(0x400000).fill(255);work.set(base);
 const expected=buildExperimentalBackpassPenalty(base);gameImprovementsWriter(work,state(true),base);
 for(const [a,b]of GAME_IMPROVEMENT_RANGES)assert.deepEqual(work.slice(a,b),expected.slice(a,b));
 assert.deepEqual(base,before);work[experimentalBackpassHooks().writes[0][0]]=0x42;
 assert.throws(()=>gameImprovementsWriter(work,state(true),base),/conflito/);
});
test('cumulative export applies entire rule together only in phase 12; deselection restores native hooks',()=>{
 const base=fixture(),snapshots=[];
 const manifest=buildCumulativeProject(base,project(true),{selectedAreas:['infraestrutura','melhorias-jogo'],onRom:(rom,entry)=>snapshots.push({rom,entry})});
 assert.deepEqual(manifest.unassignedLegacyRanges,[]);
 const first=snapshots[0].rom,last=snapshots[1].rom;
 for(const [off,bytes]of experimentalBackpassHooks().writes){
  assert.deepEqual(last.slice(off,off+bytes.length),bytes);
  assert.deepEqual(first.slice(off,off+bytes.length),off<base.length?base.slice(off,off+bytes.length):new Uint8Array(bytes.length).fill(255));
 }
 assert.equal(last[0x7FD8],3);assert.equal(first[0x7FD8],base[0x7FD8]);
 for(const enabled of [false,true]){
  const rom=buildPlusProjectRom(base,project(enabled),{selectedAreas:enabled?['jogadores']:null}).rom;
  for(const [off,bytes]of experimentalBackpassHooks().writes)if(off<base.length)assert.deepEqual(rom.slice(off,off+bytes.length),base.slice(off,off+bytes.length));
 }
});
