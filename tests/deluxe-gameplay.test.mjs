import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {executeHook} from './65816-hook-harness.mjs';
import {LOW_GOAL_KICK_HELPER,PENALTY_INPUT_HELPER,SECRET_CONTROLLERS_HELPER,DELUXE_GAMEPLAY_IDS,applyDeluxeGameplay} from '../src/core/deluxe-gameplay.mjs';
import {buildDeluxeProject,createDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {SECRET_REWARDS_HELPER,SECRET_COMPARE_HELPER} from '../src/core/deluxe-gameplay.mjs';
import {GOLDEN_BALL_BUTTONS,GOLDEN_BALL_MATCHER,GOLDEN_BALL_PALETTE_SELECTOR,GOLDEN_BALL_INIT,goldenBallPalette} from '../src/core/deluxe-golden-ball.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,projectPath=process.env.ISSSD_GG_RECOVERED_PROJECT;
test('BALL has independent state, rejects wrong keys and preserves native detector inputs',()=>{
 const m=new Uint8Array(0x1000000);m.set(GOLDEN_BALL_MATCHER,0x80fac0);m.set(GOLDEN_BALL_BUTTONS,0x80fb00);m.set(GOLDEN_BALL_INIT,0x80fb40);
 const set=(a,v)=>{m[a]=v&255;m[a+1]=v>>8;},read=a=>m[a]|m[a+1]<<8;
 const initial={a:0x1234,x:0x5678,y:0x123,p:1};
 for(const [key,state] of [[0x8000,2],[0,2],[0x80,4],[0x20,6],[0x10,0],[0x8000,2],[0x80,4],[0x20,6],[0x20,8],[0x4000,8]]){set(0x2a,key);const result=executeHook(m,0x80fac0,initial,new Set([0x80f50d]));assert.equal(read(0x7ed862),state);assert.equal(read(0x7ed858),0);assert.equal(read(0x2a),key);for(const k of Object.keys(initial))assert.equal(result.r[k],initial[k]);}
 executeHook(m,0x80fb40,initial,new Set([0x80f4fa]));assert.equal(read(0x7ed862),0);
});
test('gold palette selector only selects the two native ball sources when unlocked',()=>{
 const m=new Uint8Array(0x1000000);m.set(GOLDEN_BALL_PALETTE_SELECTOR,0x80fb60);
 for(const y of [0x8b82,0x9094,0x8000])for(const pointer of [0x95f8,0x9560])for(const state of [0,8]){m[0x810001+y]=0;const at=0x810000+y+1;m[at]=pointer&255;m[at+1]=pointer>>8;m[0x7ed862]=state;const {r}=executeHook(m,0x80fb60,{y,db:0x81});assert.equal(r.x,state===8&&pointer===0x95f8&&y!==0x8000?0xfa80:pointer);assert.equal(r.a,r.x);assert.equal(r.y,y);}
});
test('golden ball ROM patch keeps sprites and non-ball palette colors intact',{skip:!fixture},()=>{
 const b=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,o=applyDeluxeGameplay(b,b,['golden-ball-code','secret-team-skill-codes']);assert.deepEqual(o.slice(0xd0000,0xd0660),b.slice(0xd0000,0xd0660));const p=goldenBallPalette(b);assert.deepEqual(p.slice(0,6),b.slice(0x495f8,0x495fe));assert.deepEqual(p.slice(24),b.slice(0x49610,0x49614));assert.deepEqual(o.slice(0x4fa80,0x4fa9c),p);assert.deepEqual(o.slice(0x495f8,0x49614),b.slice(0x495f8,0x49614));
});
test('both unlock codes grant dog and teams, arming the separate Skills continuation',()=>{
 for(const [x,expected] of [[0xd854,[1,1,0]],[0xd856,[1,1,0]],[0xd858,[0,0,1]]]){
  const m=new Uint8Array(0x1000000);m.set(SECRET_REWARDS_HELPER,0x80fa40);executeHook(m,0x80fa40,{x,db:0x7e});assert.deepEqual([m[0x7ed854],m[0x7ed856],m[0x7ed858]],expected);assert.equal(m[0x7ed85e]|m[0x7ed85f]<<8,x===0xd858?0:0x8048);
 }
 const m=new Uint8Array(0x1000000);m.set(SECRET_COMPARE_HELPER,0x80fa80);m.set([0x80,0],0x828036);m.set([0,0x40],0x82803a);m.set([0x80,0],0x828048);m.set([0,8],0x828012);
 for(const [x,a,ok] of [[0x8036,0x80,true],[0x8036,0x4000,false],[0x803a,0x80,false],[0x803a,0x4000,true],[0x8048,0x80,true],[0x8048,0x4000,true],[0x8048,0x800,false],[0x8012,0x4000,false],[0x8012,0x800,true]]){const {r}=executeHook(m,0x80fa80,{x,a});assert.equal(!!(r.p&2),ok);assert.equal(r.a,a);assert.equal(r.x,x);}
});
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

test('one-minute menu and both native timer branches preserve the three existing durations',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,out=applyDeluxeGameplay(base,base,['one-minute']);assert.equal(out.length,base.length);assert.equal(out[0x51c8b],3);assert.equal(out[0x51c96],4);assert.deepEqual(Array.from(out.slice(0x3de2f,0x3de3c)),[0x5f,0,0,0x61,0,0,0x63,0,0,0x65,0,0,0]);
 for(let index=0;index<4;index++){const m=new Uint8Array(0x1000000);m.set(out.slice(0x57600,0x5760e),0x8af600);m.set(out.slice(0x127f80,0x127fa0),0xa4ff80);m.set(base.slice(0xe893,0xe8a3),0xe893);m[0x1f88]=index;const menu=executeHook(m,0x8af600,{});assert.equal(menu.r.a,index===3?0:index+1);const normal=executeHook(m,0xa4ff80,{y:index*2});assert.equal(normal.r.a,index===3?0x100:(base[0xe893+index*2]|base[0xe894+index*2]<<8));const extra=executeHook(m,0xa4ff90,{y:index*2});assert.equal(extra.r.a,index===3?0x30:(base[0xe89b+index*2]|base[0xe89c+index*2]<<8));}
});
test('Plus final-attack hook postpones the whistle during protected ball states and then ends normally',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,out=applyDeluxeGameplay(base,base,['final-attack']);
 for(const ball of [3,4,5,6,0x16,0x18,0xe]){const m=new Uint8Array(0x1000000);m.set(out.slice(0x34c00,0x34c66),0x86cc00);m[0x430]=ball;m[0x6c]=1;m[0x6b]=1;const result=executeHook(m,0x86cc00,{},new Set([0x86dc03]));assert.equal(m[0xba],0);assert.equal(result.calls.length,0);}
 const m=new Uint8Array(0x1000000);m.set(out.slice(0x34c00,0x34c66),0x86cc00);m[0x430]=1;executeHook(m,0x86cc00,{},new Set([0x86dc03]));assert.equal(m[0x6c],1);assert.equal(m[0xba],0);m[0x6b]=1;const end=executeHook(m,0x86cc00,{},new Set([0x86dc03]));assert.equal(m[0xba],6);assert.equal(m[0x14e6],1);assert.equal(end.calls[0].target,0x86dc03);
});
