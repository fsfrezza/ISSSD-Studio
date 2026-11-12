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
