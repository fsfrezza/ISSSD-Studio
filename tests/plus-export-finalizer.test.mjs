import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {playerOffset} from '../src/core/plus-player.mjs';
import {finalizePlusRomForExport,validatePlusRuntimeMirrors} from '../src/core/plus-export-finalizer.mjs';

function seeded(size){
 const rom=new Uint8Array(size);
 for(let i=0;i<rom.length;i+=0x1000)rom[i]=(i>>>12)&0xFF;
 const cafu=playerOffset(30,1);
 rom.set([0x88,0x56,0x77,0x76,0x39,0x01,0x11],cafu);
 rom.set([0x65,0x78,0x97,0x38,0x05,0x11],0x78C0);
 for(let p=2;p<=7;p++){
  const main=playerOffset(30,p);
  for(let b=0;b<7;b++)rom[main+b]=(p*17+b)&0xFF;
  rom.fill(0xEE,0x78C6+(p-2)*7,0x78C6+(p-1)*7);
 }
 return rom;
}

for(const size of [0x200000,0x400000]){
 test(`finalizer repairs all verified Brazil mirrors and checksum at ${size.toString(16)}`,()=>{
  const input=seeded(size);
  assert.equal(validatePlusRuntimeMirrors(input),false);
  const {rom,checksum}=finalizePlusRomForExport(input);
  assert.notEqual(rom,input);
  assert.equal(validatePlusRuntimeMirrors(rom),true);
  const cafu=playerOffset(30,1);
  assert.deepEqual([...rom.slice(0x78C0,0x78C6)],[...rom.slice(cafu+1,cafu+7)]);
  for(let p=2;p<=7;p++){
   const main=playerOffset(30,p),mirror=0x78C6+(p-2)*7;
   assert.deepEqual([...rom.slice(mirror,mirror+7)],[...rom.slice(main,main+7)]);
  }
  const off=0x7FDC;
  const complement=rom[off]|(rom[off+1]<<8);
  const stored=rom[off+2]|(rom[off+3]<<8);
  assert.equal(stored,checksum.checksum);
  assert.equal(complement,checksum.complement);
  assert.equal((stored^complement)&0xFFFF,0xFFFF);
 });
}

test('finalizer rejects unsupported ROM sizes instead of exporting silently',()=>{
 assert.throws(()=>finalizePlusRomForExport(new Uint8Array(0x300000)),/unexpected Plus ROM size/i);
});

test('Studio Plus export is rebuilt from current project through Build Pipeline v1',()=>{
 const patch=fs.readFileSync(new URL('../scripts/patch-canonical-rom-export.mjs',import.meta.url),'utf8');
 const server=fs.readFileSync(new URL('../scripts/serve-editor.mjs',import.meta.url),'utf8');
 const pkg=fs.readFileSync(new URL('../package.json',import.meta.url),'utf8');
 const verify=fs.readFileSync(new URL('../scripts/verify-editor-source.mjs',import.meta.url),'utf8');
 assert.match(patch,/fetch\('\/__isssd\/build-plus-project'/);
 assert.match(patch,/await studioProjectObject\(\)/);
 assert.match(patch,/plus-build-pipeline-v1/);
 assert.match(patch,/await studioDownloadFile\(output/);
 assert.match(server,/buildPlusProjectRom/);
 assert.match(server,/u==='\/__isssd\/build-plus-project'/);
 assert.match(server,/'X-ISSSD-Builder':'plus-build-pipeline-v1'/);
 assert.match(server,/build-diagnostics/);
 assert.doesNotMatch(server,/u==='\/__isssd\/finalize-plus-rom'/);
 assert.doesNotMatch(server,/finalizePostedRom/);
 assert.match(pkg,/verify-editor-source\.mjs[^\n]*build-editor\.mjs/);
 assert.match(pkg,/patch-canonical-rom-export\.mjs/);
 assert.doesNotMatch(pkg,/patch-brazil-attribute-mirror\.mjs/);
 assert.match(verify,/\.editor-vendor[^\n]*legacy-ui[^\n]*ISSSD-Studio\.html/);
 assert.match(verify,/studioDoSave -> output -> studioDownloadFile/);
 assert.equal(fs.existsSync(new URL('../scripts/patch-brazil-attribute-mirror.mjs',import.meta.url)),false);
});
