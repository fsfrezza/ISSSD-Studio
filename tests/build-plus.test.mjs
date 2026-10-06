import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusRom} from '../src/core/build-plus.mjs';
import {readSnesChecksum} from '../src/core/rom-integrity.mjs';

test('NO-OP build without checksum reproduces immutable base byte-for-byte',()=>{
  const base=new Uint8Array(0x200000); base[123]=45;
  const before=base.slice();
  const {rom,diff}=buildPlusRom(base,{writeChecksum:false});
  assert.deepEqual(rom,before);
  assert.deepEqual(base,before);
  assert.equal(diff.changedBytes,0);
});

test('semantic state is passed to infrastructure and writers without being embedded in base',()=>{
  const base=new Uint8Array(0x200000);
  const state={marker:0x5A};
  const {rom}=buildPlusRom(base,{
    semanticState:state,
    prepareInfrastructure:(work,s)=>{ assert.equal(s,state); work[0x100]=0x11; },
    writers:[(work,s)=>{ work[0x101]=s.marker; }],
    writeChecksum:false,
  });
  assert.equal(rom[0x100],0x11);
  assert.equal(rom[0x101],0x5A);
  assert.equal(base[0x100],0);
  assert.equal(base[0x101],0);
});

test('generated infrastructure may canonically expand only the build copy',()=>{
  const base=new Uint8Array(0x200000);
  const {rom}=buildPlusRom(base,{
    prepareInfrastructure:work=>{
      const expanded=new Uint8Array(0x400000);
      expanded.set(work);
      expanded[0x200000]=0x42;
      return expanded;
    },
    writeChecksum:false,
  });
  assert.equal(rom.length,0x400000);
  assert.equal(rom[0x200000],0x42);
  assert.equal(base.length,0x200000);
});

test('unexpected output size is rejected',()=>{
  const base=new Uint8Array(0x200000);
  assert.throws(()=>buildPlusRom(base,{
    prepareInfrastructure:work=>{
      const bad=new Uint8Array(0x300000); bad.set(work); return bad;
    },
    writeChecksum:false,
  }),/unexpected ROM size/);
});

test('checksum is the final build stage and writes a complement pair',()=>{
  const base=new Uint8Array(0x200000); base.fill(1);
  const {rom}=buildPlusRom(base,{writers:[work=>{work[0x1234]=9;}]});
  assert.equal(readSnesChecksum(rom).complementsMatch,true);
  assert.equal(base[0x1234],1);
});

test('same base and semantic inputs build deterministically',()=>{
  const base=new Uint8Array(0x200000);
  const options={
    semanticState:{value:7},
    writers:[(work,s)=>{work[0x150000]=s.value;}],
  };
  const a=buildPlusRom(base,options).rom;
  const b=buildPlusRom(base,options).rom;
  assert.deepEqual(a,b);
});
