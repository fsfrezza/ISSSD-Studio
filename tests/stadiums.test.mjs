import test from 'node:test';
import assert from 'node:assert/strict';
import {STADIUMS,readStadiums,validateStadiums,stadiumsWriter} from '../src/core/stadiums.mjs';
function fixture(header=0){const b=new Uint8Array(0x200000+header);for(const s of STADIUMS){const word=(p,v)=>{b[header+p]=v&255;b[header+p+1]=v>>8};word(0xEF81+s.id*2,s.loader);b.set([0x28,0,0,0x10],header+s.loader);word(s.loader+4,0x8000+s.palette-0x48000);b[header+s.loader+6]=0x89;word(s.palette,0x1F);for(let i=0;i<16;i++)word(s.palette+2+i*2,s.id*32+i);}return b;}
test('identifies eight native stadiums and handles copier header while refusing an incompatible loader',()=>{
 for(const hs of [0,512]){const b=fixture(hs);assert.equal(readStadiums(b)[6].name,'Brasil');assert.equal(readStadiums(b)[7].colors[15],239);b[hs+STADIUMS[2].loader]=0;assert.throws(()=>readStadiums(b),/incompatível/);}
});
test('stadium edits serialize exactly and are exported only with Partida, leaving other palettes and base unchanged',()=>{
 const base=fixture(),before=base.slice(),colors=readStadiums(base)[6].colors;colors[3]=0x7FFF;
 const state={stadiumsV1:JSON.parse(JSON.stringify({schema:'isssd-stadiums-v1',stadiums:{6:{colors}}}))};
 const excluded=base.slice();stadiumsWriter(excluded,state,base,['jogadores']);assert.deepEqual(excluded,base);
 const out=base.slice();stadiumsWriter(out,state,base,['partida']);assert.equal(readStadiums(out)[6].colors[3],0x7FFF);
 for(const s of STADIUMS)if(s.id!==6)assert.deepEqual(readStadiums(out)[s.id].colors,readStadiums(base)[s.id].colors);
 assert.deepEqual(base,before);assert.deepEqual(validateStadiums(state.stadiumsV1),state.stadiumsV1);
});
test('malformed edits and conflicts fail atomically before writing any stadium palette',()=>{
 const base=fixture(),out=base.slice(),catalog=readStadiums(base);out[STADIUMS[7].palette+2]=255;const before=out.slice();
 const state={stadiumsV1:{schema:'isssd-stadiums-v1',stadiums:{0:{colors:catalog[0].colors.map(()=>1)},7:{colors:catalog[7].colors}}}};
 assert.throws(()=>stadiumsWriter(out,state,base),/Conflito/);assert.deepEqual(out,before);
 state.stadiumsV1.stadiums[0].colors[0]=0x8000;assert.throws(()=>stadiumsWriter(out,state,base),/inválidas/);assert.deepEqual(out,before);
});
