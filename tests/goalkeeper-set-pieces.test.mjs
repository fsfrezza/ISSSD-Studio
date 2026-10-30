import test from 'node:test';
import assert from 'node:assert/strict';
import {goalkeeperSetPieceWrites,goalkeeperSetPiecesWriter} from '../src/core/goalkeeper-set-pieces.mjs';
import {gameImprovementsWriter} from '../src/core/game-improvements.mjs';
import {baldPointerHelper} from '../src/core/plus-bald-player-base.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
import {executeHook} from './65816-hook-harness.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {seedCursorTextFixture} from './cursor-text-fixture.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
const both={goalkeeperFreeKickTaker:true,goalkeeperCornerKickTaker:true};
function fixture(){const base=seedCursorTextFixture(makePlusTacticalFixture());for(const w of goalkeeperSetPieceWrites(both))if(w.pc<base.length)base.set(w.original,w.pc);return base;}
function expanded(base){const w=new Uint8Array(0x400000).fill(255);w.set(base);return w;}
const rules=options=>({specialRulesV1:{schema:'isssd-special-rules-v1',...options}});

test('independent menu flags execute the actual 65816 gate for FK, CK and every other picker',()=>{
 for(const [fk,ck]of [[true,false],[false,true],[true,true]]){
  const base=fixture(),work=expanded(base);goalkeeperSetPiecesWriter(work,{goalkeeperFreeKickTaker:fk,goalkeeperCornerKickTaker:ck},base);
  const memory=new Uint8Array(0x1000000);memory.set(work.subarray(0x3FE000,0x400000),0xFFE000);
  for(const picker of [0,1,2,3,4,5])for(const player of [0,1,10]){
   memory[0x1542]=player;memory[0x151e]=picker;
   const s=executeHook(memory,0xFFED00,{dp:0x1500,a:0xFFFF,x:0xABCD,y:0x1234},new Set([0x86AB53,0x86AB70]));
   const allowed=player!==0||(picker===3&&fk)||(picker===4&&ck);
   assert.equal(s.calls[0].target,allowed?0x86AB53:0x86AB70);if(allowed)assert.equal(s.r.a,player);
   assert.equal(s.r.x,0xABCD);assert.equal(s.r.y,0x1234);assert.equal(s.r.s,0x1ff);
  }
 }
});
test('disabled/omitted phase stays native; conflicts reject atomically and source is immutable',()=>{
 const base=fixture(),work=expanded(base),before=work.slice(),original=base.slice();
 gameImprovementsWriter(work,rules({}),base);assert.deepEqual(work,before);
 gameImprovementsWriter(work,rules(both),base,['jogadores']);assert.deepEqual(work,before);
 work[0x3F2000]=0;const conflict=work.slice();assert.throws(()=>gameImprovementsWriter(work,rules(both),base),/conflito/);assert.deepEqual(work,conflict);assert.deepEqual(base,original);
 const incompatible=base.slice();incompatible[0x32B4F]^=1;assert.throws(()=>goalkeeperSetPiecesWriter(expanded(incompatible),both,incompatible),/incompatível/);
});
test('carry pointers are relocated and body-reader wrappers chain the verified appearance helpers',()=>{
 const base=fixture(),work=expanded(base);
 for(const [pc,helper,bank]of [[0x266FB,0x308000,false],[0x26706,0x308200,true]]){
  work.set(baldPointerHelper(bank),helper);work.set([0x22,helper&255,helper>>8&127|128,0xE1],pc);
 }
 goalkeeperSetPiecesWriter(work,both,base);goalkeeperSetPiecesWriter(work,both,base);
 const classify=areaClassifier(work,base);assert.equal(classify(0x266FB),'melhorias-jogo');assert.equal(classify(0x26706),'melhorias-jogo');
 const memory=new Uint8Array(0x1000000);memory.set(work.subarray(0x3FE000,0x400000),0xFFE000);
 for(const [entry,target]of [[0xFFE980,0xE18000],[0xFFEC00,0xE18200]]){
  memory[0x530]=2;const result=executeHook(memory,entry,{dp:0x500,x:0xA3D7},new Set([target]));assert.equal(result.calls[0].target,target);
 }
 for(let i=0;i<256;i+=4){const ptr=work[0x3FEA00+i]|work[0x3FEA01+i]<<8|work[0x3FEA02+i]<<16;const pc=((ptr>>16)&127)*32768+(ptr&32767);assert(pc>=0x3F2000&&pc+1028<=0x3FC444);assert.equal(work[pc+1],2);}
 assert.equal(work[0x3E0000],255);assert.equal(work[0x3E8000],255);
});
test('cumulative phase 12 owns all goalkeeper changes and rebuilding disabled restores native code',()=>{
 const base=fixture(),project={state:{patchesCompact:[],semantic:rules(both)}},snapshots=[];
 const manifest=buildCumulativeProject(base,project,{selectedAreas:['infraestrutura','melhorias-jogo'],onRom:(rom,entry)=>snapshots.push({rom,entry})});
 assert.deepEqual(manifest.unassignedLegacyRanges,[]);
 for(const w of goalkeeperSetPieceWrites(both))assert.deepEqual(snapshots[1].rom.subarray(w.pc,w.pc+w.data.length),w.data);
 for(const selectedAreas of [null,['jogadores']]){
  const rom=buildPlusProjectRom(base,{state:{patchesCompact:[],semantic:rules(selectedAreas?both:{})}},{selectedAreas}).rom;
  assert.deepEqual(rom.slice(0x32B4F,0x32B53),base.slice(0x32B4F,0x32B53));
 }
});
