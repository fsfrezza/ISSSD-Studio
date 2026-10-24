import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {uniformPreviewPixels} from '../src/core/uniform-preview.mjs';
import {independentTeamsRuntime} from '../scripts/patch-independent-teams.mjs';
test('uniform preview separates shirt, shorts and socks using the active kit palette',()=>{
 const colors=Array.from({length:16},(_,i)=>i*100),copy=colors.slice(),pattern=Array(256).fill(0),view=uniformPreviewPixels(colors,pattern),at=(x,y)=>view.pixels[y*48+x];
 assert.equal(view.width,48);assert.equal(view.height,64);assert.equal(view.pixels.length,3072);
 assert.equal(at(30,28),9);assert.equal(at(20,40),12);assert.equal(at(20,53),14);assert.equal(at(0,0),-1);
 assert.deepEqual(colors,copy);assert.ok(view.pixels.every(v=>v>=-1&&v<=15));
 const away=colors.map(v=>v+1),next=uniformPreviewPixels(away,pattern);assert.notEqual(view.colors[at(30,28)],next.colors[at(30,28)]);
});
test('uniform preview follows the chosen native pattern frame and preserves transparent pixels',()=>{
 const pattern=Array(256).fill(0);pattern[32]=0x80;pattern[32+16]=0x80;const a=uniformPreviewPixels([],pattern,0),b=uniformPreviewPixels([],pattern,1);
 assert.equal(a.pixels[10*48+16],7);assert.equal(b.pixels[10*48+16],5);assert.deepEqual(pattern.slice(32,34),[128,0]);
});
test('generated classic runtime exposes the preview API before installing the independent teams UI',()=>{
 const source=independentTeamsRuntime(),window={};const prefix=source.slice(0,source.indexOf('window.ISSSDIndependentTeams'));
 new vm.Script(prefix).runInNewContext({window});assert.equal(typeof window.ISSSDUniformPreview.uniformPreviewPixels,'function');
 assert.equal(window.ISSSDUniformPreview.uniformPreviewPixels(Array(16).fill(0),Array(256).fill(0)).width,48);
});
