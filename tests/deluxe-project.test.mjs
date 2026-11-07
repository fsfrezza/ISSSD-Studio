import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom,createDeluxeProject,buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText} from '../src/core/plus-strategy-text.mjs';
test('header de copiador é separado sem modificar entrada',()=>{
 const input=new Uint8Array(0x200200);input[0]=83;input[512]=12;
 const {header,rom}=splitRom(input);assert.equal(header.length,512);assert.equal(header[0],83);assert.equal(rom[0],12);rom[0]=5;assert.equal(input[512],12);
});
test('não aceita arquivo desconhecido como Deluxe',async()=>{
 await assert.rejects(createDeluxeProject(new Uint8Array(0x200000)),/incompatível/);
});
const fixture=process.env.ISSSD_DELUXE_ROM;
test('ROM real: identidade, edições restritas, checksum, roundtrip e rejeição de recursos pendentes',{skip:!fixture},async()=>{
 const input=new Uint8Array(fs.readFileSync(fixture)),original=input.slice();
 const project=await createDeluxeProject(input),empty=await buildDeluxeProject(input,project);
 assert.deepEqual(empty.rom,input);assert.equal(empty.diff.changedBytes,0);
 project.changes.strategyTexts.alloutatk='TODOS ATAQUE';
 const result=await buildDeluxeProject(input,JSON.parse(JSON.stringify(project)));
 assert.equal(result.rom.length,input.length);assert.deepEqual(input,original);
 const splitRomCached=splitRom(input).rom;
 const header=splitRom(input).header.length,{rom}=splitRom(result.rom),item=PLUS_STRATEGY_TEXTS[0];
 assert.deepEqual(result.rom.slice(0,header),input.slice(0,header));
 for(let i=0;i<rom.length;i++)if(rom[i]!==splitRomCached[i])assert.ok((i>=item.pc&&i<item.pc+20)||(i>=0x7fdc&&i<0x7fe0));
 assert.equal(readPlusStrategyText(rom,'alloutatk'),'TODOS ATAQUE');
 const sum=rom.reduce((s,b)=>(s+b)&65535,0);assert.equal(sum,rom[0x7fde]|rom[0x7fdf]<<8);
 delete project.changes.strategyTexts.alloutatk;
 assert.deepEqual((await buildDeluxeProject(input,project)).rom,input);
 project.changes.improvements=['low-goal-kick'];await assert.rejects(buildDeluxeProject(input,project),/sem patch/);
 project.changes.improvements=[];project.changes.plusPlayers={};await assert.rejects(buildDeluxeProject(input,project),/não suportado/);
});
