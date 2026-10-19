import {nativeMenuGlyphReader} from '../src/core/native-menu-glyphs.mjs';
import {executeHook} from './65816-hook-harness.mjs';
import {seedNativeMenuFontFixture} from './native-menu-font-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {MATCH_STATISTICS_FIELDS as fields} from '../src/core/match-statistics-fields.mjs';
import {renderMatchStatistics,plusMatchStatisticsWriter,MATCH_STATISTICS_SLOT,MATCH_STATISTICS_REGIONS,MATCH_STATISTICS_CORNER_SLOT} from '../src/core/plus-match-statistics.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
const values=Object.fromEntries(fields.map(([id,,pt])=>[id,pt]));
const state=v=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'match-statistics':v}}});
function fixture(){const b=new Uint8Array(0x200000).fill(255);b.set([0xD9,0x80,0x9B],0x10B53);b.set([0xA2,0x4F,0x8B],0x5A35B);b.set([0x22,0x22,0xA0,0x80],0x5A3C6);b.set(konamiLzCompress(new Uint8Array(304).fill(0x66)),0xD80D9);b.set(konamiLzCompress(new Uint8Array(496).fill(0x55)),0xD81FA);
 for(const [i,[,,,pc]]of fields.slice(0,7).entries()){b.set([pc&255,pc>>8],0xF1DB+i*2);b.fill(0,pc,pc+21);b[pc+21]=255;}
 let at=0x4E8A;for(let i=0;i<8;i++){b.set([0xA9,0,0,0x99,i*2,0],at);at+=6;if(i!==3){b.set([0xA9,0,0],at);at+=3;}b.set([0x99,16+i*2,0],at);at+=3;}assert.equal(at,0x4EE7);
 return seedNativeMenuFontFixture(b);
}
test('statistics and goal history render all Portuguese defaults and each independent English restoration',()=>{
 const r=renderMatchStatistics(values);assert.ok(r.highCount<=77&&r.lowCount<=45);assert.equal(r.labels.ownGoal.length,16);assert.equal(r.labels.firstHalf.length,3);
 for(const [id,en]of fields)assert.doesNotThrow(()=>renderMatchStatistics({...values,[id]:en}));
 assert.deepEqual(pendingAdditionalTextExports(state(values)),[]);
});
test('native statistics export preserves numbers, small characters and code while repointing the correct LoROM slot',()=>{
 const b=fixture(),before=b.slice(),rom=new Uint8Array(0x400000).fill(255);rom.set(b);const initial=rom.slice();plusMatchStatisticsWriter(rom,state(values),b,['partida']);
 const cpu=rom[0x17B69]|rom[0x17B6A]<<8|rom[0x17B6B]<<16;assert.equal(((cpu>>16)&127)*32768+(cpu&32767),MATCH_STATISTICS_SLOT);
 assert.deepEqual(rom.slice(0x17B60,0x17B67),Uint8Array.from([0,0,0,0x5D,0xD9,0x80,0x9B]));assert.deepEqual(rom.slice(0xD80D9,0xD81FA),b.slice(0xD80D9,0xD81FA));assert.deepEqual(rom.slice(0xD81FA,0xD83FA),b.slice(0xD81FA,0xD83FA));
 const expected=renderMatchStatistics(values,b);expected.highFont.set(konamiLzDecompress(b,0xD80D9).data,(0x1A0-0x190)*16);assert.deepEqual(konamiLzDecompress(rom,MATCH_STATISTICS_SLOT).data,expected.lowFont);assert.deepEqual(konamiLzDecompress(rom,MATCH_STATISTICS_SLOT+512).data,expected.highFont.slice(0,(0x1EA-0x190)*16));
 for(let at=0x4E8A;at<0x4EE7;){if(b[at]===0xA9){assert.equal(rom[at],0xA9);at+=3;}else{assert.deepEqual(rom.slice(at,at+3),b.slice(at,at+3));at+=3;}}
 for(const [id,,,pc]of fields.slice(0,7)){if(id==='cornerKicks'){assert.deepEqual(rom.slice(pc,pc+22),b.slice(pc,pc+22));assert.equal(rom[MATCH_STATISTICS_CORNER_SLOT+29],255);assert.equal(rom[MATCH_STATISTICS_CORNER_SLOT+2],253);}else{assert.equal(rom[pc+21],255);assert.equal(rom[pc+2],253);}}
 const classify=areaClassifier(rom,b);for(let i=0;i<rom.length;i++)if(rom[i]!==initial[i]){assert.ok(MATCH_STATISTICS_REGIONS.some(([a,z])=>i>=a&&i<z));assert.equal(classify(i),'partida');}assert.deepEqual(b,before);
});
test('statistics respect phase selection, English-only values and drafts, and fail before writing invalid input',()=>{
 const b=fixture(),rom=new Uint8Array(0x400000).fill(255);rom.set(b);const before=rom.slice();
 plusMatchStatisticsWriter(rom,state(values),b,['jogadores']);assert.deepEqual(rom,before);
 plusMatchStatisticsWriter(rom,state(Object.fromEntries(fields.map(([id,en])=>[id,en]))),b);assert.deepEqual(rom,before);
 plusMatchStatisticsWriter(rom,{additionalScreenTextsV1:{drafts:{'match-statistics':values}}},b);assert.deepEqual(rom,before);
 for(const bad of [{...values,shots:'@'},{...values,shots:'CHUTES '.repeat(40)}]){assert.throws(()=>plusMatchStatisticsWriter(rom,state(bad),b));assert.deepEqual(rom,before);}
 const wrong=b.slice();wrong[0x10B53]^=1;assert.throws(()=>plusMatchStatisticsWriter(rom,state(values),wrong),/carregador/);assert.deepEqual(rom,before);
});

test('compiled statistics load around flags and team names instead of replacing live glyphs',()=>{
 const base=fixture(),rom=new Uint8Array(0x400000).fill(255);rom.set(base);plusMatchStatisticsWriter(rom,state(values),base,['partida']);
 const vram=new Uint8Array(65536).fill(0xA5),protectedRanges=[[0x5C00*2,0x5C80*2],[0x5F50*2,0x5F70*2],[0x5FD0*2,0x5FF0*2]];
 let cursor=0x17B62,count=0;while(rom[cursor]!==255){const target=(rom[cursor]|rom[cursor+1]<<8)*2,source=rom[cursor+2]|rom[cursor+3]<<8|rom[cursor+4]<<16,pc=((source>>16)&127)*32768+(source&32767),raw=konamiLzDecompress(rom,pc).data;for(const [a,z]of protectedRanges)assert.ok(target+raw.length<=a||target>=z,'loader must skip every live native glyph range');vram.set(raw,target);cursor+=5;count++;}
 assert.equal(count,4);for(const [a,z]of protectedRanges)assert.ok(vram.slice(a,z).every(v=>v===0xA5));
 assert.deepEqual(vram.slice(0x5D00*2,0x5D98*2),konamiLzDecompress(base,0xD80D9).data,'native numbers survive the surrounding atlas load');
 for(const [id,en]of fields)assert.doesNotThrow(()=>renderMatchStatistics({...values,[id]:en},base));
});

test('wide corner row keeps full-width letters and routes only its descriptor through the RAM-mirroring bank',()=>{
 const b=fixture(),rom=new Uint8Array(0x400000).fill(255);rom.set(b);plusMatchStatisticsWriter(rom,state(values),b,['partida']);
 const render=renderMatchStatistics(values,b);assert.equal(render.labels.cornerKicks.length,22);
 const glyph=nativeMenuGlyphReader(b),text='ESCANTEIOS';for(let i=0;i<text.length;i++){const expected=glyph(text[i]);for(let y=0;y<16;y++)for(let x=0;x<8;x++){const xx=4+i*8+x,tile=render.labels.cornerKicks[(y>>3)*11+(xx>>3)],pos=(tile-0x190)*16+(y%8)*2,bit=7-xx%8;assert.equal((render.highFont[pos]>>bit&1)|(render.highFont[pos+1]>>bit&1)<<1,expected[y*8+x],'retain every native glyph column without horizontal resampling');}}
 const at=MATCH_STATISTICS_CORNER_SLOT;assert.equal(rom[at]|rom[at+1]<<8,0x592A);assert.equal(rom[at+16]|rom[at+17]<<8,0x594A);
 assert.deepEqual([...rom.slice(at+4,at+15)],render.labels.cornerKicks.slice(0,11).map(t=>t&255));
 const memory=new Uint8Array(0x1000000),target=0xB0F440;memory.set(rom.slice(0x187440,0x187480),target);
 for(const x of [0xF217,0xF1EB]){const result=executeHook(memory,target,{a:0x2000,x,db:0x81,s:0x1FF},new Set([0x80A022]));assert.equal(result.calls.length,1);assert.equal(result.calls[0].a,0x2000);assert.equal(result.calls[0].x,x===0xF217?0xF400:x);assert.equal(result.calls[0].db,x===0xF217?0xB0:0x81);assert.equal(result.r.db,0x81);assert.equal(result.r.s,0x1FF);}
});
