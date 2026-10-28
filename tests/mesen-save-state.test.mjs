import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {parseMesenSaveState,compareMesenWram} from '../src/emulator/mesen-save-state.mjs';

const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n);return b;};
function fixture({compressed=true,wram=Buffer.alloc(0x20000),version=4}={}){
 const fields=Buffer.concat([Buffer.from('memoryManager.workRam\0'),u32(wram.length),wram,Buffer.from('ppu.frameCount\0'),u32(4),u32(5061)]);
 const preview=deflateSync(Buffer.alloc(4)),name=Buffer.from('Plus.sfc');
 const payload=compressed?Buffer.concat([Buffer.from([1]),u32(fields.length),u32(deflateSync(fields).length),deflateSync(fields)]):Buffer.concat([Buffer.from([0]),fields]);
 return Buffer.concat([Buffer.from('MSS'),u32(0x20101),u32(version),u32(0),u32(4),u32(1),u32(1),u32(100),u32(preview.length),preview,u32(name.length),name,payload]);
}
test('reads compressed and uncompressed Mesen2 states',()=>{
 for(const compressed of [true,false]){const state=parseMesenSaveState(fixture({compressed}));assert.equal(state.frame,5061);assert.equal(state.wram.length,0x20000);assert.equal(state.rom,'Plus.sfc');}
});
test('rejects truncation, unsupported format and invalid WRAM',()=>{
 const bytes=fixture();assert.throws(()=>parseMesenSaveState(bytes.subarray(0,bytes.length-4)));
 assert.throws(()=>parseMesenSaveState(fixture({version:9})),/Formato/);
 assert.throws(()=>parseMesenSaveState(fixture({wram:Buffer.alloc(10)})),/WRAM/);
});
test('maps both WRAM banks and groups only adjacent changes',()=>{
 const ram=Buffer.alloc(0x20000);ram[0xffff]=2;ram[0x10000]=3;ram[0x1ffff]=4;
 const before=parseMesenSaveState(fixture()),after=parseMesenSaveState(fixture({wram:ram}));
 const diff=compareMesenWram(before,after);
 assert.equal(diff.changedBytes,3);assert.equal(diff.ranges.length,2);
 assert.deepEqual(diff.ranges[0],{offset:0xffff,snesAddress:0x7effff,before:[0,0],after:[2,3]});
 assert.equal(diff.ranges[1].snesAddress,0x7fffff);assert.equal(diff.gameplayMappingConfirmed,false);
 assert.equal(compareMesenWram(before,before).changedBytes,0);
 assert.throws(()=>compareMesenWram(before,{...after,rom:'Other.sfc'}),/ROMs diferentes/);
});
