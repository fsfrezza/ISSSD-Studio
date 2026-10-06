import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateLegacyPlayerAttributes} from '../src/core/plus-player-state.mjs';

test('legacy attrHex becomes canonical player edit without writable raw record',()=>{
  // raw skills 0..8 => UI skills 1..9; position 3; energy 9; shirt 10; appearance 0xAB
  const teamsV1={names:{teams:{'30':{teamId:30,players:[
    {slot:8,name:'PELE',nameHex:'0000000000000000',attrHex:'012345673909AB'}
  ]}}}};
  const out=migrateLegacyPlayerAttributes(teamsV1);
  assert.equal(out.edits.length,1);
  assert.deepEqual(out.edits[0],{
    team:30,player:7,
    skills:{acceleration:1,speed:2,shot:3,curve:4,balance:5,intelligence:6,dribbling:7,jump:8,energy:10},
    naturalPosition:3,jersey:10,appearanceRaw:0xAB,
  });
  assert.equal(out.quarantined.length,0);
  assert.equal(out.teamsV1.names.teams['30'].players[0].attrHex,undefined);
});

test('corrupted legacy attrHex is quarantined instead of becoming a player edit',()=>{
  const teamsV1={names:{teams:{'30':{teamId:30,players:[
    {slot:8,attrHex:'FFFFFfFFffffFF'}
  ]}}}};
  const out=migrateLegacyPlayerAttributes(teamsV1);
  assert.equal(out.edits.length,0);
  assert.equal(out.quarantined.length,1);
  assert.equal(out.quarantined[0].team,30);
  assert.equal(out.quarantined[0].player,7);
  assert.match(out.quarantined[0].reason,/skill|position|jersey/i);
  assert.equal(out.teamsV1.names.teams['30'].players[0].attrHex,undefined);
});

test('malformed attrHex is quarantined and source object remains untouched',()=>{
  const teamsV1={names:{teams:{'1':{teamId:1,players:[{slot:2,attrHex:'XYZ'}]}}}};
  const before=structuredClone(teamsV1);
  const out=migrateLegacyPlayerAttributes(teamsV1);
  assert.deepEqual(teamsV1,before);
  assert.equal(out.edits.length,0);
  assert.equal(out.quarantined.length,1);
  assert.match(out.quarantined[0].reason,/14 hexadecimal/i);
});
