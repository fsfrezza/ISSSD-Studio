import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom,createDeluxeProject,buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {TITLE_LAYERS,readTitleBackground,titleBackgroundPixels,importTitleBackground,titleCompositePixels,transformTitleLayer} from '../src/core/deluxe-title-background.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('title transforms reject clipping and materialize position and scale',()=>{
 const image={width:4,height:4,rgba:new Uint8ClampedArray(64)};image.rgba.set([255,0,0,255],20);
 const next=transformTitleLayer(image,{x:1,y:1,scale:100});assert.deepEqual(Array.from(next.rgba.slice(40,44)),[255,0,0,255]);assert.equal(next.rgba[23],0);assert.equal(image.rgba[23],255);
 assert.throws(()=>transformTitleLayer(image,{x:4}),/ultrapassa/);assert.throws(()=>transformTitleLayer(image,{scale:0}),/inválida/);
});
test('original title layers: native decoding, lossless import, planar encoding, isolated writes and restoration',{skip:!fixture},async()=>{
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice(),base=splitRom(input).rom;
 const composite=titleCompositePixels(base);assert.equal(composite.width,256);assert.equal(composite.height,224);
 for(const id of Object.keys(TITLE_LAYERS)){
  const image=titleBackgroundPixels(base,id),s=readTitleBackground(base,id);
  assert.ok(image.width>0&&image.height>0);assert.ok(image.rgba.some((v,i)=>i%4===3&&v===255));
  assert.deepEqual(importTitleBackground(base,id,{},image.rgba,image.width,image.height),s.original);
  const p=await createDeluxeProject(input);p.changes.titleScreen={[s.key]:Array.from(s.original)};
  assert.deepEqual((await buildDeluxeProject(input,p)).rom,input);
  // Clearing a whole shared background is a deliberate group edit; safe single-layer import must protect siblings.
  p.changes.titleScreen[s.key]=Array(s.original.length).fill(0);
  const result=await buildDeluxeProject(input,JSON.parse(JSON.stringify(p))),out=splitRom(result.rom).rom;
  assert.equal(out.length,base.length);assert.deepEqual(readTitleBackground(out,id).original,new Uint8Array(s.original.length));
  if(id==='photos')assert.ok(out[s.pc+1]&128);
  for(let at=0;at<base.length;at++)if(out[at]!==base[at])assert.ok((at>=s.pc&&at<s.pc+s.compressedSize)||(at>=0x7fdc&&at<0x7fe0));
  p.changes.titleScreen={};assert.deepEqual((await buildDeluxeProject(input,p)).rom,input);
  const bad=structuredClone(p);bad.changes.titleScreen[s.key]=[0];await assert.rejects(buildDeluxeProject(input,bad),/tiles inválidos/);
  let seed=1;bad.changes.titleScreen[s.key]=Array.from({length:s.original.length},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>24;});await assert.rejects(buildDeluxeProject(input,bad),/excede espaço/);
  assert.throws(()=>importTitleBackground(base,id,{},new Uint8ClampedArray(4),1,1),/use/);
 }
 assert.deepEqual(input,snapshot);
});
test('title layer importer protects shared pixels and roundtrips photo replacement',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom;
 const ball=titleBackgroundPixels(base,'ball'),clear=new Uint8ClampedArray(ball.rgba.length);
 try{const raw=importTitleBackground(base,'ball',{},clear,ball.width,ball.height);const sibling=titleBackgroundPixels(base,'stripe',{backgroundTiles:Array.from(raw)});assert.deepEqual(sibling.rgba,titleBackgroundPixels(base,'stripe').rgba);}catch(e){assert.match(e.message,/compartilham|repetidos/);}
 const photo=titleBackgroundPixels(base,'photos'),raw=importTitleBackground(base,'photos',{},new Uint8ClampedArray(photo.rgba.length),photo.width,photo.height);
 assert.ok(titleBackgroundPixels(base,'photos',{photoTiles:Array.from(raw)}).rgba.every(v=>v===0));
});
