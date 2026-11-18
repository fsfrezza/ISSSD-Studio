import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const stadium=readFileSync(new URL('../src/core/deluxe-stadium-layout.mjs',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/core/deluxe-screen-scenes.mjs',import.meta.url),'utf8');
test('only value range (columns 15-26) is highlighted',()=>{
 assert.match(stadium,/row=optimized\?24:25,col=15,width=11/);
 assert.doesNotMatch(stadium,/col=6,width=19/);
 assert.match(scene,/xx=120;xx<=215/);
 assert.match(scene,/xx-120,215-xx/);
});
