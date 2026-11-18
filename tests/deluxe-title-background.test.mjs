import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom,createDeluxeProject,buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {TITLE_LAYERS,readTitleBackground,titleBackgroundPixels,importTitleBackground,titleCompositePixels,transformTitleLayer} from '../src/core/deluxe-title-background.mjs';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('legacy title portraits migrate animated palette indices without touching the other title layers',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);
 const native=readTitleBackground(base,'photos').original,raw=native.slice();
 // Tile 2 is the first portrait tile. Simulate an old import using animated CGRAM $E1.
 for(let plane=0;plane<8;plane++){const at=2*64+(plane>>1)*16+(plane&1);raw[at]=(raw[at]&127)|((0xe1>>plane&1)<<7);}
 p.changes.titleScreen={photoTiles:Array.from(raw)};
 const snapshot=JSON.stringify(p),preview=titleCompositePixels(base,p.changes.titleScreen);
 const built=splitRom((await buildDeluxeProject(file,p)).rom).rom,actual=readTitleBackground(built,'photos').original;
 let index=0;for(let plane=0;plane<8;plane++)index|=(actual[2*64+(plane>>1)*16+(plane&1)]>>7&1)<<plane;
 assert.ok(index>=0x20&&index<0xb0);
 assert.deepEqual(actual.slice(0,128),native.slice(0,128));
 assert.deepEqual(actual,readTitleBackground(base,'photos',p.changes.titleScreen).raw);
 assert.deepEqual(titleCompositePixels(built).rgba,preview.rgba);
 assert.deepEqual(readTitleBackground(built,'ball').original,readTitleBackground(base,'ball').original);
 assert.equal(JSON.stringify(p),snapshot);
});
test('optional photo border writes the same native pixels as preview without mutating project',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);p.changes.titleScreen={photoBorder:true};const before=JSON.stringify(p),preview=titleCompositePixels(base,p.changes.titleScreen),normal=titleCompositePixels(base),built=splitRom((await buildDeluxeProject(file,p)).rom).rom;
 assert.notDeepEqual(preview.rgba,normal.rgba);assert.deepEqual(titleCompositePixels(built).rgba,preview.rgba);assert.equal(JSON.stringify(p),before);delete p.changes.titleScreen;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});
test('custom title map suppresses the late native two-tile overlay; original stays intact',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file),desc=0x1197e,ptr=base[desc]|base[desc+1]<<8|base[desc+2]<<16,raw=konamiLzDecompress(base,((ptr>>>16)&127)*32768+(ptr&32767)).data;
 const map=Array.from({length:1024},(_,i)=>raw[i*2]|raw[i*2+1]<<8);p.changes.titleScreen={map0:map};assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 map[0x154]=0x2400;map[0x155]=0x2400;const fixed=splitRom((await buildDeluxeProject(file,p)).rom).rom;
 assert.deepEqual([...fixed.slice(0x5d475,0x5d47f)],Array(10).fill(0xea));assert.deepEqual(fixed.slice(0xf617,0xf61c),base.slice(0xf617,0xf61c));
 delete p.changes.titleScreen;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});
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
  let seed=1;bad.changes.titleScreen[s.key]=Array.from({length:s.original.length},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>24;});if(id==='photos'){const relocated=splitRom((await buildDeluxeProject(input,bad)).rom).rom;assert.deepEqual(readTitleBackground(relocated,id).original,readTitleBackground(base,id,bad.changes.titleScreen).raw);}else await assert.rejects(buildDeluxeProject(input,bad),/excede espaço/);
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


test('title composite uses native backdrop rather than opaque black in uncovered screen areas',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom;
 const {titleCompositePixels}=await import('../src/core/deluxe-title-background.mjs');
 const original=titleCompositePixels(base);
 for(const [x,y]of [[0,0],[255,0],[0,223]])assert.deepEqual([...original.rgba.slice((y*256+x)*4,(y*256+x)*4+4)],[247,255,255,255]);
 const palette=Array.from({length:16},(_,i)=>base[0x4c292+i*2]|base[0x4c293+i*2]<<8);palette[0]=31;
 const custom=titleCompositePixels(base,{map0:Array(1024).fill(0),map1:Array(1024).fill(0),palettes:{stripe:palette}});assert.deepEqual([...custom.rgba.slice(0,4)],[255,0,0,255]);
});
