import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_INTERNAL_TITLE_OFFSET,
  PLUS_INTERNAL_TITLE_LENGTH,
  normalizeInternalRomTitle,
  encodeInternalRomTitle,
  readInternalRomTitle,
  plusRomMetaWriter,
} from '../src/core/plus-rom-meta.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

function blankRom(){return new Uint8Array(0x200000);}

test('internal title contract is 21 printable ASCII bytes padded with spaces',()=>{
  assert.equal(PLUS_INTERNAL_TITLE_OFFSET,0x7FC0);
  assert.equal(PLUS_INTERNAL_TITLE_LENGTH,21);
  const bytes=encodeInternalRomTitle('ISSSD');
  assert.equal(bytes.length,21);
  assert.deepEqual([...bytes.slice(0,5)],[0x49,0x53,0x53,0x53,0x44]);
  assert.ok([...bytes.slice(5)].every(value=>value===0x20));
});

test('internal title normalization reproduces monolith printable-ASCII policy',()=>{
  assert.equal(normalizeInternalRomTitle('ABC\nÇDEF'),'ABC  DEF');
  assert.equal(normalizeInternalRomTitle('123456789012345678901XYZ'),'123456789012345678901');
});

test('ROM metadata writer changes only the 21-byte title field',()=>{
  const rom=blankRom();rom.fill(0xAA);
  const before=rom.slice();
  plusRomMetaWriter(rom,{romInternalTitle:'INTERNET SUCKER'});
  assert.equal(readInternalRomTitle(rom),'INTERNET SUCKER');
  for(let i=0;i<rom.length;i++){
    if(i>=PLUS_INTERNAL_TITLE_OFFSET&&i<PLUS_INTERNAL_TITLE_OFFSET+PLUS_INTERNAL_TITLE_LENGTH)continue;
    assert.equal(rom[i],before[i]);
  }
});

test('project build applies semantic internal title before derived checksum',()=>{
  const base=blankRom();
  const project={state:{targetLength:base.length,patches:[],semantic:{romInternalTitle:'INTERNETSUCKERDELUXO'}}};
  const result=buildPlusProjectRom(base,project);
  assert.equal(readInternalRomTitle(result.rom),'INTERNETSUCKERDELUXO');
  assert.equal((result.rom[0x7FDC]|(result.rom[0x7FDD]<<8))^(result.rom[0x7FDE]|(result.rom[0x7FDF]<<8)),0xFFFF);
});

test('absent romInternalTitle leaves title bytes untouched',()=>{
  const rom=blankRom();
  rom.set(encodeInternalRomTitle('ORIGINAL'),PLUS_INTERNAL_TITLE_OFFSET);
  const before=rom.slice();
  plusRomMetaWriter(rom,{});
  assert.deepEqual(rom,before);
});
