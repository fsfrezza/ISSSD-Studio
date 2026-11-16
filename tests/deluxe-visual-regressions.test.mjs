import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {executeHook} from './65816-hook-harness.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,projectPath=process.env.ISSSD_GG_RECOVERED_PROJECT;
const word=(b,p)=>b[p]|b[p+1]<<8,long=(b,p)=>word(b,p)|b[p+2]<<16,pc=c=>((c>>>16)&127)*32768+(c&32767);
test('jersey DMA keeps native numbers and blank tiles in bank 98 for every team',{skip:!fixture||!projectPath},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),project=JSON.parse(fs.readFileSync(projectPath)),built=await buildDeluxeProject(file,project),out=built.rom.slice(built.base.headerSize);
 const entry=long(out,0x26817),m=new Uint8Array(0x1000000);m.set(out.slice(pc(entry),pc(entry)+32),entry);
 const count=project.changes.structure.teams.length;
 for(let team=0;team<count;team++){
  for(const source of [0xf014,0xe5d4,0xe854,0xead4,0xed54,0xeff4]){
   const result=executeHook(m,entry,{a:source,x:team*2});assert.equal(result.r.a,0x9880);
  }
  for(let frame=0;frame<8;frame++)assert.equal(executeHook(m,entry,{a:0x8000+team*256+frame*32,x:team*2}).r.a,0xc680);
 }
});
test('custom title disables both native overlay calls and formation object is centered',{skip:!fixture||!projectPath},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),project=JSON.parse(fs.readFileSync(projectPath)),built=await buildDeluxeProject(file,project),out=built.rom.slice(built.base.headerSize);
 if(project.changes.titleScreen?.map0){for(const p of [0x5d475,0x5d672])assert.deepEqual([...out.slice(p,p+10)],Array(10).fill(0xea));}
 if(Object.keys(project.changes.teamPhotoDrafts??{}).length){
  const helper=pc(long(out,0x2afa1)),sig=[0x8b,0xa9,47,0,0xa2],offset=out.slice(helper,helper+200).findIndex((_,i,a)=>sig.every((v,j)=>a[i+j]===v));assert.ok(offset>=0);
  const at=helper+offset,table=pc(word(out,at+5)|out[at+12]<<16);
  for(let i=0;i<24;i++){assert.equal(word(out,table+48+i*2),8+(i%6)*16);assert.equal(word(out,table+96+i*2),8+Math.floor(i/6)*16);}
 }
});
