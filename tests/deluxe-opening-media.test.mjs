import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {encodeOpeningFrame,openingFramePixels,validateOpeningMedia,applyDeluxeOpeningMedia} from '../src/core/deluxe-opening-media.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
function frame(){const rgba=new Uint8Array(256*224*4);for(let y=0;y<224;y++)for(let x=0;x<256;x++)rgba.set([x<128?248:0,y<112?248:0,0,255],(y*256+x)*4);return encodeOpeningFrame(rgba);}
const image=()=>({kind:'image',fps:6,holdFrames:60,fadeInFrames:15,fadeOutFrames:15,frames:[frame()]});
test('opening conversion produces a bounded SNES palette and a full opaque decoded frame',()=>{
 const f=frame(),rgba=openingFramePixels(f);assert.equal(f.palette.length,16);assert.equal(rgba.length,256*224*4);assert.ok(rgba.every((v,i)=>i%4!==3||v===255));assert.notDeepEqual(rgba.slice(0,4),rgba.slice(128*4,129*4));assert.ok(f.tiles.length<32767);
 assert.equal(validateOpeningMedia(undefined),null);assert.throws(()=>validateOpeningMedia({unknown:image()}),/inválidas/);const bad=image();bad.fadeInFrames=1;assert.throws(()=>validateOpeningMedia({konami:bad}),/inválido/);
});
test('image and video openings export atomically, expand when needed and restore exact original bytes',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);p.changes.openingMedia={konami:image(),international:{...image(),kind:'video',frames:[frame(),frame()]},'we-love-soccer':image()};const before=JSON.stringify(p),result=await buildDeluxeProject(file,JSON.parse(before));assert.equal(JSON.stringify(p),before);assert.equal(result.rom.length,0x400000+result.base.headerSize);assert.ok(result.expanded);assert.equal(result.rom[result.base.headerSize+0x480],0x5c);
 const restored=await createDeluxeProject(file);assert.deepEqual((await buildDeluxeProject(file,restored)).rom,file);
 const occupied=base.slice();occupied[0x17b80]=0;const snapshot=occupied.slice();assert.throws(()=>applyDeluxeOpeningMedia(occupied,base,{konami:image()}),/reserva/);assert.deepEqual(occupied,snapshot);
});
test('opening replacement preserves the full GG project and its sixty-team visual assets',{skip:!fixture||!process.env.ISSSD_GG_RECOVERED_PROJECT},async()=>{
 const p=JSON.parse(fs.readFileSync(process.env.ISSSD_GG_RECOVERED_PROJECT)),before=structuredClone(p),file=new Uint8Array(fs.readFileSync(fixture));p.changes.openingMedia={konami:image()};await buildDeluxeProject(file,p);delete p.changes.openingMedia;assert.deepEqual(p,before);
});
