import test from 'node:test';
import assert from 'node:assert/strict';
import {IndexedPixelEditor} from '../src/core/pixel-editor.mjs';
import {bindPixelStroke,pixelAt,installPixelView} from '../deluxe-editor/pixel-workspace.mjs';

test('pointer mapping uses native coordinates at any zoom and rejects outside pixels',()=>{
 const rect={left:10,top:20,width:240,height:160};assert.deepEqual(pixelAt(rect,24,16,{clientX:249,clientY:179}),[23,15]);assert.equal(pixelAt(rect,24,16,{clientX:250,clientY:179}),null);assert.equal(pixelAt({...rect,width:0},24,16,{clientX:10,clientY:20}),null);
});
test('strokes commit once, support undo and cancel a superseded resource safely',()=>{
 let editor=new IndexedPixelEditor({width:4,height:2,pixels:Array(8).fill(1)}),tool='pencil',ink=3,commits=0;
 const canvas={getBoundingClientRect:()=>({left:0,top:0,width:40,height:20})};bindPixelStroke(canvas,{getEditor:()=>editor,getTool:()=>tool,getInk:()=>ink,setInk:v=>ink=v,draw(){},commit(){commits++;}});
 const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,buttons:1});canvas.onpointerdown(event(5,5));canvas.onpointermove(event(35,5));canvas.onpointerup(event(35,5));assert.equal(commits,1);assert.deepEqual(editor.snapshot(),[3,3,3,3,1,1,1,1]);assert.equal(editor.undo(),true);assert.deepEqual(editor.snapshot(),Array(8).fill(1));
 canvas.onpointerdown(event(5,5));canvas.onpointercancel();assert.equal(commits,1);assert.equal(editor.sample(0,0),1);
 canvas.onpointerdown(event(5,5));const old=editor;editor=new IndexedPixelEditor({width:4,height:2,pixels:Array(8).fill(2)});canvas.onpointerup(event(5,5));assert.equal(old.sample(0,0),1);assert.equal(editor.sample(0,0),2);assert.equal(commits,1);
 tool='pick';canvas.onpointerdown(event(5,5));assert.equal(ink,2);assert.equal(commits,1);tool='eraser';canvas.onpointerdown(event(5,5));canvas.onpointerup();assert.equal(editor.sample(0,0),0);assert.equal(commits,2);
});
test('grid is display-only, preserve pixels and restore the session baseline',()=>{
 let exported;class Element{constructor(){this.children=[];this.style={setProperty(){}};}append(...nodes){this.children.push(...nodes);}getContext(){return{createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};}toBlob(callback,type){exported={width:this.width,height:this.height,type};}}
 const before=globalThis.document;globalThis.document={createElement:()=>new Element()};
 try{const canvas=new Element(),controls=new Element(),editor=new IndexedPixelEditor({width:2,height:2,pixels:[0,1,2,3]});let commits=0;const view=()=>({width:editor.width,height:editor.height,pixels:editor.snapshot(),colors:[0,31,992,31744]});let workspace;const redraw=()=>workspace.render(view());workspace=installPixelView({canvas,controls,getEditor:()=>editor,getView:view,redraw,onStatus:assert.fail,commit:()=>{commits++;redraw();}});redraw();assert.equal(canvas.width,2);
 const host=controls.children[0],grid=host.children[1].children[0];grid.checked=true;grid.onchange();assert.equal(canvas.width,16);host.children[2].onclick();assert.deepEqual(exported,{width:2,height:2,type:'image/png'});assert.deepEqual(editor.snapshot(),[0,1,2,3]);assert.equal(commits,0);editor.replace([3,2,1,0]);redraw();host.children[3].onclick();assert.equal(commits,1);assert.deepEqual(editor.snapshot(),[0,1,2,3]);grid.checked=false;grid.onchange();assert.equal(canvas.width,2);
 }finally{globalThis.document=before;}
});
