import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalProjectOpen} from '../src/core/project-open.mjs';

const BASE_SIZE=0x200000;

test('opening a project returns data only and cannot mutate the base ROM',()=>{
  const base=new Uint8Array(BASE_SIZE);
  base[0x150001]=0x4A;
  const before=base.slice();
  const project={state:{targetLength:BASE_SIZE,patchesCompact:[],semantic:{teamsV1:{schema:'isssd-teams-v1',version:2,names:{teams:{'30':{teamId:30,players:[{slot:8,attrHex:'012345673909AB'}]}}},tactics:{schema:'isssd-custom-tactics-v1',version:2,teams:{'30':{teamId:30,formationIndex:3,rawHex:'AA'.repeat(31),players:[{rosterSlot:8,x:10,y:-5,attack:true}]}}}}}}};

  const opened=canonicalProjectOpen(project);

  assert.deepEqual(base,before);
  assert.equal(opened.semantic.teamsV1.names.teams['30'].players[0].attrHex,undefined);
  assert.deepEqual(opened.semantic.playerEdits,[]);
  assert.equal(opened.semantic.legacyPlayerAttributeQuarantine.length,1);
  assert.equal(opened.semantic.legacyPlayerAttributeQuarantine[0].team,30);
  assert.equal(opened.semantic.legacyPlayerAttributeQuarantine[0].player,7);
  assert.equal(opened.semantic.legacyPlayerAttributeQuarantine[0].attrHex,'012345673909AB');
  assert.equal(opened.semantic.teamsV1.tactics,undefined);
  assert.equal(opened.semantic.plusTactics.teams['30'].players[0].rosterSlot,8);
  assert.equal('rawHex' in opened.semantic.plusTactics.teams['30'],false);
});

test('opening rejects persisted expansion state before exposing semantic data',()=>{
  const project={state:{targetLength:0x400000,patchesCompact:[],semantic:{teamsV1:{schema:'isssd-teams-v1',version:2}}}};
  assert.throws(()=>canonicalProjectOpen(project),/targetLength.*immutable base/i);
});

test('opened project is detached from the source object',()=>{
  const project={state:{targetLength:BASE_SIZE,patchesCompact:[],semantic:{teamsV1:{schema:'isssd-teams-v1',version:2,names:{teams:{}}}}}};
  const opened=canonicalProjectOpen(project);
  opened.semantic.teamsV1.version=99;
  assert.equal(project.state.semantic.teamsV1.version,2);
});
