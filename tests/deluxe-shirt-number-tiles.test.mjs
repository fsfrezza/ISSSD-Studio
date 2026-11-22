import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {decodePreviewTile} from '../src/core/deluxe-visual-preview.mjs';
import {remapShirtNumberTiles,SHIRT_NUMBER_TILE_START,SHIRT_NUMBER_TILE_END} from '../src/core/deluxe-shirt-number-tiles.mjs';
test('native number tile remapping preserves every glyph pixel and transparency',{skip:!process.env.ISSSD_DELUXE_ROM},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(process.env.ISSSD_DELUXE_ROM))).rom;
 const source=base.slice(SHIRT_NUMBER_TILE_START,SHIRT_NUMBER_TILE_END);
 assert.deepEqual(remapShirtNumberTiles(base,12),source);
 for(let index=1;index<16;index++){
  const out=remapShirtNumberTiles(base,index);
  for(let t=0;t<source.length/32;t++)assert.deepEqual(decodePreviewTile(out,t),decodePreviewTile(source,t).map(v=>v?index:0));
 }
 const bad=base.slice();bad[SHIRT_NUMBER_TILE_START]=1;
 assert.throws(()=>remapShirtNumberTiles(bad,15),/incompatível/);
});
