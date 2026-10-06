import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalProjectState} from '../src/core/project-state.mjs';
import {normalizePatch} from '../src/core/canonical-patches.mjs';

const BASE_SIZE=0x200000;

test('legacy project state.patches with bytes is canonicalized',()=>{
  const project={
    state:{
      targetLength:BASE_SIZE,
      patches:[
        {off:59378,bytes:[16,0,18,8]},
        {off:59416,bytes:[70,64]},
      ],
    },
  };
  const state=canonicalProjectState(project,{baseSize:BASE_SIZE});
  assert.equal(state.targetLength,BASE_SIZE);
  assert.deepEqual(state.patches.map(p=>({off:p.off,data:Array.from(p.data)})),[
    {off:59378,data:[16,0,18,8]},
    {off:59416,data:[70,64]},
  ]);
});

test('root legacy patches is accepted when compact patches are absent',()=>{
  const project={
    targetLength:BASE_SIZE,
    patches:[{offset:0x1234,bytes:[0xAA,0xBB]}],
  };
  const state=canonicalProjectState(project,{baseSize:BASE_SIZE});
  assert.deepEqual(Array.from(state.patches[0].data),[0xAA,0xBB]);
});

test('compact patches take precedence over legacy patches',()=>{
  const project={
    state:{
      targetLength:BASE_SIZE,
      patchesCompact:[{off:0x100,data:[1]}],
      patches:[{off:0x200,bytes:[2]}],
    },
  };
  const state=canonicalProjectState(project,{baseSize:BASE_SIZE});
  assert.equal(state.patches.length,1);
  assert.equal(state.patches[0].off,0x100);
});

test('legacy bytes still cannot persist generated expansion',()=>{
  const project={
    state:{
      targetLength:BASE_SIZE,
      patches:[{off:BASE_SIZE-1,bytes:[1,2]}],
    },
  };
  assert.throws(()=>canonicalProjectState(project,{baseSize:BASE_SIZE}),/immutable base boundary/);
});

test('legacy persisted SNES checksum patch is discarded',()=>{
  const project={
    state:{
      targetLength:BASE_SIZE,
      patches:[
        {off:0x7FDC,bytes:[62,134,193,121]},
        {off:0xE7F2,bytes:[1,2,3]},
      ],
    },
  };
  const state=canonicalProjectState(project,{baseSize:BASE_SIZE});
  assert.equal(state.patches.length,1);
  assert.equal(state.patches[0].off,0xE7F2);
});

test('patch crossing checksum boundary is rejected instead of partially discarded',()=>{
  const project={
    state:{
      targetLength:BASE_SIZE,
      patches:[{off:0x7FDB,bytes:[1,2,3,4,5]}],
    },
  };
  assert.throws(()=>canonicalProjectState(project,{baseSize:BASE_SIZE}),/checksum boundary/);
});

test('normalizePatch accepts bytes array without changing byte values',()=>{
  const patch=normalizePatch({off:0x3456,bytes:[0,127,128,255]});
  assert.equal(patch.off,0x3456);
  assert.deepEqual(Array.from(patch.data),[0,127,128,255]);
});
