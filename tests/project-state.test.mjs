import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalProjectState} from '../src/core/project-state.mjs';

test('project state rejects persisted expanded targetLength even without expansion patches',()=>{
  assert.throws(()=>canonicalProjectState({
    state:{targetLength:0x400000,patchesCompact:[]}
  }),/targetLength.*immutable base/i);
});

test('project state accepts native targetLength and canonicalizes patches',()=>{
  const got=canonicalProjectState({
    state:{
      targetLength:0x200000,
      patchesCompact:[
        {off:0x20,data:'AABB'},
        {offset:0x20,data:[0xAA,0xBB]},
        {off:0x10,value:0x33}
      ]
    }
  });
  assert.equal(got.targetLength,0x200000);
  assert.deepEqual(got.patches.map(p=>({off:p.off,data:[...p.data]})),[
    {off:0x10,data:[0x33]},
    {off:0x20,data:[0xAA,0xBB]}
  ]);
});

test('project state does not mutate source project structures',()=>{
  const project={state:{targetLength:0x200000,patchesCompact:[{off:1,data:[2,3]}]}};
  const before=structuredClone(project);
  canonicalProjectState(project);
  assert.deepEqual(project,before);
});
