import test from 'node:test';import assert from 'node:assert/strict';
import {IndexedPixelEditor,quantizeRgba} from '../src/core/pixel-editor.mjs';
test('stroke interpolation is one undoable transaction; redo is invalidated only by a new change',()=>{
 const m=new IndexedPixelEditor({width:8,height:8,pixels:Array(64).fill(0)});m.begin();m.line(0,0,7,7,5);m.end();for(let i=0;i<8;i++)assert.equal(m.pixels[i*9],5);m.undo();assert.ok(m.pixels.every(v=>v===0));m.begin();m.set(0,0,0);assert.equal(m.end(),false);assert.equal(m.redo(),true);m.undo();m.begin();m.set(1,1,2);m.end();assert.equal(m.redo(),false);
});
test('protected pixels stop fill and replacement; cancellation restores the complete stroke',()=>{
 const m=new IndexedPixelEditor({width:3,height:3,pixels:Array(9).fill(1),mask:[1,0,1,1,0,1,1,0,1]});m.begin();m.fill(0,0,7);m.end();assert.deepEqual(m.snapshot(),[7,1,1,7,1,1,7,1,1]);m.replace(Array(9).fill(8));assert.deepEqual(m.snapshot(),[8,1,8,8,1,8,8,1,8]);m.begin();m.line(0,0,2,2,0);m.cancel();assert.equal(m.pixels[0],8);assert.equal(m.sample(-1,0),null);const snap=m.snapshot();snap[0]=0;assert.equal(m.pixels[0],8);assert.throws(()=>m.replace(Array(9).fill(16)));assert.equal(m.pixels[0],8);
});
test('palette quantization keeps transparency and never assigns opaque pixels to transparent ink',()=>{
 const palette=[[255,0,0],[0,0,0],[255,255,255]];assert.deepEqual(quantizeRgba([255,0,0,0,250,250,250,255,2,2,2,255],palette),[0,2,1]);
});

import fs from 'node:fs';import vm from 'node:vm';
test('canvas adapter confines fill to selected frame and preserves cross-frame undo, redo and cancellation',()=>{
 const window={ISSSDPixelCore:{IndexedPixelEditor}};vm.runInNewContext(fs.readFileSync(new URL('../editor-src/pixel-editor.mjs',import.meta.url),'utf8'),{window});
 let pixels=Array(128).fill(0),frame=0,tool='fill',picked=-1;
 const canvas={getBoundingClientRect:()=>({left:0,top:0,width:80,height:80}),setPointerCapture(){}};
 const editor=window.ISSSDPixelEditor.attach({canvas,read:()=>({width:8,height:16,pixels}),write:p=>{pixels=p;},viewport:()=>({x:0,y:frame*8,width:8,height:8}),tool:()=>tool,ink:()=>7,pick:v=>{picked=v;}});
 const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,preventDefault(){}});
 canvas.onpointerdown(event(5,5));assert.ok(pixels.slice(0,64).every(v=>v===7));assert.ok(pixels.slice(64).every(v=>v===0));
 frame=1;tool='pencil';canvas.onpointerdown(event(5,5));canvas.onpointermove(event(75,75));canvas.onpointermove(event(75,85));canvas.onpointerup(event(75,85));assert.equal(pixels[64],7);editor.undo();assert.ok(pixels.slice(64).every(v=>v===0));editor.redo();assert.equal(pixels[127],7);
 tool='erase';canvas.onpointerdown(event(5,5));canvas.onpointercancel();assert.equal(pixels[64],7);tool='pick';canvas.onpointerdown(event(5,5));assert.equal(picked,7);
});
test('build embeds the reusable pixel core and adapter as a valid classic script before uniform UI',()=>{
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
 const root=new URL('..',import.meta.url).pathname;const a=build.indexOf('const pixelSource='),z=build.indexOf('const goalkeeperRuntime=',a);const context=vm.createContext({fs,path:{join:(...p)=>p.join('/')},root,uniformSource:fs.readFileSync(new URL('../src/core/team-uniforms.mjs',import.meta.url),'utf8'),uniformExports:['validateUniforms']});
 vm.runInContext(build.slice(a,z)+'\nglobalThis.runtime=uniformRuntime;',context);assert.doesNotThrow(()=>new vm.Script(context.runtime));assert.ok(context.runtime.indexOf('window.ISSSDPixelCore')<context.runtime.indexOf('window.ISSSDUniforms'));
});
