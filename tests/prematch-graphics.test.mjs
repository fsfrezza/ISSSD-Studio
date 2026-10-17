import test from 'node:test';
import assert from 'node:assert/strict';
import {PREMATCH_GRAPHIC_MAPS,plusPrematchGraphicsWriter} from '../src/core/plus-prematch-graphics.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
function fixture(){
 const base=new Uint8Array(0x200000).fill(255),gfx=Uint8Array.from({length:3168},(_,i)=>i<16?0:(i*11+i%7)&255),map=new Uint8Array(2048);
 for(let i=0;i<1024;i++){map[i*2]=0;map[i*2+1]=0x22;}
 for(const [i,first] of [0x201,0x20F,0x221,0x234,0x28E,0x248,0x256,0x26A,0x27E,0x206].entries())for(let row=0;row<2;row++)for(let x=0;x<2;x++){
  const at=((4+i*2+row)*32+11+x)*2,v=first+row*2+x;map[at]=v&255;map[at+1]=0x20|v>>8;
 }
 base.set(konamiLzCompress(gfx),0xf631c);for(const m of PREMATCH_GRAPHIC_MAPS)base.set(konamiLzCompress(map),m.pc);return base;
}
function pixels(rom,pc,row){const gfx=konamiLzDecompress(rom,0xf631c).data,map=konamiLzDecompress(rom,pc).data,out=new Uint8Array(112*16);for(let y=0;y<16;y++)for(let x=0;x<112;x++){
 const at=((row+(y>>3))*32+10+(x>>3))*2,t=((map[at]|map[at+1]<<8)&1023)-512;if(t<0)continue;
 const i=t*16+(y%8)*2,bit=7-x%8;out[y*112+x]=((gfx[i]>>bit)&1)|(((gfx[i+1]>>bit)&1)<<1);
 }return out;}
test('changing a pre-match inscription updates all five menu variants and preserves shared English glyphs elsewhere',()=>{
 const base=fixture(),before=base.slice(),rom=base.slice(),s={screenTextsV1:{values:{'match-options':{formation:'FORMACAO'}}}},saved=structuredClone(s);
 plusPrematchGraphicsWriter(rom,s,base,['pre-partida']);assert.deepEqual(base,before);assert.deepEqual(s,saved);
 for(const m of PREMATCH_GRAPHIC_MAPS)for(let i=0;i<10;i++)if(i===2)assert.notDeepEqual(pixels(rom,m.pc,4+i*2),pixels(base,m.pc,4+i*2));else assert.deepEqual(pixels(rom,m.pc,4+i*2),pixels(base,m.pc,4+i*2),'unchanged row '+i);
 const classify=areaClassifier(rom,base);for(let i=0;i<rom.length;i++)if(rom[i]!==base[i])assert.equal(classify(i),'pre-partida',i.toString(16));
 const ignored=base.slice();plusPrematchGraphicsWriter(ignored,s,base,['formacoes']);assert.deepEqual(ignored,base);
});
test('pre-match glyph limits and incompatible maps refuse all writes before mutation',()=>{
 const base=fixture();for(const text of ['X'.repeat(40),'#']){const rom=base.slice();assert.throws(()=>plusPrematchGraphicsWriter(rom,{screenTextsV1:{values:{'match-options':{formation:text}}}},base));assert.deepEqual(rom,base);}
 const invalid=base.slice();invalid[0xdbef7]=0;invalid[0xdbef8]=0;const rom=invalid.slice();assert.throws(()=>plusPrematchGraphicsWriter(rom,{screenTextsV1:{values:{'match-options':{formation:'FORMACAO'}}}},invalid));assert.deepEqual(rom,invalid);
});
