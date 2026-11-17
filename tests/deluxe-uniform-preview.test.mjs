import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {deluxeUniformFramePicture,deluxePlayerPalette} from '../src/core/deluxe-visual-preview.mjs';
import {editIndependentPattern,independentPatternPixels} from '../src/core/independent-team-fields.mjs';
import {appendTeamPixelEditors} from '../deluxe-editor/team-pixels.mjs';

test('each uniform preview uses its matching native pose and pattern tile',{skip:!process.env.ISSSD_DELUXE_ROM},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(process.env.ISSSD_DELUXE_ROM))).rom;
 const ids=new Set();
 for(let frame=0;frame<8;frame++){
  const pattern=editIndependentPattern({data:{}},Array.from({length:512},(_,i)=>i>>6===frame?14:0)).data.pattern;
  const a=deluxeUniformFramePicture(base,{frame,hair:14}),b=deluxeUniformFramePicture(base,{frame,hair:14,pattern});
  assert.equal(base[0x10000+(parseInt(a.pose.id,16)&32767)+5],129+frame);
  assert.notDeepEqual(a.pixels,b.pixels);
  ids.add(a.pose.id);
 }
 assert.equal(ids.size,8);
});
test('reserve palette and editor selections notify the player preview without changing the project',()=>{
 const row={home:Array(34).fill(0),away:Array(34).fill(0),pattern:Array(256).fill(0),flag:Array(10).fill(0),selectionFlags:Array(192).fill(0),fieldFlags:Array(192).fill(0)};
 row.home[16]=31;row.away[16]=224;
 assert.notDeepEqual(deluxePlayerPalette(row,0,false,0),deluxePlayerPalette(row,0,false,1));
 class Element{
  constructor(){this.children=[];this.style={};}
  append(...items){this.children.push(...items);}
  replaceChildren(){this.children=[];}
  setAttribute(){}
  getContext(){return{createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};}
 }
 const previous=globalThis.document;globalThis.document={createElement:()=>new Element()};
 try{
  const root=new Element(),uniformRoot=new Element(),project={changes:{structure:{teams:[{plusId:0}]},teamVisuals:{teams:{0:row}}}},events=[];
  appendTeamPixelEditors(root,{base:new Uint8Array(0x200000),getProject:()=>project,team:0,uniformRoot,onChange:()=>assert.fail('selection must not edit project'),onStatus:()=>{},onUniformPreview:e=>events.push(e)});
  const controls=uniformRoot.children[0].children[0].children[1].children[0];
  const kit=controls.children[0].children[0],frame=controls.children[1].children[0];
  kit.value='1';kit.onchange();frame.value='7';frame.onchange();
  assert.deepEqual(events.map(e=>[e.kit,e.frame]),[[0,0],[1,0],[1,7]]);
 }finally{globalThis.document=previous;}
});
test('uniform eraser clears the selected frame with drag and supports undo and redo',()=>{
 class Element{constructor(){this.children=[];this.style={};}append(...items){this.children.push(...items);}replaceChildren(){this.children=[];}setAttribute(){}getBoundingClientRect(){return{left:0,top:0,width:80,height:80};}getContext(){return{createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};}}
 const previous=globalThis.document;globalThis.document={createElement:()=>new Element()};
 try{const row={home:Array(34).fill(0),away:Array(34).fill(0),pattern:editIndependentPattern({data:{}},Array(512).fill(15)).data.pattern,flag:Array(10).fill(0),selectionFlags:Array(192).fill(0),fieldFlags:Array(192).fill(0)},root=new Element(),uniformRoot=new Element();let project={changes:{structure:{teams:[{plusId:0}]},teamVisuals:{teams:{0:row}}}};
 appendTeamPixelEditors(root,{base:new Uint8Array(0x200000),getProject:()=>project,team:0,uniformRoot,onChange:p=>project=p,onStatus:()=>{},onUniformPreview:()=>{}});
 const body=uniformRoot.children[0].children[0].children[1],controls=body.children[0],canvas=body.children[1],frame=controls.children[1].children[0],tool=controls.children[2].children[0];frame.value='1';frame.onchange();assert.ok(tool.children.some(o=>o.value==='eraser'));tool.value='eraser';tool.onchange();canvas.onpointerdown({clientX:5,clientY:5});canvas.onpointermove({clientX:25,clientY:5,buttons:1});canvas.onpointerup();const pixels=()=>independentPatternPixels({data:{pattern:project.changes.teamVisuals.teams[0].pattern}});assert.deepEqual(pixels().slice(64,68),[0,0,0,15]);assert.equal(pixels()[0],15);controls.children[3].onclick();assert.deepEqual(pixels().slice(64,68),[15,15,15,15]);controls.children[4].onclick();assert.deepEqual(pixels().slice(64,68),[0,0,0,15]);
 }finally{globalThis.document=previous;}
});
