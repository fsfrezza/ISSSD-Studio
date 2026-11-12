import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {createTitleComposer,validateTitleComposer,prepareTitleComposer,duplicateComposerLayer,renderTitleComposer} from '../src/core/deluxe-title-composer.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('composer preserves native graphics, serializes layers and rejects changes outside ROM areas',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,s=createTitleComposer(base),snapshot=base.slice();assert.equal(s.elements.length,8);assert.deepEqual(prepareTitleComposer(base,{},s),{});assert.deepEqual(renderTitleComposer(JSON.parse(JSON.stringify(s))),renderTitleComposer(s));
 duplicateComposerLayer(s);duplicateComposerLayer(s);assert.throws(()=>duplicateComposerLayer(s),/dez/);assert.equal(s.elements.length,10);
 const moved=createTitleComposer(base);moved.elements.find(e=>e.role==='logo').x=-100;assert.throws(()=>prepareTitleComposer(base,{},moved),/fora da área|sem sprites/);assert.deepEqual(base,snapshot);
 const bad=structuredClone(s);bad.assets.logo.rgbaBase64='AA==';assert.throws(()=>validateTitleComposer(bad),/imagem inválida/);
 const hidden=createTitleComposer(base);hidden.elements.find(e=>e.role==='logo').visible=false;const result=prepareTitleComposer(base,{},hidden);assert.equal(result.logoTiles.length,3840);assert.equal(result.photoTiles,undefined);
});

test('title font generates missing Latin and accented glyphs, relocates safely and restores exactly',{skip:!fixture},async()=>{
 const {createDeluxeProject,buildDeluxeProject}=await import('../src/core/deluxe-project.mjs');const {TITLE_FONT_DESCRIPTOR,TITLE_FONT_RESERVE}=await import('../src/core/deluxe-title-font.mjs');const {konamiLzDecompress}=await import('../src/core/konami-lz.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);p.changes.titleScreen={texts:{copyright:'EDIÇÃO 2026',license:'FREZZA!'}};const result=await buildDeluxeProject(file,p),out=splitRom(result.rom).rom,ptr=out[TITLE_FONT_DESCRIPTOR]|out[TITLE_FONT_DESCRIPTOR+1]<<8|out[TITLE_FONT_DESCRIPTOR+2]<<16,pc=((ptr>>>16)&127)*32768+(ptr&32767);const font=konamiLzDecompress(out,pc);assert.equal(font.data.length,992);assert.ok(font.data.some(v=>v));assert.ok(pc===0x13e154||pc===TITLE_FONT_RESERVE);
 const allowed=i=>i>=0x46e13&&i<0x46e13+29*4||i>=0x46e88&&i<0x46e88+18*4||i>=TITLE_FONT_DESCRIPTOR&&i<TITLE_FONT_DESCRIPTOR+3||i>=pc&&i<pc+font.compressedSize||i>=0x7fdc&&i<0x7fe0;for(let i=0;i<out.length;i++)if(out[i]!==base[i])assert.ok(allowed(i),'unexpected write '+i.toString(16));
 delete p.changes.titleScreen;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 p.changes.titleScreen={texts:{copyright:'ABCDEFGHIJKLMNOPQRSTUVWXYZ123',license:'4567890!?'}};await assert.rejects(buildDeluxeProject(file,p),/31 caracteres/);
 p.changes.titleScreen={texts:{copyright:'AÇÃO'},fontGlyphs:{'☀':[24,60,126,255,255,126,60,24]}};await buildDeluxeProject(file,p);
});

test('personalized Plus title compiles to native ROM, preserves background sharing and restores previous graphics',{skip:!fixture||!process.env.ISSSD_TITLE_PROJECT},async()=>{
 const {buildDeluxeProject}=await import('../src/core/deluxe-project.mjs'),{titleCompositePixels,readTitleBackground}=await import('../src/core/deluxe-title-background.mjs'),{COMPOSER_NATIVE_KEYS}=await import('../src/core/deluxe-title-composer.mjs'),{konamiLzDecompress}=await import('../src/core/konami-lz.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,original=JSON.parse(fs.readFileSync(process.env.ISSSD_TITLE_PROJECT)),p=structuredClone(original);const baseline=await buildDeluxeProject(file,original);const prior=structuredClone(p.changes.titleScreen);p.changes.titleScreen=prepareTitleComposer(base,p.changes.titleScreen,p.changes.titleComposer);p.changes.titleComposer.prepared=true;const result=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p))),out=splitRom(result.rom).rom;
 assert.equal(result.rom.length,file.length);assert.deepEqual(titleCompositePixels(base,p.changes.titleScreen),titleCompositePixels(out));assert.ok(p.changes.titleScreen.map0);assert.ok(p.changes.titleScreen.map1);
 for(const [key,desc]of [['map0',0x1197e],['map1',0x11983]]){const a=out[desc]|out[desc+1]<<8|out[desc+2]<<16,pc=((a>>>16)&127)*32768+(a&32767),raw=konamiLzDecompress(out,pc).data;assert.deepEqual(Array.from({length:1024},(_,i)=>raw[i*2]|raw[i*2+1]<<8),p.changes.titleScreen[key]);}
 const oldImage=titleCompositePixels(base,prior),newImage=titleCompositePixels(out);for(const [x,y]of [[0,114],[8,150],[248,200]]){const at=(y*256+x)*4;assert.deepEqual(newImage.rgba.slice(at,at+4),oldImage.rgba.slice(at,at+4),'shared blank background preserved');}
 assert.notDeepEqual(readTitleBackground(out,'photos').raw,readTitleBackground(base,'photos').raw);const before=splitRom(baseline.rom).rom;const ranges=[[0x11968,0x1199d],[0x365c0,0x379a0],[0x57560,0x57f60],[0xdea80,0xe0000],[0x184300,0x188000],[0x7fdc,0x7fe0]];for(const desc of [0x11971,0x11979,0x1197e,0x11983,0x1198b]){const a=base[desc]|base[desc+1]<<8|base[desc+2]<<16,pc=((a>>>16)&127)*32768+(a&32767);ranges.push([pc,pc+konamiLzDecompress(base,pc).compressedSize]);}for(let i=0;i<out.length;i++)if(out[i]!==before[i])assert.ok(ranges.some(([a,b])=>i>=a&&i<b),'unexpected write '+i.toString(16));
 p.changes.titleScreen=prior;delete p.changes.titleComposer;assert.deepEqual((await buildDeluxeProject(file,p)).rom,baseline.rom);
 const invalid=structuredClone(original.changes.titleComposer);invalid.elements.find(e=>e.role==='photo1').y=0;invalid.elements.find(e=>e.role==='photo1').clipY=0;invalid.elements.find(e=>e.role==='photo1').maskPoints=null;assert.throws(()=>prepareTitleComposer(base,prior,invalid),/fora da área/);
});

test('short footer hides unused sprites with the native sentinel and protects PRESS START glyphs',{skip:!fixture},async()=>{
 const {createDeluxeProject,buildDeluxeProject}=await import('../src/core/deluxe-project.mjs'),{konamiLzDecompress}=await import('../src/core/konami-lz.mjs'),{TITLE_TEXT_FIELDS}=await import('../src/core/deluxe-title-screen.mjs');const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);p.changes.titleScreen={texts:{copyright:'@2026',license:'FREZZA'}};const out=splitRom((await buildDeluxeProject(file,p)).rom).rom;for(const f of TITLE_TEXT_FIELDS){const ys=Array.from({length:f.count},(_,i)=>out[f.pc-2+i*4]);assert.ok(ys.includes(127));assert.ok(!ys.includes(240));}const get=b=>{const a=b[0x1199a]|b[0x1199b]<<8|b[0x1199c]<<16;return konamiLzDecompress(b,((a>>>16)&127)*32768+(a&32767)).data;};assert.deepEqual(get(out).slice(20*32,28*32),get(base).slice(20*32,28*32));
});
