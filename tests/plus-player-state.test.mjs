import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateLegacyPlayerAttributes} from '../src/core/plus-player-state.mjs';

test('legacy attrHex is quarantined and never promoted to playerEdits',()=>{
  const teamsV1={names:{teams:{'30':{teamId:30,players:[
    {slot:8,name:'PELE',nameHex:'0000000000000000',attrHex:'012345673909AB'}
  ]}}}};
  const before=structuredClone(teamsV1);
  const out=migrateLegacyPlayerAttributes(teamsV1);
  assert.deepEqual(teamsV1,before);
  assert.deepEqual(out.edits,[]);
  assert.equal(out.quarantined.length,1);
  assert.deepEqual(out.quarantined[0],{
    team:30,
    player:7,
    attrHex:'012345673909AB',
    reason:'legacy attrHex snapshot is non-authoritative and is not promoted to playerEdits',
  });
  assert.equal(out.teamsV1.names.teams['30'].players[0].attrHex,undefined);
});

test('corrupted legacy attrHex is preserved in quarantine without interpretation',()=>{
  const teamsV1={names:{teams:{'30':{teamId:30,players:[
    {slot:8,attrHex:'FFFFFFFFFFFFFF'}
  ]}}}};
  const out=migrateLegacyPlayerAttributes(teamsV1);
  assert.deepEqual(out.edits,[]);
  assert.equal(out.quarantined.length,1);
  assert.equal(out.quarantined[0].team,30);
  assert.equal(out.quarantined[0].player,7);
  assert.equal(out.quarantined[0].attrHex,'FFFFFFFFFFFFFF');
  assert.match(out.quarantined[0].reason,/non-authoritative/i);
});

test('malformed legacy attrHex is preserved in quarantine and source remains untouched',()=>{
  const teamsV1={names:{teams:{'1':{teamId:1,players:[{slot:2,attrHex:'XYZ'}]}}}};
  const before=structuredClone(teamsV1);
  const out=migrateLegacyPlayerAttributes(teamsV1);
  assert.deepEqual(teamsV1,before);
  assert.deepEqual(out.edits,[]);
  assert.equal(out.quarantined.length,1);
  assert.equal(out.quarantined[0].attrHex,'XYZ');
  assert.match(out.quarantined[0].reason,/not promoted/i);
});
