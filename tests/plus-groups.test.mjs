import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_GROUP_EMPTY,
  PLUS_GROUP_LOGICAL_TO_PHYSICAL,
  PLUS_GROUP_TABLE_BASE,
  PLUS_SECRET_GROUP_BASE,
  PLUS_SECRET_GROUP_COUNT,
  PLUS_SECRET_TERMINATOR,
  canonicalizePlusGroupsState,
  decodePlusGroupByte,
  encodePlusGroupTeam,
  encodePlusGroupsNative,
  plusGroupsWriter,
  readPlusGroups,
  validatePlusGroups,
} from '../src/core/plus-groups.mjs';

function sample(){
  return {
    groups:[
      [0,1,2,3,4,5],
      [6,7,8,9,10,11],
      [12,13,14,15,16,17],
      [18,19,20,21,22,23],
      [24,25,26,27,28,29],
      [30,31,32,33,34,35],
      [36,37,38,39,40,41],
      [42,43,44,45,46,47],
      [48,49,50,51,52,53],
    ],
    secret:[54,55,null,null,null,null],
  };
}

test('Plus group byte codec uses teamId*2 and 0x70 for empty',()=>{
  assert.equal(encodePlusGroupTeam(0),0);
  assert.equal(encodePlusGroupTeam(55),0x6E);
  assert.equal(encodePlusGroupTeam(null),PLUS_GROUP_EMPTY);
  assert.equal(decodePlusGroupByte(0x6E),55);
  assert.equal(decodePlusGroupByte(PLUS_GROUP_EMPTY),null);
  assert.throws(()=>decodePlusGroupByte(3),/even/i);
});

test('canonical Plus groups require 9x6 normal slots and one occupied slot per group',()=>{
  const state=canonicalizePlusGroupsState(sample());
  assert.equal(state.groups.length,9);
  assert.equal(state.secret.length,6);
  assert.equal(state.groups[0][0],0);
  assert.equal(state.secret[2],null);
  assert.throws(()=>canonicalizePlusGroupsState({...sample(),groups:sample().groups.slice(0,8)}),/9 normal groups/i);
  const bad=sample();bad.groups[3]=Array(6).fill(null);
  assert.throws(()=>canonicalizePlusGroupsState(bad),/at least one team/i);
});

test('logical America-first order maps to historical physical order',()=>{
  const encoded=encodePlusGroupsNative(sample());
  for(let logical=0;logical<9;logical++){
    const physical=PLUS_GROUP_LOGICAL_TO_PHYSICAL[logical];
    const expected=sample().groups[logical].map(value=>value*2);
    assert.deepEqual([...encoded.normal.slice(physical*6,physical*6+6)],expected);
  }
});

test('native writer touches only group table, secret table, terminator and counter',()=>{
  const rom=new Uint8Array(0x200000);rom.fill(0xAA);
  const before=rom.slice();
  plusGroupsWriter(rom,{plusGroups:sample()});
  const changed=[];
  for(let i=0;i<rom.length;i++)if(rom[i]!==before[i])changed.push(i);
  const allowed=new Set([
    ...Array.from({length:54},(_,i)=>PLUS_GROUP_TABLE_BASE+i),
    ...Array.from({length:6},(_,i)=>PLUS_SECRET_GROUP_BASE+i),
    PLUS_SECRET_TERMINATOR,PLUS_SECRET_GROUP_COUNT,
  ]);
  assert.ok(changed.length>0);
  for(const offset of changed)assert.ok(allowed.has(offset),'unexpected write at 0x'+offset.toString(16));
  assert.equal(rom[PLUS_SECRET_TERMINATOR],PLUS_GROUP_EMPTY);
  assert.equal(rom[PLUS_SECRET_GROUP_COUNT],2);
});

test('Plus groups reader round-trips writer semantics',()=>{
  const rom=new Uint8Array(0x200000);rom.fill(PLUS_GROUP_EMPTY);
  plusGroupsWriter(rom,{plusGroups:sample()});
  const read=readPlusGroups(rom);
  assert.deepEqual(read.groups,sample().groups);
  assert.deepEqual(read.secret,sample().secret);
  assert.equal(read.rawSecretCounter,2);
});

test('duplicates are reported but remain valid like the historical Studio validator',()=>{
  const value=sample();value.groups[1][0]=0;
  const validation=validatePlusGroups(value);
  assert.deepEqual(validation.duplicates,[0]);
  assert.equal(validation.counts[0],6);
});
