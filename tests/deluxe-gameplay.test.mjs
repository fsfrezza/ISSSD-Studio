import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {executeHook} from './65816-hook-harness.mjs';
import {LOW_GOAL_KICK_HELPER,applyDeluxeGameplay} from '../src/core/deluxe-gameplay.mjs';
import {buildDeluxeProject,createDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,projectPath=process.env.ISSSD_GG_RECOVERED_PROJECT;
test('Plus low kick helper handles both keepers, B, other buttons, CPU and outfield players',()=>{
 for(const keeper of [0x500,0x1000,0x600])for(const button of [0,0x8000,0x80,0x8080]){const m=new Uint8Array(0x1000000);m.set(LOW_GOAL_KICK_HELPER,0x85fec0);const controller=keeper===0x500?0x1aa0:0x1ad0;m[controller+0x8e]=button&255;m[controller+0x8f]=button>>8;const {r}=executeHook(m,0x85fec0,{x:keeper,dp:keeper,a:0x9999});assert.equal(r.dp,keeper);assert.equal(r.x,keeper!==0x600&&button===0x8000?10:11);assert.equal(m[controller+0x8e]|m[controller+0x8f]<<8,keeper===0x600?button:0);}
});
test('Deluxe gameplay switches preserve the original and reject unknown options or overlapping writes',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 for(const ids of [['low-goal-kick'],['backpass'],['low-goal-kick','backpass']]){p.changes.improvements=ids;const out=(await buildDeluxeProject(file,p)).rom.slice(p.base.headerSize);assert.equal(out.length,ids.includes('backpass')?0x400000:0x200000);assert.equal(out[0x7fd8],ids.includes('backpass')?3:base[0x7fd8]);if(ids.includes('low-goal-kick'))assert.deepEqual(out.slice(0x2fec0,0x2feec),LOW_GOAL_KICK_HELPER);else assert.deepEqual(out.slice(0x2ef47,0x2ef4c),base.slice(0x2ef47,0x2ef4c));assert.deepEqual(out.slice(0x50000,0x52000),base.slice(0x50000,0x52000));}
 assert.throws(()=>applyDeluxeGameplay(base,base,['unknown']),/sem patch/);const occupied=base.slice();occupied[0x2fec0]=0;assert.throws(()=>applyDeluxeGameplay(occupied,base,['low-goal-kick']),/conflito/);p.changes.improvements=[];assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});
test('both gameplay options roundtrip alongside all sixty teams, visuals, tactics and secret GG',{skip:!fixture||!projectPath},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),p=JSON.parse(fs.readFileSync(projectPath)),before=structuredClone(p);p.changes.improvements=['low-goal-kick','backpass'];const result=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p)));assert.equal(result.rom.length,0x400000+p.base.headerSize);const plain=await buildDeluxeProject(file,before),a=result.rom.slice(result.base.headerSize),b=plain.rom.slice(plain.base.headerSize);for(const [start,end]of [[0x176500,0x17e1c4],[0x200000,0x243a00],[0x24c000,0x24e000]])assert.deepEqual(a.slice(start,end),b.slice(start,end));p.changes.improvements=before.changes.improvements;assert.deepEqual(p,before);
});
