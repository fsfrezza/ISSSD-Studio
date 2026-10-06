import test from 'node:test';
import assert from 'node:assert/strict';
import {writeSnesChecksum,readSnesChecksum,diffRanges,assertExpectedSize} from '../src/core/rom-integrity.mjs';

test('checksum and complement are written as exact inverses',()=>{
 const rom=new Uint8Array(0x8000); rom.fill(1);
 const w=writeSnesChecksum(rom);
 const r=readSnesChecksum(rom);
 assert.equal(r.checksum,w.checksum); assert.equal(r.complement,w.complement); assert.equal(r.complementsMatch,true);
});

test('diffRanges reports exact changed bytes and contiguous ranges',()=>{
 const a=Uint8Array.from([0,0,0,0,0,0]),b=a.slice(); b[1]=1;b[2]=2;b[5]=9;
 assert.deepEqual(diffRanges(a,b),{changedBytes:3,ranges:[{start:1,end:2,length:2},{start:5,end:5,length:1}]});
});

test('native Plus size is accepted',()=>assert.equal(assertExpectedSize(0x200000),0x200000));
test('canonical expanded sizes are accepted',()=>{assertExpectedSize(0x400000);assertExpectedSize(0x800000);});
test('accidental odd-sized build is rejected',()=>assert.throws(()=>assertExpectedSize(0x600000),/unexpected ROM size/));
