import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {independentTacticalCopyHelper,independentPreMatchNameHelper} from '../src/core/plus-independent-teams.mjs';
import {GG_DEFAULT_442,GG_NATIVE_SHADOW,independentKitColors} from '../src/core/independent-teams.mjs';
import {decodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';
import {renderSmallTeamName} from '../src/core/plus-team-names.mjs';
import {executeHook} from './65816-hook-harness.mjs';
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),word=(m,p,v)=>{m[p]=v&255;m[p+1]=v>>8;};
test('coordinate and role MVNs follow the selected tactical bank and preserve flags, DB and stack',()=>{
 for(const bank of [0x8B,0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xDD])for(const n of [20,10]){
  const m=new Uint8Array(0x1000000);m.set(independentTacticalCopyHelper(),0xE00000);word(m,4,bank);m.fill(0xEE,0x8B9000,0x8B9020);const payload=Uint8Array.from({length:n},(_,i)=>i+1);m.set(payload,(bank<<16)+0x9000);m.fill(0xAA,0x7E156B,0x7E1581);
  const{r}=executeHook(m,0xE00000,{a:n-1,x:0x9000,y:0x156C,db:0x81,p:9});assert.deepEqual(m.slice(0x7E156C,0x7E156C+n),payload);assert.equal(m[0x7E156B],0xAA);assert.equal(m[0x7E156C+n],0xAA);assert.equal(r.x,0x9000+n);assert.equal(r.y,0x156C+n);assert.equal(r.a,65535);assert.equal(r.db,0x81);assert.equal(r.p,9);assert.equal(r.s,0x1FF);
 }
});
test('pre-match name uploads use the full-name immutable cache for both opponents, including added IDs',()=>{
 const cache=0x2DB000;
 for(const id of [0,30,54,55,56,57,58,59])for(const side of [0,2]){
  const m=new Uint8Array(0x1000000);m.set(independentPreMatchNameHelper(cache),0xE00000);word(m,0x82F7F7+side,side?0x5F90:0x5F50);
  const{r,calls}=executeHook(m,0xE00000,{a:id*2,x:side},new Set([0x808E37]));assert.equal(calls.length,1);assert.equal(calls[0].a,(cpu(cache)&65535)+id*64);assert.equal(calls[0].x,64);assert.equal(calls[0].y,side?0x5F90:0x5F50);assert.equal(m[0],cpu(cache)>>16);assert.equal(r.s,0x1FF);
 }
});
test('both shipped projects start all six teams in the same native 4-4-2, preserve dark shadows and retain complete group names',()=>{
 for(const file of ['International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj','International-Superstar-Soccer-Deluxe-Plus-projeto-recuperado.issdproj']){
  const project=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url)));for(const team of Object.values(project.state.semantic.independentTeamsV1.teams)){
   assert.deepEqual(team.data.tactics,[...GG_DEFAULT_442]);const f=decodePlusTacticalRecord(Uint8Array.from(team.data.tactics));assert.equal(f.formationIndex,1);assert.deepEqual(['DF','MC','AT'].map(c=>f.players.filter(p=>p.className===c).length),[4,4,2]);assert.ok(f.players.every(p=>p.x>=-57&&p.x<=57&&p.y>=-39&&p.y<=39));
   for(const kit of ['home','away'])assert.equal(team.data.palettes[kit][32]|team.data.palettes[kit][33]<<8,GG_NATIVE_SHADOW);
   const rendered=renderSmallTeamName(team.name);assert.ok(rendered.width<=32);assert.notDeepEqual(rendered.raw,renderSmallTeamName(team.short).raw);
  }
 }
 for(const colors of [['#FFFFFF','#D82020'],['#001840','#FFFFFF']])assert.equal(independentKitColors(...colors)[8],GG_NATIVE_SHADOW);
});
