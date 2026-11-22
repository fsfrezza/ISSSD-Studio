import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeHook} from './65816-hook-harness.mjs';
import {applyShirtNumberColors,validateShirtNumberColors,NUMBER_HOOK,NUMBER_TABLE,NUMBER_HELPER,SHIRT_NUMBER_COLOR_ID} from '../src/core/deluxe-shirt-number-color.mjs';
import {buildDeluxeProject,createDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('number hook changes only two palette words, respects both kits and preserves registers',()=>{
 const base=new Uint8Array(0x200000).fill(255);base.set([0x22,0x2a,0x92,0xa4],NUMBER_HOOK);
 const out=applyShirtNumberColors(base,base,{0:{home:31,away:0},59:{home:0x7c00,away:0x7fff}},60);
 const m=new Uint8Array(0x1000000);
 m.set(out.slice(NUMBER_TABLE,NUMBER_HELPER+100),0xc9e000);
 const set=(at,v)=>{m[at]=v&255;m[at+1]=v>>8;},get=at=>m[at]|m[at+1]<<8;
 for(const [t1,t2,k1,k2,c1,c2] of [[0,118,0,8,31,0x7fff],[118,0,8,8,0x7fff,0],[2,120,0,0,0x1234,0x1234],[1,118,8,0,0x1234,0x7c00]]){
  set(0x7e0da0,t1);set(0x7e0ea0,t2);set(0x7e0da4,k1);set(0x7e0ea4,k2);
  m.fill(0x12,0x7e2d00,0x7e2e00);set(0x7e2d98,0x1234);set(0x7e2db8,0x1234);
  const expected=m.slice(0x7e2d00,0x7e2e00);
  const initial={a:3,x:4,y:5,p:0x81,db:0x89,dp:0x1500,s:0x1ff};
  const r=executeHook(m,0xc9e200,initial,new Set([0xa4922a]));
  assert.deepEqual(r.r,initial);assert.equal(r.calls.length,1);
  assert.equal(get(0x7e2d98),c1);assert.equal(get(0x7e2db8),c2);
  expected.set([c1&255,c1>>8],0x98);expected.set([c2&255,c2>>8],0xb8);
  assert.deepEqual(m.slice(0x7e2d00,0x7e2e00),expected);
 }
 assert.throws(()=>validateShirtNumberColors({60:{home:0}},60));assert.throws(()=>validateShirtNumberColors({0:{away:32768}},60));
 assert.equal(applyShirtNumberColors(base,base,{},60),base);
});
test('actual ROM export is opt-in, including the 60-team project',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),{rom:base,header}=splitRom(file),p=await createDeluxeProject(file);
 p.changes.shirtNumberColors={0:{home:31,away:0x7c00}};
 assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 p.changes.improvements=[SHIRT_NUMBER_COLOR_ID];const out=(await buildDeluxeProject(file,p)).rom;
 assert.equal(out.length,0x400000+header.length);assert.deepEqual(out.slice(header.length+NUMBER_HOOK,header.length+NUMBER_HOOK+4),Uint8Array.of(0x22,0,0xe2,0xc9));
 assert.deepEqual(out.slice(header.length+0xc65d4,header.length+0xc7034),base.slice(0xc65d4,0xc7034));
 const path=process.env.ISSSD_GG_RECOVERED_PROJECT;
 if(path){const gg=JSON.parse(fs.readFileSync(path));gg.changes.shirtNumberColors={59:{away:31}};gg.changes.improvements.push(SHIRT_NUMBER_COLOR_ID);await buildDeluxeProject(file,gg);}
});
