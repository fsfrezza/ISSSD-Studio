import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {
  PLUS_GROUP_TABLE_BASE,
  PLUS_SECRET_GROUP_BASE,
  PLUS_SECRET_GROUP_COUNT,
  plusGroupsWriter,
} from '../src/core/plus-groups.mjs';

function groupsState(){
  return {
    schema:'isssd-plus-groups-v1',
    version:1,
    groupOrderConvention:'issd-plus-logical-v2',
    teamIndexConvention:'issd-plus-original-v1',
    groups:Array.from({length:9},(_,group)=>Array.from({length:6},(_,slot)=>group*6+slot)),
    secret:[50,51,52,53,54,55],
  };
}

function project(){
  return {state:{targetLength:0x200000,patchesCompact:[],semantic:{plusGroups:groupsState()}}};
}

test('default project build preserves native group tables while groups writer is quarantined',()=>{
  const base=new Uint8Array(0x200000);base.fill(0xA5);
  const {rom}=buildPlusProjectRom(base,project(),{writeChecksum:false});
  assert.ok(rom.slice(PLUS_GROUP_TABLE_BASE,PLUS_GROUP_TABLE_BASE+54).every(value=>value===0xA5));
  assert.ok(rom.slice(PLUS_SECRET_GROUP_BASE,PLUS_SECRET_GROUP_BASE+6).every(value=>value===0xA5));
  assert.equal(rom[PLUS_SECRET_GROUP_COUNT],0xA5);
});

test('Plus groups writer remains available only through explicit opt-in',()=>{
  const base=new Uint8Array(0x200000);base.fill(0xA5);
  const {rom}=buildPlusProjectRom(base,project(),{writers:[plusGroupsWriter],writeChecksum:false});
  assert.notEqual(rom[PLUS_GROUP_TABLE_BASE],0xA5);
  assert.notEqual(rom[PLUS_SECRET_GROUP_BASE],0xA5);
  assert.equal(rom[PLUS_SECRET_GROUP_COUNT],6);
});
