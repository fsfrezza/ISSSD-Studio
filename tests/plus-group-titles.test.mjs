import test from 'node:test';
import assert from 'node:assert/strict';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {GROUP_TITLE_ASSET,plusGroupTitlesWriter} from '../src/core/plus-group-titles.mjs';
import {PLUS_GROUP_ORDER,PLUS_GROUP_TITLES} from '../src/core/plus-group-identity.mjs';
const logical=['AMERICA 1','AMERICA 2','AMERICA 3','EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA','AFRICA','ALL STARS'];
function fixture(){
 const base=new Uint8Array(0x200000).fill(255),a=GROUP_TITLE_ASSET;
 base.set(konamiLzCompress(new Uint8Array(992)),a.pc);base.set([0x78,0xEC,0x9E],a.pointer);
 const state={plusGroups:{labels:[...logical],titlePointers:[...PLUS_GROUP_ORDER,9].map(i=>PLUS_GROUP_TITLES[i])}};
 return {base,state};
}
test('free group names generate independent native descriptors and a valid bounded 2bpp atlas',()=>{
 const {base,state}=fixture(),before=base.slice(),rom=base.slice();
 state.plusGroups.labels=['GRUPO A','GRUPO B','GRUPO C','LENDAS 1','LENDAS 2','LENDAS 3','EUROPA','ORIENTE','AFRICA','ESTRELAS'];
 plusGroupTitlesWriter(rom,state,base);
 const d=konamiLzDecompress(rom,GROUP_TITLE_ASSET.pc);
 assert.ok(d.compressedSize<=GROUP_TITLE_ASSET.size);assert.ok(d.data.length<=64*16);
 const desc=i=>rom.slice(0x30000+PLUS_GROUP_TITLES[PLUS_GROUP_ORDER[i]],0x30000+PLUS_GROUP_TITLES[PLUS_GROUP_ORDER[i]]+16);
 assert.notDeepEqual(desc(0),desc(1));
 for(let i=0;i<10;i++)for(const code of rom.slice(0x30000+PLUS_GROUP_TITLES[i],0x30000+PLUS_GROUP_TITLES[i]+16)){
  assert.ok(code>=0xB2&&code<=0xF1);assert.ok((code-0xB2)*16<d.data.length);
 }
 assert.deepEqual(base,before);
 assert.deepEqual(rom.slice(GROUP_TITLE_ASSET.pc+GROUP_TITLE_ASSET.size,GROUP_TITLE_ASSET.pc+GROUP_TITLE_ASSET.size+16),before.slice(GROUP_TITLE_ASSET.pc+GROUP_TITLE_ASSET.size,GROUP_TITLE_ASSET.pc+GROUP_TITLE_ASSET.size+16));
});
test('native titles and unchecked selection phase preserve original graphics',()=>{
 const {base,state}=fixture(),rom=base.slice();plusGroupTitlesWriter(rom,state,base);assert.deepEqual(rom,base);
 state.plusGroups.labels[0]='NOVO';plusGroupTitlesWriter(rom,state,base,['jogadores']);assert.deepEqual(rom,base);
});
test('accents normalize, punctuation works and invalid or overflowing labels fail without partial writes',()=>{
 const {base,state}=fixture();state.plusGroups.labels[0]='SÉRIE A.';plusGroupTitlesWriter(base.slice(),state,base);
 for(const name of ['', 'TIME@', 'W'.repeat(70)]){const rom=base.slice();state.plusGroups.labels[0]=name;assert.throws(()=>plusGroupTitlesWriter(rom,state,base),/Grupos:/);assert.deepEqual(rom,base);}
});
