import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {executeHook} from './65816-hook-harness.mjs';
import {LOW_GOAL_KICK_HELPER,PENALTY_INPUT_HELPER,SECRET_CONTROLLERS_HELPER,DELUXE_GAMEPLAY_IDS,applyDeluxeGameplay} from '../src/core/deluxe-gameplay.mjs';
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

test('Plus penalty input guard keeps original carry/result and only clears the intended input',()=>{
 for(const edge of [0,0x8000])for(const held of [0,0x20])for(const restart of [0,6]){const m=new Uint8Array(0x1000000),x=0x1aa0,y=0;m.set(PENALTY_INPUT_HELPER,0x84ffc0);m[0x20]=held;m[x+0x22]=3;m[x+0x8e]=0x44;m[0xc2]=restart;const {r}=executeHook(m,0x84ffc0,{a:edge,x,y});assert.equal(m[x+0x8e],edge===0x8000&&!(held&0x20)?(restart===0?0:held):0x44);assert.equal(r.a,1);assert.equal(r.p&1,1);assert.equal(r.x,x);assert.equal(r.y,y);}
});
test('secret controller adapter combines input only during native detection and restores caller state',()=>{
 for(const [p1,p2]of [[0x800,0],[0,0x800],[0,0]]){const m=new Uint8Array(0x1000000);m.set(SECRET_CONTROLLERS_HELPER,0x80fa00);m[0x28]=p1&255;m[0x29]=p1>>8;m[0x2a]=p2&255;m[0x2b]=p2>>8;const initial={a:0x1234,x:0x2345,y:0x3456,p:5,dp:0},result=executeHook(m,0x80fa00,initial,new Set([0x80f50d]));assert.equal(result.calls.length,1);assert.equal(result.calls[0].a,p1|p2);assert.equal(m[0x2a]|m[0x2b]<<8,p2);for(const key of Object.keys(initial))assert.equal(result.r[key],initial[key]);}
});
test('new options match native signatures, combine with earlier gameplay and restore exactly',{skip:!fixture||!projectPath},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=JSON.parse(fs.readFileSync(projectPath)),original=await buildDeluxeProject(file,p);for(const id of ['penalty-interference','controller-one-codes']){p.changes.improvements=[id];const out=(await buildDeluxeProject(file,p)).rom.slice(p.base.headerSize);if(id==='penalty-interference')assert.deepEqual(out.slice(0x27fc0,0x27fda),PENALTY_INPUT_HELPER);else assert.deepEqual(out.slice(0x7a00,0x7a00+SECRET_CONTROLLERS_HELPER.length),SECRET_CONTROLLERS_HELPER);}
 p.changes.improvements=[...DELUXE_GAMEPLAY_IDS];await buildDeluxeProject(file,JSON.parse(JSON.stringify(p)));p.changes.improvements=[];assert.deepEqual((await buildDeluxeProject(file,p)).rom,original.rom);assert.deepEqual(base.slice(0x7513,0x7515),Uint8Array.of(0xa5,0x2a));
});
