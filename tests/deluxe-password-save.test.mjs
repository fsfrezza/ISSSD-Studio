import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {passwordSaveHelper,passwordLoadHelper,applyDeluxePasswordSave} from '../src/core/deluxe-password-save.mjs';
import {executeHook} from './65816-hook-harness.mjs';import {splitRom} from '../src/core/deluxe-project.mjs';
const save=0x86ce00,load=0x86cf00,fixture=process.env.ISSSD_DELUXE_ROM;
test('native battery hooks persist all sixty password bytes across a fresh WRAM and reject corruption',()=>{
 const m=new Uint8Array(0x1000000);m.set(passwordSaveHelper(),save);m.set(passwordLoadHelper(),load);
 const payload=Uint8Array.from({length:60},(_,i)=>i<27?i:255);m.set(payload,0x7ee2d0);m.fill(0x79,0x701800,0x701810);
 const initial={a:0x1234,x:0x2345,y:0x3456,db:0x7e,p:1,dp:0x1500},saved=executeHook(m,save,initial,new Set([0x86cb64]));
 assert.equal(saved.calls[0].target,0x86cb64);for(const k of ['a','x','y','db','dp','p'])assert.equal(saved.r[k],initial[k]);
 const powered=new Uint8Array(m.length);powered.set(m.slice(0x700000,0x702000),0x700000);powered.set(passwordLoadHelper(),load);
 executeHook(powered,load,initial,new Set([0x86cafe]));assert.deepEqual(powered.slice(0x7ee2d0,0x7ee30c),payload);
 for(const at of [0x701000,0x701002,0x701006,0x701008,0x701020,0x701043]){const corrupt=powered.slice();corrupt[at]^=1;corrupt.fill(0xff,0x7ee2d0,0x7ee30c);executeHook(corrupt,load,initial,new Set([0x86cafe]));assert.ok(corrupt.slice(0x7ee2d0,0x7ee30c).every(v=>v===255));}
 assert.ok(m.slice(0x701800,0x701810).every(v=>v===0x79));
});
test('battery option enables the cartridge SRAM and protects native signatures',{skip:!fixture},()=>{const b=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,copy=b.slice(),out=applyDeluxePasswordSave(b,b);assert.equal(out[0x7fd6],2);assert.equal(out[0x7fd8],3);assert.deepEqual(b,copy);assert.deepEqual(out.slice(0x57205,0x57209),Uint8Array.of(0x22,0,0xce,0x86));const changed=b.slice();changed[0x5699b]^=1;assert.throws(()=>applyDeluxePasswordSave(changed,changed),/incompatível/);});
