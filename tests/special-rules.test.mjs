import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameImprovementsWriter,GAME_IMPROVEMENT_RANGES} from '../src/core/game-improvements.mjs';
import {goalkeeperSetPieceWrites} from '../src/core/goalkeeper-set-pieces.mjs';
import {experimentalBackpassHooks,buildExperimentalBackpassPenalty} from '../src/core/experimental-backpass-penalty.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {seedCursorTextFixture} from './cursor-text-fixture.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
// The native signature fixture is shared with the ROM validator, not a ROM.
const source=readFileSync(new URL('../src/core/experimental-backpass-penalty.mjs',import.meta.url),'utf8');
const signatures=Function('return '+source.split('const signatures=')[1].split(';\nexport function')[0])();
function fixture(){const base=seedCursorTextFixture(makePlusTacticalFixture());for(const [a,bytes]of signatures)base.set(bytes,((a>>16)&127)*0x8000+(a&0x7FFF));for(const [a,bytes]of [[0xA4DD45,[0x20,0x4C,0xE0,0x0B,0xAD,0xC6,0,0x5B,0x22,0x78,0xD9,0x80]],[0xA4DD51,[0x2B,0xB0,3,0x4C,0x9F,0xDE]],[0x848544,[0x20,0x4E,0x85,0x6B]],[0x85EECE,[0xA2,0,0,0x22,0xC5,0xF8,0x85,0x8E,0xA6,0,0x6B]]])base.set(bytes,((a>>16)&127)*0x8000+(a&32767));return base;}
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

test('free-kick project export applies its exclusive decision hook and preserves original/off and legacy penalty choices',()=>{
 const base=fixture(),before=base.slice(),p=project(true);p.state.semantic.specialRulesV1.goalkeeperBackpassPunishment='free-kick';
 const free=buildPlusProjectRom(base,JSON.parse(JSON.stringify(p))).rom;
 const hook=0x125D51,original=base.slice(hook,hook+6);
 for(const [off,bytes]of experimentalBackpassHooks({punishment:'free-kick'}).writes)assert.deepEqual(free.slice(off,off+bytes.length),bytes);
 assert.notDeepEqual(free.slice(hook,hook+6),original);
 const penalty=buildPlusProjectRom(base,project(true)).rom;assert.deepEqual(penalty.slice(hook,hook+6),original);
 p.state.semantic.specialRulesV1.goalkeeperBackpassNoHands=false;
 const off=buildPlusProjectRom(base,p).rom;assert.deepEqual(off.slice(hook,hook+6),original);assert.deepEqual(base,before);
 const snapshots=[];p.state.semantic.specialRulesV1.goalkeeperBackpassNoHands=true;
 buildCumulativeProject(base,p,{selectedAreas:['infraestrutura','melhorias-jogo'],onRom:(rom,entry)=>snapshots.push(rom)});
 assert.deepEqual(snapshots[0].slice(hook,hook+6),original);assert.deepEqual(snapshots[1].slice(hook,hook+6),free.slice(hook,hook+6));
 assert.throws(()=>gameImprovementsWriter(new Uint8Array(free),{specialRulesV1:{goalkeeperBackpassNoHands:true,goalkeeperBackpassPunishment:'invalid'}},base),/inválida/);
});

test('free-kick backpass and both goalkeeper taker choices coexist and reject conflicts before writing',()=>{
 const base=fixture(),both={goalkeeperFreeKickTaker:true,goalkeeperCornerKickTaker:true};
 for(const w of goalkeeperSetPieceWrites(both))if(w.pc<base.length)base.set(w.original,w.pc);
 const semantic={specialRulesV1:{...both,goalkeeperBackpassNoHands:true,goalkeeperBackpassPunishment:'free-kick'}};
 const work=new Uint8Array(0x400000).fill(255);work.set(base);gameImprovementsWriter(work,semantic,base);
 for(const [off,bytes]of experimentalBackpassHooks({punishment:'free-kick'}).writes)assert.deepEqual(work.slice(off,off+bytes.length),bytes);
 for(const w of goalkeeperSetPieceWrites(both))assert.deepEqual(work.slice(w.pc,w.pc+w.data.length),w.data);
 const conflict=new Uint8Array(0x400000).fill(255);conflict.set(base);conflict[0x125D51]^=1;const before=conflict.slice();
 assert.throws(()=>gameImprovementsWriter(conflict,semantic,base),/conflito/);assert.deepEqual(conflict,before);
});
