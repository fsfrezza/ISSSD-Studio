import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';import {applyDeluxePlayerCloseups} from '../src/core/deluxe-player-closeup.mjs';
import {closeupHelper,closeupFrameHelper} from '../src/core/deluxe-player-closeup-helpers.mjs';import {executeHook} from './65816-hook-harness.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,projectPath=process.env.ISSSD_GG_RECOVERED_PROJECT,cpu=p=>0x800000|((p>>15)<<16)|32768|(p&32767);
test('Plus cinematic helpers accept all sixty Deluxe identities and preserve caller registers',()=>{
 const m=new Uint8Array(0x1000000),put=(at,v)=>{m[at]=v&255;m[at+1]=v>>8;};m.set(closeupHelper(),cpu(0x2ca000));m.set(closeupFrameHelper(),cpu(0x2ca400));
 put(0x7e19a4,4);put(0x7e14d2,0xd00);put(0x7e0da0,59*2);put(0x7e14fc,19);
 const index=59*20+19,palette=Uint8Array.from({length:32},(_,i)=>i+1);m.set(palette,cpu(0x2b8000+index*32));put(cpu(0x2c8000)+index*2,0x800f);
 const initial={a:0x1234,x:0x2345,y:0x3456,db:0x7e,dp:0x1500,p:1};const r=executeHook(m,cpu(0x2ca000),initial,new Set([0x8b9098,0x808e37]));
 assert.deepEqual(m.slice(0x7e2d00,0x7e2d20),palette);assert.equal(r.calls.filter(c=>c.target===0x808e37).length,4);
 for(const k of ['a','x','y','db','dp','p'])assert.equal(r.r[k],initial[k]);
 m.fill(0,0x7e2d00,0x7e2d20);put(0x7e0da0,120);executeHook(m,cpu(0x2ca000),initial,new Set([0x8b9098,0x808e37]));assert.ok(m.slice(0x7e2d00,0x7e2d20).every(v=>v===0));
});
test('close-ups map the GG project by stable Deluxe slot and leave untouched native projects unchanged',{skip:!fixture||!projectPath},()=>{
 const b=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,p=JSON.parse(fs.readFileSync(projectPath)),input=new Uint8Array(0x400000).fill(255);input.set(b);
 assert.equal(applyDeluxePlayerCloseups(b,b,{changes:{}}),b);p.changes.players['59:19'].appearance={hair:15,palette:1};const out=applyDeluxePlayerCloseups(input,b,p);
 assert.equal(out[0x2c8000+(59*20+19)*2],15);assert.equal(out[0x2c8000+(59*20+19)*2+1],128);assert.equal(out[0x58ef8],0x22);assert.equal(out[0x592cf],0x22);
 assert.ok(input.slice(0x2b8000,0x2d0000).every(v=>v===255));
});
