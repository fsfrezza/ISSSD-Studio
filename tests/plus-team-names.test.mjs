import {seedMenuOamCacheFixture} from './menu-oam-cache-fixture.mjs';
import {TEAM_NAME_POINTER_READS} from '../src/core/plus-team-name-hooks.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TEAM_NAME_SCHEMA,normalizeTeamName,renderSmallTeamName,renderBigTeamNames,planPlusTeamNames,plusTeamNamesWriter,TEAM_NAME_REGIONS} from '../src/core/plus-team-names.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
import {TEAM_NAME_LANGUAGE_PRESETS as presets} from '../src/core/team-name-presets.mjs';
const state={teamNamesV1:{schema:TEAM_NAME_SCHEMA,values:Object.fromEntries(presets.map(r=>[r.teamId,{full:r.portuguese,big:r.big,short:r.compact}]))}};
function sized(data,size){const out=new Uint8Array(size).fill(0x80);assert.ok(data.length<=size);out.set(data);out[0]=size&255;out[1]=size>>8;return out;}
const pc=c=>((c>>>16)&127)*0x8000+(c&32767),word=(b,p)=>b[p]|b[p+1]<<8,long=(b,p)=>word(b,p)|b[p+2]<<16;
function fixture(){
 const b=new Uint8Array(0x200000).fill(255);let offset=0;
 for(let i=0;i<56;i++){
  const raw=new Uint8Array(i===54?128:64),data=konamiLzCompress(raw),cpu=0x9BEA6D+offset,a=0x17CA6+i*6;b[a]=i*64&255;b[a+1]=i*64>>8;b[a+2]=127;b.set([cpu&255,cpu>>8&255,cpu>>16],a+3);b.set([cpu&255,cpu>>8&255],0xFEB0+i*2);b.set(data,0xDEA6D+offset);offset+=data.length;
 }
 const font=new Uint8Array(4096);for(let i=0;i<font.length;i++)font[i]=(i*31+i%29)&255;const f=konamiLzCompress(font);b.set(sized(f,1482),0xEE13C);
 const raw=new Uint8Array(59+374*4);raw.set([56,118,1]);raw[3]=255;raw[4]=119;for(let i=59;i<raw.length;i++)raw[i]=(i*71+i%53)&255;let acc=0;for(let i=0;i<56;i++){b.set([0x02+acc*2&255,(0x4F02+acc*2)>>8],0x17BC4+i*2);acc+=raw[3+i];}b.set(sized(konamiLzCompress(raw),1786),0x13E4B6);
 for(const p of [0x10A70,0x10E14,0x11719])b.set([0x3C,0xE1,0x9D],p);for(const p of [0x10C21,0x10E49,0x116B5])b.set([0xB6,0xE4,0xA7],p);
 b.set([0x9C,0x66,0x14,0x22,0x82,0x9E,0x85],0x2A756);
 b.set([0x22,0x7E,0x94,0x80],0x3B00);b.set([0x22,0x82,0x94,0x80],0x3B59);for(const at of TEAM_NAME_POINTER_READS)b.set([0xBF,0xC4,0xFB,0x82],at);
 return seedMenuOamCacheFixture(b);
}
test('all Portuguese names fit the short-name strip and share an OAM font with Q',()=>{
 for(const r of presets){assert.ok(renderSmallTeamName(r.compact).width<=32);assert.ok(renderSmallTeamName(r.englishShort??r.english).width<=32);}
 const big=renderBigTeamNames(presets.map(r=>normalizeTeamName(r.big)));assert.ok(big.count<=768);assert.ok(big.dictionary.includes('Q'));assert.equal(big.font.length,4096);assert.equal(big.raw.length,59+big.count*4);
 assert.throws(()=>renderSmallTeamName('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),/32 px/);
});
test('invalid team names fail atomically and an unchecked phase leaves the ROM untouched',()=>{
 const base=fixture(),rom=base.slice(),before=rom.slice(),invalid={teamNamesV1:{schema:TEAM_NAME_SCHEMA,values:{30:{full:'BRASIL',short:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}}}};
 assert.throws(()=>plusTeamNamesWriter(rom,invalid,base),/32 px/);assert.deepEqual(rom,before);
 plusTeamNamesWriter(rom,state,base,['jogadores']);assert.deepEqual(rom,before);
 assert.throws(()=>planPlusTeamNames(base,{teamNamesV1:{schema:TEAM_NAME_SCHEMA,values:{56:{full:'TIME',short:'TIME'}}}}),/identidade/);
});
test('team-name native regions belong to team selection, before broad legacy title ranges',()=>{
 const classify=areaClassifier(new Uint8Array(0x400000));
 for(const [a,b]of TEAM_NAME_REGIONS){assert.equal(classify(a),'selecao-equipes');assert.equal(classify(b-1),'selecao-equipes');}
});

test('native plans update all names and scoreboard pointers without relocating the shared font',()=>{
 const base=fixture(),before=base.slice(),rom=new Uint8Array(0x400000).fill(255);rom.set(base);plusTeamNamesWriter(rom,state,base);
 for(let i=0;i<56;i++){
  const cpu=long(rom,0x17CA6+i*6+3);assert.equal(word(rom,0xFEB0+i*2),cpu&65535);
  const data=konamiLzDecompress(rom,pc(cpu)).data;assert.equal(data.length,i===54?128:64);assert.deepEqual(data.slice(0,64),renderSmallTeamName(presets[i].compact).raw);
 }
 const originalFont=konamiLzDecompress(base,0xEE13C).data;const big=renderBigTeamNames(presets.map(r=>normalizeTeamName(r.big)),originalFont);for(const t of Array.from({length:32},(_,i)=>0x60+i))assert.deepEqual(big.font.slice(t*32,(t+1)*32),originalFont.slice(t*32,(t+1)*32));assert.deepEqual(konamiLzDecompress(rom,0x13E4B6).data,big.raw);assert.deepEqual(konamiLzDecompress(rom,0xEE13C).data,big.font);
 assert.equal(long(rom,0x10A70),0x9DE13C);assert.equal(long(rom,0x10C21),0xA7E4B6);assert.deepEqual(base,before);
 for(let off=0;off<base.length;off++)if(base[off]!==rom[off])assert.ok(TEAM_NAME_REGIONS.some(([a,b])=>off>=a&&off<b));
});

test('both translated names, flags and VS fit the native scanline sprite budget',()=>{
 const big=renderBigTeamNames(presets.map(r=>normalizeTeamName(r.big))),counts=[...big.raw.slice(3,59)];
 // Native flags use four 16px sprites and VS uses one: ten 8px slivers.
 // Small text OBJ cells use one sliver apiece, including both longest names.
 for(const left of counts)for(const right of counts)assert.ok(left/2+right/2+10<=34,'two names must not hide each other or VS');
 const props=big.raw.slice(59+big.count*3);assert.ok(props.every(p=>(p&0x10)===0),'native lower priority bit must select small OBJ cells');
 assert.equal(counts[30]/2+counts[0]/2+10<=34,true,'Brasil × Inglaterra');
 assert.equal(counts[34]/2+counts[0]/2+10<=34,true,'E.U.A. × Inglaterra');
});

test('pre-game letters have a six-pixel body while remaining inside small OBJ cells',()=>{
 const r=renderBigTeamNames(['A']);const xs=[],ys=[];for(let y=0;y<16;y++)for(let x=0;x<8;x++){let v=0;for(let p=0;p<4;p++)v|=((r.font[(y>>3)*32+(p>>1)*16+(y%8)*2+(p&1)]>>(7-x))&1)<<p;if(v===10){xs.push(x);ys.push(y);}}
 assert.equal(Math.max(...xs)-Math.min(...xs)+1,6);assert.equal(Math.max(...ys)-Math.min(...ys)+1,12);assert.equal(r.count,2);
});

test('tall names stay inside both native OAM gaps and retain all 56 frame pointers',()=>{
 for(const names of [presets.map(p=>normalizeTeamName(p.big)),presets.map(p=>p.english)]){const r=renderBigTeamNames(names);assert.ok(0x5A00+r.count*2<=0x6000);assert.ok(0x5280+r.count*2<=0x5876);let offset=0;for(let i=0;i<56;i++){assert.equal(word(r.pointers,i*2),offset*2);offset+=r.raw[3+i];}assert.equal(offset,r.count);}
});

test('unexpected native hooks or occupied expanded code fail without partial name writes',()=>{
 for(const mode of ['opcode','reserve']){const base=fixture(),rom=new Uint8Array(0x400000).fill(255);if(mode==='opcode')base[0x3B00]=0;rom.set(base);if(mode==='reserve')rom[0x3E3000]=0;const before=rom.slice();assert.throws(()=>plusTeamNamesWriter(rom,state,base),mode==='opcode'?/conversor/:/reserva/);assert.deepEqual(rom,before);}
});

// The point needs its own side bearings; otherwise the preceding letter's
// higher-priority outline masks it when native objects overlap by one pixel.
test('E.U.A. keeps visible periods between the tall letters',()=>{
 const r=renderBigTeamNames(['E.U.A.']);
 const index=r.dictionary.indexOf('.');assert.ok(index>=0);let body=[];
 for(let y=0;y<16;y++)for(let x=0;x<8;x++){let v=0;for(let p=0;p<4;p++)v|=((r.font[(index*2+(y>>3))*32+(p>>1)*16+(y%8)*2+(p&1)]>>(7-x))&1)<<p;if(v===10)body.push([x,y]);}
 assert.ok(body.length>0);assert.ok(body.every(([x,y])=>x===1&&y>=10));
 const count=r.raw[3],xs=[...r.raw.slice(59,59+count)].filter((_,i)=>i%2===0);
 assert.deepEqual(xs.slice(0,3).map(x=>x-xs[0]),[0,6,9]);
});
test('custom team names respect the smaller token pool while preserving native training glyphs',()=>{
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-',names=Array.from({length:56},(_,i)=>'I'+alphabet[i%alphabet.length]+alphabet[i*7%alphabet.length]);
 const r=renderBigTeamNames(names);assert.ok(r.dictionary.length<=48);assert.ok(r.count<=763);
});
