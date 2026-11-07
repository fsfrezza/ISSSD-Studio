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

test('ROM real: estádios, textos e Cursor compartilham codecs e preservam todas as regiões restantes',{skip:!fixture},async()=>{
 const {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS,readStadiums,readNativeField,readCursorHelp,encodeNativeField}=await import('../src/core/deluxe-native-fields.mjs');
 const {encodeCursorText}=await import('../src/core/cursor-text-codec.mjs');
 const {plusNativeScreenTextWriter}=await import('../src/core/plus-native-screen-text.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(input).rom,snapshot=input.slice();
 const project=await createDeluxeProject(input),catalog=readStadiums(base);
 project.changes.nativeTexts=Object.fromEntries(NATIVE_SCREEN_TEXT_FIELDS.map(f=>[f.pc,'A']));
 project.changes.cursorHelp=Object.fromEntries(CURSOR_HELP_FIELDS.map(f=>[f[0],'A']));
 project.changes.stadiums=Object.fromEntries(catalog.map(s=>[s.id,s.colors.map(c=>c^31)]));
 project.changes.internalTitle='DELUXE TEST';
 const copy=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(input,copy),out=splitRom(result.rom).rom;
 assert.deepEqual(input,snapshot);assert.equal(result.rom.length,input.length);assert.equal(result.expanded,false);
 assert.deepEqual(splitRom(result.rom).header,splitRom(input).header);
 const reference=plusNativeScreenTextWriter(base.slice(),{textWorkspaceV2:{sections:{graphicIntents:{values:Object.fromEntries(NATIVE_SCREEN_TEXT_FIELDS.map(f=>['__pk590.native.'+f.pc,'A']))}}}});
 for(const f of NATIVE_SCREEN_TEXT_FIELDS){assert.equal(readNativeField(out,f),'A');assert.deepEqual(out.slice(f.pc,f.pc+f.capacity),encodeNativeField('A',f));assert.deepEqual(out.slice(f.pc,f.pc+f.capacity),reference.slice(f.pc,f.pc+f.capacity));}
 for(const f of CURSOR_HELP_FIELDS){const encoded=encodeCursorText(f,'A'),at=f[3].native.pc;assert.deepEqual(out.slice(at,at+encoded.length),encoded);assert.equal(readCursorHelp(out,f).trim(),'A');}
 assert.deepEqual(readStadiums(out).map(s=>s.colors),Object.values(project.changes.stadiums));
 const regions=[[0x7fc0,0x7fc0+21],[0x7fdc,0x7fe0],...NATIVE_SCREEN_TEXT_FIELDS.map(f=>[f.pc,f.pc+f.capacity]),...CURSOR_HELP_FIELDS.map(f=>{const n=f[3].native;return [n.pc,n.pc+n.width*n.rowCount];}),...catalog.map(s=>[s.palette+2,s.palette+34])];
 for(let i=0;i<out.length;i++)if(out[i]!==base[i])assert.ok(regions.some(([a,b])=>i>=a&&i<b),'unexpected write '+i.toString(16));
 assert.equal(out.reduce((s,b)=>(s+b)&65535,0),out[0x7fde]|out[0x7fdf]<<8);
 copy.changes={strategyTexts:{},improvements:[]};assert.deepEqual((await buildDeluxeProject(input,copy)).rom,input);
});

test('ROM real: rejeita campos, glifos, tamanhos e paletas inválidos sem modificar a base',{skip:!fixture},async()=>{
 const {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS}=await import('../src/core/deluxe-native-fields.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice();
 const cases=[['nativeTexts',{'1':'A'}],['nativeTexts',{[NATIVE_SCREEN_TEXT_FIELDS[0].pc]:'A'.repeat(200)}],['nativeTexts',{[NATIVE_SCREEN_TEXT_FIELDS[0].pc]:'A!'}],['cursorHelp',{bad:'A'}],['cursorHelp',{[CURSOR_HELP_FIELDS[0][0]]:'A'.repeat(1000)}],['stadiums',{'8':Array(16).fill(0)}],['stadiums',{'0':Array(16).fill(32768)}],['stadiums',{'0':[1]}]];
 for(const [key,value]of cases){const project=await createDeluxeProject(input);project.changes[key]=value;await assert.rejects(buildDeluxeProject(input,project));assert.deepEqual(input,snapshot);}
});

test('ROM real: 133 textos de menus editam somente segmentos nativos e restauram sem resíduos',{skip:!fixture},async()=>{
 const {DELUXE_MENU_SECTIONS,encodeNativeMenuField}=await import('../src/core/deluxe-menu-text.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice(),base=splitRom(input).rom;
 const project=await createDeluxeProject(input),regions=[];
 assert.equal(DELUXE_MENU_SECTIONS.reduce((n,s)=>n+s.fields.length,0),133);
 project.changes.menuTexts=Object.fromEntries(DELUXE_MENU_SECTIONS.map(s=>[s.id,Object.fromEntries(s.fields.map(f=>[f[0],'A']))]));
 for(const section of DELUXE_MENU_SECTIONS)for(const f of section.fields){
  assert.ok(!f[3].pool.relocation);
  const original=encodeNativeMenuField(f,f[1]);
  for(const [i,segment]of f[3].pool.segments.entries()){
   assert.deepEqual(base.slice(segment.pc,segment.pc+segment.original.length),original[i],section.id+'/'+f[0]);
   regions.push([segment.pc,segment.pc+segment.original.length]);
  }
 }
 const reloaded=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(input,reloaded),out=splitRom(result.rom).rom;
 for(const s of DELUXE_MENU_SECTIONS)for(const f of s.fields){const bytes=encodeNativeMenuField(f,'A');f[3].pool.segments.forEach((seg,i)=>assert.deepEqual(out.slice(seg.pc,seg.pc+seg.original.length),bytes[i]));}
 assert.equal(result.rom.length,input.length);assert.deepEqual(splitRom(result.rom).header,splitRom(input).header);
 regions.push([0x7fdc,0x7fe0]);
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(regions.some(([start,end])=>i>=start&&i<end),'unexpected write '+i.toString(16));
 assert.equal(out.reduce((s,b)=>(s+b)&65535,0),out[0x7fde]|out[0x7fdf]<<8);assert.deepEqual(input,snapshot);
 reloaded.changes.menuTexts=Object.fromEntries(DELUXE_MENU_SECTIONS.map(s=>[s.id,Object.fromEntries(s.fields.map(f=>[f[0],f[1]]))]));
 assert.deepEqual((await buildDeluxeProject(input,reloaded)).rom,input);
 for(const invalid of [{missing:{}},{'stadium-native':{data_87cad3:'TEST'}},{'options-native':[]},{[DELUXE_MENU_SECTIONS[0].id]:{[DELUXE_MENU_SECTIONS[0].fields[0][0]]:'A'.repeat(1000)}}]){
  reloaded.changes.menuTexts=invalid;await assert.rejects(buildDeluxeProject(input,reloaded));assert.deepEqual(input,snapshot);
 }
});
