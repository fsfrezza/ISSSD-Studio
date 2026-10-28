import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stableFieldFlag} from '../src/core/field-flag-colors.mjs';
import {independentFlagPixels} from '../src/core/independent-team-fields.mjs';
test('field flags use only the three stable scoreboard colors and preserve background borders',()=>{
 const colors=[0x4210,0x2060,0x001F,0],pixels=Array.from({length:384},(_,i)=>i%24<12?13:14);
 for(let y=4;y<12;y++)for(let x=8;x<16;x++)pixels[y*24+x]=15;
 pixels[5*24+8]=12;const before=pixels.slice(),next=stableFieldFlag(pixels,colors);
 assert.ok(next.pixels.every(v=>v>=13&&v<=15));assert.deepEqual(pixels,before);assert.deepEqual(colors,[0x4210,0x2060,0x001F,0]);
 for(let x=0;x<24;x++)assert.equal(next.colors[next.pixels[x]-12],colors[pixels[x]-12]);
 const draw=first=>next.pixels.map(v=>[first,...next.colors.slice(1)][v-12]);assert.deepEqual(draw(31),draw(32767));
 assert.throws(()=>stableFieldFlag([12],colors));
});
test('all six project flags adapt for the scoreboard without changing selection graphics or stored colors',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url)));
 for(const t of Object.values(p.state.semantic.independentTeamsV1.teams)){
  const before=structuredClone(t),colors=Array.from({length:4},(_,i)=>t.data.palettes.fieldFlag[2+i*2]|t.data.palettes.fieldFlag[3+i*2]<<8),pixels=independentFlagPixels(t,'fieldFlags'),next=stableFieldFlag(pixels,colors);
  assert.ok(!next.pixels.includes(12));assert.deepEqual(t,before);assert.equal(next.colors.length,4);assert.equal(new Set(next.pixels).size<=3,true);
 }
});
