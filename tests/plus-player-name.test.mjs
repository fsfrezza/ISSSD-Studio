import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_NAME_POINTER_TABLE,
  PLUS_NAME_BANK_PC,
  decodeFixedPlayerName,
  encodeFixedPlayerName,
  formatPlayerName,
  inferPlayerNameAlignment,
  normalizePlayerName,
  resolvePlusPlayerNameOffset,
  writePlusPlayerName,
} from '../src/core/plus-player-name.mjs';
import {plusPlayerWriter} from '../src/core/plus-player-writer.mjs';

function plusRomWithNamePointer(team=0,pointer=0xBD20){
  const rom=new Uint8Array(0x200000);
  const po=PLUS_NAME_POINTER_TABLE+team*2;
  rom[po]=pointer&0xFF;
  rom[po+1]=pointer>>8;
  return rom;
}

test('TallMenuText player names reproduce known v6.92 bytes',()=>{
  assert.deepEqual([...encodeFixedPlayerName('Buffon')],[0x69,0x96,0x87,0x87,0x90,0x8F,0,0]);
  assert.equal(decodeFixedPlayerName(Uint8Array.from([0x77,0x54,0x79,0x90,0x94,0x94,0x8A,0])),'P.Rossi ');
});

test('spaces, period and apostrophe are valid player-name characters',()=>{
  assert.equal(normalizePlayerName("O' Neil"),'O’ Neil');
  const bytes=encodeFixedPlayerName("O'Neil");
  assert.equal(bytes[1],0x5A);
  assert.equal(decodeFixedPlayerName(bytes),'O’Neil  ');
  assert.equal(decodeFixedPlayerName(encodeFixedPlayerName('D. COSTA')),'D. COSTA');
});

test('player name policy rejects unsupported characters and overlength names',()=>{
  assert.throws(()=>normalizePlayerName('JOÃO'),/supports only/);
  assert.throws(()=>normalizePlayerName('ABCDEFGHI'),/at most 8/);
});

test('alignment semantics match the historical fixed-width editor',()=>{
  assert.equal(formatPlayerName('Zoff','center'),'  Zoff  ');
  assert.equal(formatPlayerName('Riva','right'),'    Riva');
  assert.equal(inferPlayerNameAlignment('Buffon  '),'left');
  assert.equal(inferPlayerNameAlignment('P.Rossi '),'center');
  assert.equal(inferPlayerNameAlignment('  Zoff  '),'center');
  assert.equal(inferPlayerNameAlignment('    Riva'),'right');
});

test('Plus name address follows the team pointer table in bank AF',()=>{
  const rom=plusRomWithNamePointer(0,0xBD20);
  assert.equal(resolvePlusPlayerNameOffset(rom,0,0),PLUS_NAME_BANK_PC+0xBD20);
  assert.equal(resolvePlusPlayerNameOffset(rom,0,19),PLUS_NAME_BANK_PC+0xBD20+19*8);
});

test('goalkeeper name writes stay centered as in the monolith',()=>{
  const rom=plusRomWithNamePointer(0,0xBD20);
  const off=resolvePlusPlayerNameOffset(rom,0,0);
  rom.set(encodeFixedPlayerName('OLD'),off);
  const result=writePlusPlayerName(rom,{team:0,player:0,name:'Zoff',alignment:'left'});
  assert.equal(result.alignment,'center');
  assert.equal(decodeFixedPlayerName(rom.slice(off,off+8)),'  Zoff  ');
});

test('player writer edits name without reconstructing the seven-byte attribute record',()=>{
  const rom=plusRomWithNamePointer(0,0xBD20);
  const nameOff=resolvePlusPlayerNameOffset(rom,0,1);
  rom.set(encodeFixedPlayerName('OLD'),nameOff);
  const attrOff=0x150000+7;
  const originalAttr=Uint8Array.from([0x12,0x34,0x56,0x78,0x45,0x01,0xAB]);
  rom.set(originalAttr,attrOff);
  plusPlayerWriter(rom,{playerEdits:[{team:0,player:1,name:'D. Costa',alignment:'left'}]});
  assert.equal(decodeFixedPlayerName(rom.slice(nameOff,nameOff+8)),'D. Costa');
  assert.deepEqual(rom.slice(attrOff,attrOff+7),originalAttr);
});
