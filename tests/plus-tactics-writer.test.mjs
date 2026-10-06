import test from 'node:test';
import assert from 'node:assert/strict';
import {PLUS_TACTICAL_POINTER_TABLE_PC,plusLoRomPc} from '../src/core/plus-tactics-address.mjs';
import {plusTacticsWriter} from '../src/core/plus-tactics-writer.mjs';

function setPtr(rom,team,ptr){
  const off=PLUS_TACTICAL_POINTER_TABLE_PC+team*2;
  rom[off]=ptr&0xFF;rom[off+1]=ptr>>>8;
}

test('writes semantic tactic only to an exclusive resolved record',()=>{
  const rom=new Uint8Array(0x200000);
  setPtr(rom,30,0x9000);
  const pc=plusLoRomPc(0x8B,0x9000);
  rom[pc+21]=0xA0;
  const before=rom.slice();

  plusTacticsWriter(rom,{plusTactics:{schema:'isssd-plus-tactics-v1',version:1,teams:{
    '30':{teamId:30,formationIndex:3,players:[
      {index:0,rosterSlot:2,x:-57,y:-39,className:'DF',attack:true}
    ]}
  }}});

  assert.equal(rom[pc],3);
  assert.equal(rom[pc+1],0xEE);
  assert.equal(rom[pc+2],0xD9);
  assert.equal(rom[pc+21],0xA5);
  assert.deepEqual(Array.from(rom.slice(pc+3,pc+21)),Array.from(before.slice(pc+3,pc+21)));
});

test('refuses to write when tactical preset is shared by another team',()=>{
  const rom=new Uint8Array(0x200000);
  setPtr(rom,30,0x9000);
  setPtr(rom,31,0x9000);
  const state={plusTactics:{teams:{'30':{teamId:30,formationIndex:2,players:[]}}}};
  assert.throws(()=>plusTacticsWriter(rom,state),/shared|compartilhado/i);
});

test('refuses unresolved tactical state instead of silently skipping it',()=>{
  const rom=new Uint8Array(0x200000);
  const state={plusTactics:{teams:{'30':{teamId:30,formationIndex:2,players:[]}}}};
  assert.throws(()=>plusTacticsWriter(rom,state),/resolve|registro tático/i);
});

test('does nothing when project has no canonical Plus tactics',()=>{
  const rom=new Uint8Array(0x200000);
  const before=rom.slice();
  assert.equal(plusTacticsWriter(rom,{}),rom);
  assert.deepEqual(rom,before);
});
