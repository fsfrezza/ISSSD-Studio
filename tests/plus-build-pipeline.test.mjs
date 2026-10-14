import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPlusWithPipeline} from '../src/core/plus-build-pipeline.mjs';
import {playerOffset} from '../src/core/plus-player.mjs';
import {validatePlusRuntimeMirrors,writeFinalSnesChecksum} from '../src/core/plus-export-finalizer.mjs';

function baseFixture(){
  const base=new Uint8Array(0x200000);
  for(let i=0;i<base.length;i+=0x10000)base[i]=(i>>>16)&0xFF;
  const cafu=playerOffset(30,1);
  base.set([0x88,0x56,0x77,0x76,0x39,0x01,0x11],cafu);
  base.set([0x65,0x78,0x97,0x38,0x05,0x11],0x78C0);
  for(let p=2;p<=7;p++){
    const main=playerOffset(30,p);
    for(let b=0;b<7;b++)base[main+b]=(p*17+b)&0xFF;
    base.set(base.slice(main,main+7),0x78C6+(p-2)*7);
  }
  return base;
}

test('Build Pipeline Plus expande primeiro, sincroniza mirrors no fim e usa checksum funcional comprovado',()=>{
  const base=baseFixture(),before=base.slice();
  const result=buildPlusWithPipeline(base,{semanticState:{},patches:[],writeChecksum:true});
  assert.equal(result.rom.length,0x400000);
  assert.equal(result.report[0].id,'01-expand-4mb');
  assert.equal(result.report.at(-2).id,'90-integrity-mirrors');
  assert.equal(result.report.at(-1).id,'99-checksum');
  assert.equal(validatePlusRuntimeMirrors(result.rom),true);
  const expected=result.rom.slice();
  const expectedChecksum=writeFinalSnesChecksum(expected);
  const off=0x7FDC;
  const stored=result.rom[off+2]|(result.rom[off+3]<<8);
  const complement=result.rom[off]|(result.rom[off+1]<<8);
  assert.equal(stored,expectedChecksum.checksum);
  assert.equal(complement,expectedChecksum.complement);
  assert.deepEqual(base,before);
});

test('pipeline Plus não volta a usar o checksum genérico anterior',()=>{
  const source=fs.readFileSync(new URL('../src/core/plus-build-pipeline.mjs',import.meta.url),'utf8');
  assert.match(source,/writeFinalSnesChecksum/);
  assert.doesNotMatch(source,/import \{writeSnesChecksum\}/);
  assert.match(source,/syncPlusRuntimeMirrors/);
  assert.match(source,/validatePlusRuntimeMirrors/);
});
