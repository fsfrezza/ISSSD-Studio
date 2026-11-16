import test from 'node:test';
import assert from 'node:assert/strict';
import {centeredImageRect,quantizeRgba} from '../src/core/pixel-editor.mjs';
import {editIndependentFlag,independentFlagPixels} from '../src/core/independent-team-fields.mjs';
test('square badge occupies sixteen centered pixels with four transparent columns on each side',()=>{
 const rect=centeredImageRect(256,256,24,16);assert.deepEqual(rect,{x:4,y:0,width:16,height:16});
 const rgba=new Uint8Array(24*16*4);for(let y=0;y<16;y++)for(let x=4;x<20;x++)rgba.set([255,255,255,255],(y*24+x)*4);
 const palette=[[0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255]],pixels=quantizeRgba(rgba,palette).map(v=>v?v+11:0);
 const team=editIndependentFlag({data:{}},pixels);assert.deepEqual(independentFlagPixels(team),pixels);
 for(let y=0;y<16;y++){assert.deepEqual(pixels.slice(y*24,y*24+4),[0,0,0,0]);assert.deepEqual(pixels.slice(y*24+20,y*24+24),[0,0,0,0]);}
 assert.deepEqual(centeredImageRect(300,200,24,16),{x:0,y:0,width:24,height:16});
});
