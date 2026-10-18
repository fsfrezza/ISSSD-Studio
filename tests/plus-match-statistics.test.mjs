import test from 'node:test';
import assert from 'node:assert/strict';
import {MATCH_STATISTICS_FIELDS as fields} from '../src/core/match-statistics-fields.mjs';
import {renderMatchStatistics,plusMatchStatisticsWriter,MATCH_STATISTICS_SLOT,MATCH_STATISTICS_REGIONS} from '../src/core/plus-match-statistics.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
const values=Object.fromEntries(fields.map(([id,,pt])=>[id,pt]));
const state=v=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'match-statistics':v}}});
function fixture(){const b=new Uint8Array(0x200000).fill(255);b.set([0xD9,0x80,0x9B],0x10B53);b.set([0xA2,0x4F,0x8B],0x5A35B);b.set(konamiLzCompress(new Uint8Array(304).fill(0x66)),0xD80D9);b.set(konamiLzCompress(new Uint8Array(496).fill(0x55)),0xD81FA);
 for(const [i,[,,,pc]]of fields.slice(0,7).entries()){b.set([pc&255,pc>>8],0xF1DB+i*2);b.fill(0,pc,pc+21);b[pc+21]=255;}
 let at=0x4E8A;for(let i=0;i<8;i++){b.set([0xA9,0,0,0x99,i*2,0],at);at+=6;if(i!==3){b.set([0xA9,0,0],at);at+=3;}b.set([0x99,16+i*2,0],at);at+=3;}assert.equal(at,0x4EE7);
 return b;
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
 assert.deepEqual(konamiLzDecompress(rom,MATCH_STATISTICS_SLOT).data,renderMatchStatistics(values).lowFont);assert.deepEqual(konamiLzDecompress(rom,MATCH_STATISTICS_SLOT+512).data,renderMatchStatistics(values).highFont);
 for(let at=0x4E8A;at<0x4EE7;){if(b[at]===0xA9){assert.equal(rom[at],0xA9);at+=3;}else{assert.deepEqual(rom.slice(at,at+3),b.slice(at,at+3));at+=3;}}
 for(const [,,,pc]of fields.slice(0,7)){assert.equal(rom[pc+21],255);assert.equal(rom[pc+2],253);}
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
