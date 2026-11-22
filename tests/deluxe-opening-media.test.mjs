import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {encodeOpeningFrame,openingFramePixels,validateOpeningMedia,applyDeluxeOpeningMedia,transformOpeningFrame,openingPlaybackState,validateOpeningProjectMedia,makeOpeningSource,transformOpeningSource} from '../src/core/deluxe-opening-media.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {openingMediaRect,installOpeningEditors} from '../deluxe-editor/opening-editors.mjs';
test('opening placement preserves proportions, supports zoom and native pixel offsets',()=>{
 assert.deepEqual(openingMediaRect(512,256),[0,48,256,128]);
 assert.deepEqual(openingMediaRect(512,256,50,10,-8),[74,72,128,64]);
 assert.deepEqual(openingMediaRect(512,256,200),[-128,-16,512,256]);
 assert.throws(()=>openingMediaRect(512,256,401),/inválido/);
});
const fixture=process.env.ISSSD_DELUXE_ROM;
function frame(){const rgba=new Uint8Array(256*224*4);for(let y=0;y<224;y++)for(let x=0;x<256;x++)rgba.set([x<128?248:0,y<112?248:0,0,255],(y*256+x)*4);return encodeOpeningFrame(rgba);}
const image=()=>({kind:'image',fps:6,holdFrames:60,fadeInFrames:15,fadeOutFrames:15,frames:[frame()]});
test('editable placement retains the source and produces exactly the transformed native frame',()=>{
 const source=frame(),snapshot=JSON.stringify(source),adjusted=transformOpeningFrame(source,{zoom:50,x:15,y:-10}),pixels=openingFramePixels(adjusted),at=(x,y)=>Array.from(pixels.slice((y*256+x)*4,(y*256+x)*4+4));
 assert.deepEqual(at(0,0),[0,0,0,255]);assert.deepEqual(at(80,48),[255,255,0,255]);assert.deepEqual(JSON.stringify(source),snapshot);
 assert.deepEqual(transformOpeningFrame(source,{zoom:100,x:0,y:0}),source);
 const model={konami:{...image(),frames:[adjusted],sourceFrames:[source],placement:{zoom:50,x:15,y:-10}}};assert.deepEqual(validateOpeningProjectMedia(JSON.parse(JSON.stringify(model))),model);assert.throws(()=>validateOpeningProjectMedia({konami:{...model.konami,sourceFrames:[]}}),/origem/);
});
test('fade playback follows the native 16 brightness levels and configured timing',()=>{
 const v=image();assert.equal(openingPlaybackState(v,0).brightness,0);assert.equal(openingPlaybackState(v,7.5).brightness,7);assert.equal(openingPlaybackState(v,15).brightness,15);assert.equal(openingPlaybackState(v,75).brightness,15);assert.equal(openingPlaybackState(v,90).brightness,0);
 const video={...v,kind:'video',frames:[frame(),frame()]};assert.equal(openingPlaybackState(video,25).index,1);assert.equal(openingPlaybackState(video,50).brightness,0);
});
test('raw image retains transparent pixels and supports independent background, position and scale after reopening',()=>{
 const rgba=new Uint8Array(4*2*4);for(let i=0;i<8;i++)rgba.set([255,0,0,i%4<2?255:0],i*4);const source=makeOpeningSource(4,2,rgba),placement={zoom:50,x:16,y:-8,background:'#ffffff'},f=transformOpeningSource(source,placement),pixels=openingFramePixels(f),at=(x,y)=>Array.from(pixels.slice((y*256+x)*4,(y*256+x)*4+4));assert.deepEqual(at(0,0),[255,255,255,255]);assert.deepEqual(at(90,90),[255,0,0,255]);assert.deepEqual(at(190,90),[255,255,255,255]);assert.equal(f.palette[0],32767);
 const model={konami:{...image(),rawSources:[source],placement,frames:[f]}};const loaded=validateOpeningProjectMedia(JSON.parse(JSON.stringify(model)));const adjusted=transformOpeningSource(loaded.konami.rawSources[0],{...placement,background:'#0000ff',zoom:100,x:0});assert.deepEqual(Array.from(openingFramePixels(adjusted).slice(0,4)),[0,0,255,255]);assert.deepEqual(transformOpeningSource(source,placement),f);
});
test('opening editor updates the visible and saved frame, restores placement on reopen and previews fades',()=>{
 const prev={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame},nodes=new Map();let tick;
 globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,{value:'',style:{},getContext(){return {createImageData:()=>({data:new Uint8ClampedArray(256*224*4)}),putImageData:data=>{this.pixels=data.data;}};}});return nodes.get(id);}};
 globalThis.requestAnimationFrame=callback=>{tick=callback;return 1;};globalThis.cancelAnimationFrame=()=>{tick=null;};
 const project={changes:{openingMedia:{konami:image()}}};
 try{const editor=installOpeningEditors({getProject:()=>project,getFile:()=>null,onStatus:()=>{}}),get=s=>nodes.get('openingKonami'+s),original=project.changes.openingMedia.konami.frames[0];
  get('Zoom').value='50';get('Zoom').oninput();get('X').value='20';get('X').onchange();assert.equal(project.changes.openingMedia.konami.placement.zoom,50);assert.deepEqual(project.changes.openingMedia.konami.sourceFrames[0],original);assert.deepEqual(get('Preview').pixels,openingFramePixels(project.changes.openingMedia.konami.frames[0]));
  project.changes=JSON.parse(JSON.stringify(project.changes));editor.render();assert.equal(get('Zoom').value,50);assert.equal(get('X').value,20);
  get('FadeIn').value='1';get('FadeIn').onchange();assert.equal(project.changes.openingMedia.konami.fadeInFrames,60);get('Play').onclick();assert.equal(get('Preview').style.opacity,'0');assert.equal(get('Play').textContent,'Parar prévia');assert.equal(typeof tick,'function');get('Play').onclick();assert.equal(get('Preview').style.opacity,'1');
 }finally{Object.assign(globalThis,prev);}
});
test('opening conversion produces a bounded SNES palette and a full opaque decoded frame',()=>{
 const f=frame(),rgba=openingFramePixels(f);assert.equal(f.palette.length,16);assert.equal(rgba.length,256*224*4);assert.ok(rgba.every((v,i)=>i%4!==3||v===255));assert.notDeepEqual(rgba.slice(0,4),rgba.slice(128*4,129*4));assert.ok(f.tiles.length<32767);
 assert.equal(validateOpeningMedia(undefined),null);assert.throws(()=>validateOpeningMedia({unknown:image()}),/inválidas/);const bad=image();bad.fadeInFrames=1;assert.throws(()=>validateOpeningMedia({konami:bad}),/inválido/);
});
test('image and video openings export atomically, expand when needed and restore exact original bytes',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);p.changes.openingMedia={konami:image(),international:{...image(),kind:'video',frames:[frame(),frame()]},'we-love-soccer':image()};const before=JSON.stringify(p),result=await buildDeluxeProject(file,JSON.parse(before));assert.equal(JSON.stringify(p),before);assert.equal(result.rom.length,0x400000+result.base.headerSize);assert.ok(result.expanded);assert.equal(result.rom[result.base.headerSize+0x480],0x5c);
 const restored=await createDeluxeProject(file);assert.deepEqual((await buildDeluxeProject(file,restored)).rom,file);
 const occupied=base.slice();occupied[0x17bb4]=0;const snapshot=occupied.slice();assert.throws(()=>applyDeluxeOpeningMedia(occupied,base,{konami:image()}),/reserva/);assert.deepEqual(occupied,snapshot);
});
test('per-screen Start preferences export with original or imported media',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);p.changes.openingStart={konami:'next',international:'next','we-love-soccer':'title'};const original=(await buildDeluxeProject(file,p)).rom.subarray(p.base.headerSize);assert.equal(original[0x493],0x5c);assert.equal(original[0x1e0c7],0x5c);assert.deepEqual(original.slice(0x480,0x484),base.slice(0x480,0x484));p.changes.openingMedia={konami:image()};p.changes.openingStart.konami='title';const custom=(await buildDeluxeProject(file,p)).rom.subarray(p.base.headerSize);assert.equal(custom[0x480],0x5c);assert.equal(custom[0x1e0c7],0x5c);p.changes.openingStart.konami='bad';await assert.rejects(buildDeluxeProject(file,p),/Start inválida/);
});
test('opening replacement preserves the full GG project and its sixty-team visual assets',{skip:!fixture||!process.env.ISSSD_GG_RECOVERED_PROJECT},async()=>{
 const p=JSON.parse(fs.readFileSync(process.env.ISSSD_GG_RECOVERED_PROJECT)),before=structuredClone(p),file=new Uint8Array(fs.readFileSync(fixture));
 const header=splitRom(file).header.length,original=(await buildDeluxeProject(file,p)).rom.subarray(header);
 const video=n=>{const f=frame();return {...image(),kind:'video',frames:Array.from({length:n},()=>f)};};
 p.changes.openingMedia={konami:video(30),international:video(30),'we-love-soccer':video(24)};
 const edited=(await buildDeluxeProject(file,p)).rom.subarray(header);
 assert.deepEqual(edited.slice(0x17b80,0x17bb3),original.slice(0x17b80,0x17bb3));
 assert.equal(edited[0x17bb4+84*13-1],255);
 if(Object.hasOwn(before.changes,'openingMedia'))p.changes.openingMedia=before.changes.openingMedia;else delete p.changes.openingMedia;assert.deepEqual(p,before);
});
test('all imported opening routes restore native PPU tile bases before initializing the title',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom;
 const ids=['konami','international','we-love-soccer'],at=0x5d1bd;
 const target=(rom,p)=>((rom[p+3]&0x7f)*0x8000)+((rom[p+1]|rom[p+2]<<8)&0x7fff);
 for(const id of ids){
  const original=applyDeluxeOpeningMedia(base,base,undefined,{[id]:'title'});
  assert.deepEqual(original.slice(at,at+6),base.slice(at,at+6));
  const rom=applyDeluxeOpeningMedia(base,base,{[id]:image()},{[id]:'title'});
  assert.equal(rom[at],0x5c);
  assert.deepEqual(Array.from(rom.slice(at+4,at+6)),[0xea,0xea]);
  const entry=target(rom,at),restore=target(rom,entry);
  assert.equal(rom[entry],0x22);
  assert.deepEqual(rom.slice(entry+4,entry+10),base.slice(at,at+6));
  assert.deepEqual(Array.from(rom.slice(restore+6,restore+18)),[0xe2,0x20,0xa9,0x22,0x8d,0x0b,0x21,0xa9,0x44,0x8d,0x0c,0x21]);
 }
});
