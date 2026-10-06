import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalizePlusTacticsState} from '../src/core/plus-tactics-state.mjs';

test('migrates historical raw tactical snapshot to semantic state and drops rawHex',()=>{
  const legacy={schema:'isssd-custom-tactics-v1',version:2,teams:{
    '30':{teamId:30,formationIndex:3,formationLabel:'4-4-2',rawHex:'AA'.repeat(31),players:[
      {index:0,rosterSlot:1,x:-30,y:0,className:'GK',attack:false},
      {index:1,rosterSlot:2,x:-20,y:-10,className:'DF',attack:true},
    ],custom:true,customState:{formation:3}}
  }};
  const out=canonicalizePlusTacticsState(legacy);
  assert.equal(out.schema,'isssd-plus-tactics-v1');
  assert.equal(out.version,1);
  assert.equal(out.teams['30'].formationIndex,3);
  assert.equal(out.teams['30'].players[1].rosterSlot,2);
  assert.equal(out.teams['30'].players[1].attack,true);
  assert.equal('rawHex' in out.teams['30'],false);
  assert.deepEqual(out.teams['30'].customState,{formation:3});
});

test('validates semantic coordinates and roster slots',()=>{
  assert.throws(()=>canonicalizePlusTacticsState({teams:{'1':{players:[{rosterSlot:0,x:0,y:0}]}}}),/rosterSlot/);
  assert.throws(()=>canonicalizePlusTacticsState({teams:{'1':{players:[{rosterSlot:1,x:40,y:0}]}}}),/coordinate/);
});

test('canonical output is detached and deterministic',()=>{
  const input={teams:{'2':{teamId:2,formationIndex:1,players:[{rosterSlot:3,x:5,y:-7,attack:false}]}}};
  const a=canonicalizePlusTacticsState(input),b=canonicalizePlusTacticsState(input);
  assert.deepEqual(a,b);
  a.teams['2'].players[0].x=99;
  assert.equal(input.teams['2'].players[0].x,5);
});
