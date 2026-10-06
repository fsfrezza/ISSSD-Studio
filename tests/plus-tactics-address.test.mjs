import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_TACTICAL_POINTER_TABLE_PC,
  PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC,
  PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC,
  plusLoRomPc,
  plusTacticalBankSelectorActive,
  resolvePlusTacticalRecord,
} from '../src/core/plus-tactics-address.mjs';

test('LoROM bank/address conversion matches historical Studio rule',()=>{
  assert.equal(plusLoRomPc(0x8B,0x8000),0x058000);
  assert.equal(plusLoRomPc(0x8B,0xFE9F),0x05FE9F);
  assert.equal(plusLoRomPc(0xC0,0x8000),0x200000);
  assert.equal(plusLoRomPc(0x7F,0x8000),null);
  assert.equal(plusLoRomPc(0x8B,0x7FFF),null);
});

test('resolves original Plus tactical record through fixed pointer table and bank 8B',()=>{
  const rom=new Uint8Array(0x200000);
  const entry=3,ptr=0x9000;
  const po=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  rom[po]=ptr&0xFF;rom[po+1]=ptr>>>8;
  const pc=plusLoRomPc(0x8B,ptr);
  rom[pc]=7;rom[pc+30]=0xA5;

  const rec=resolvePlusTacticalRecord(rom,entry);
  assert.equal(rec.entry,entry);
  assert.equal(rec.ptr,ptr);
  assert.equal(rec.pointerBank,0x8B);
  assert.equal(rec.recordPc,pc);
  assert.equal(rec.pointerEntryPc,po);
  assert.equal(rec.layout,'plus-original');
  assert.equal(rec.raw[0],7);
  assert.equal(rec.raw[30],0xA5);
});

test('resolves generated bank-selector tactical record without changing original pointer table',()=>{
  const rom=new Uint8Array(0x400000);
  const marker=new TextEncoder().encode('ISSDTACTBANKV1');
  rom.set(marker,PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC);
  const entry=30,ptr=0x8000;
  const po=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  rom[po]=ptr&0xFF;rom[po+1]=ptr>>>8;
  rom[PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC+entry*2]=0xC0;
  rom[0x200000]=4;

  assert.equal(plusTacticalBankSelectorActive(rom),true);
  const rec=resolvePlusTacticalRecord(rom,entry);
  assert.equal(rec.ptr,ptr);
  assert.equal(rec.pointerBank,0xC0);
  assert.equal(rec.recordPc,0x200000);
  assert.equal(rec.layout,'bank-selector-v1');
  assert.equal(rec.raw[0],4);
});

test('marker absence keeps original bank even in expanded output',()=>{
  const rom=new Uint8Array(0x400000);
  const entry=1,ptr=0x8000;
  const po=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  rom[po]=0;rom[po+1]=0x80;
  rom[PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC+entry*2]=0xC0;
  assert.equal(plusTacticalBankSelectorActive(rom),false);
  assert.equal(resolvePlusTacticalRecord(rom,entry).pointerBank,0x8B);
});

test('resolver rejects invalid entry, pointer, or record bounds',()=>{
  const rom=new Uint8Array(0x200000);
  assert.equal(resolvePlusTacticalRecord(rom,-1),null);
  assert.equal(resolvePlusTacticalRecord(rom,57),null);
  rom[PLUS_TACTICAL_POINTER_TABLE_PC]=0xFF;
  rom[PLUS_TACTICAL_POINTER_TABLE_PC+1]=0x7F;
  assert.equal(resolvePlusTacticalRecord(rom,0),null);
});
