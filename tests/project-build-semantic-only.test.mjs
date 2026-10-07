import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

test('semantic-only project build ignores persisted patches but keeps semantic writers',()=>{
  const base=new Uint8Array(0x200000);
  base[0x100]=0x11;
  const project={state:{
    targetLength:0x200000,
    patchesCompact:[{off:0x100,data:'22'}],
    semantic:{marker:0x33},
  }};

  const normal=buildPlusProjectRom(base,project,{
    writers:[(work,state)=>{work[0x101]=state.marker;}],
    writeChecksum:false,
  });
  assert.equal(normal.rom[0x100],0x22);
  assert.equal(normal.rom[0x101],0x33);
  assert.equal(normal.ignoredPersistedPatches,false);

  const isolated=buildPlusProjectRom(base,project,{
    ignorePersistedPatches:true,
    writers:[(work,state)=>{work[0x101]=state.marker;}],
    writeChecksum:false,
  });
  assert.equal(isolated.rom[0x100],0x11);
  assert.equal(isolated.rom[0x101],0x33);
  assert.equal(isolated.ignoredPersistedPatches,true);
  assert.equal(base[0x100],0x11);
});
