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
 return b;
}
test('all Portuguese names fit the short-name strip and share an OAM font with Q',()=>{
 for(const r of presets){assert.ok(renderSmallTeamName(r.compact).width<=32);assert.ok(renderSmallTeamName(r.englishShort??r.english).width<=32);}
 const big=renderBigTeamNames(presets.map(r=>normalizeTeamName(r.big)));assert.ok(big.count<=411);assert.ok(big.dictionary.includes('Q'));assert.equal(big.font.length,4096);assert.equal(big.raw.length,59+big.count*4);
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
 const base=fixture(),before=base.slice(),rom=base.slice();plusTeamNamesWriter(rom,state,base);
 for(let i=0;i<56;i++){
  const cpu=long(rom,0x17CA6+i*6+3);assert.equal(word(rom,0xFEB0+i*2),cpu&65535);
  const data=konamiLzDecompress(rom,pc(cpu)).data;assert.equal(data.length,i===54?128:64);assert.deepEqual(data.slice(0,64),renderSmallTeamName(presets[i].compact).raw);
 }
 const big=renderBigTeamNames(presets.map(r=>normalizeTeamName(r.big)));assert.deepEqual(konamiLzDecompress(rom,0x13E4B6).data,big.raw);assert.deepEqual(konamiLzDecompress(rom,0xEE13C).data,big.font);
 assert.equal(long(rom,0x10A70),0x9DE13C);assert.equal(long(rom,0x10C21),0xA7E4B6);assert.deepEqual(base,before);
 for(let off=0;off<base.length;off++)if(base[off]!==rom[off])assert.ok(TEAM_NAME_REGIONS.some(([a,b])=>off>=a&&off<b));
});
