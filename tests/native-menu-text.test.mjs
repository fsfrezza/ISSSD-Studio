import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_MENU_TEXT_SECTIONS as sections} from '../src/core/native-menu-text-fields.mjs';
import {TRAINING_CHOICE_REGIONS,STADIUM_LABEL_REGIONS,TRAINING_SELECTOR_POSITIONS,encodeNativeMenuField,plusNativeMenuTextWriter} from '../src/core/plus-native-menu-text.mjs';
import {pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
const state=values=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values}});
function fixture(){const base=new Uint8Array(0x200000).fill(0xa5);for(const s of sections)for(const f of s.fields){const bytes=encodeNativeMenuField(f,f[1]);f[3].pool.segments.forEach((seg,i)=>base.set(bytes[i],seg.pc));}for(const [pc,v]of TRAINING_SELECTOR_POSITIONS)base.set([v&255,v>>8],pc);for(const section of sections)for(const f of section.fields)if(f[3].pool.relocation){const {pc,ref}=f[3].pool.relocation;base.fill(255,pc,pc+f[3].pool.capacity);const original=f[3].pool.segments[0].pc;base.set([original&255,original>>8&255],ref);base[ref+4]=f[3].pool.segments[0].original.length;}base.set([0x1C,0x77,0xDE],0x3BE05);base.set([0x31,1],0x3B1BE);base.set([0x28,1],0x3448F);return base;}
test('139 audited fields keep original native bytes and separate screen ownership',()=>{
 assert.equal(sections.reduce((n,s)=>n+s.fields.length,0),139);assert.equal(sections.length,20);
 const controls=sections.find(s=>s.id==='controls-help-native');assert.equal(controls.page,'controls');assert.equal(controls.fields.length,6);
 assert.equal(sections.find(s=>s.id==='scenario-native').page,'texts-scenarios');
 const base=fixture(),rom=base.slice(),values=Object.fromEntries(sections.map(s=>[s.id,Object.fromEntries(s.fields.map(f=>[f[0],f[1]]))]));
 plusNativeMenuTextWriter(rom,state(values),base);assert.deepEqual(rom,base);assert.deepEqual(pendingAdditionalTextExports(state(values)),[]);
});
test('confirmed fields write only their own native segments and selected cumulative area',()=>{
 const base=fixture(),before=base.slice(),rom=base.slice(),values={};
 for(const section of sections){values[section.id]={};for(const f of section.fields)values[section.id][f[0]]=(f[1][0]==='A'?'B':'A')+f[1].slice(1);}
 const project=state(values),saved=structuredClone(project);plusNativeMenuTextWriter(rom,project,base);
 const classify=areaClassifier(rom,base);for(let i=0;i<rom.length;i++)if(rom[i]!==base[i]){
  const section=sections.find(s=>s.fields.some(f=>f[3].pool.segments.some(seg=>i>=seg.pc&&i<seg.pc+seg.original.length)));if(!section)assert.ok([...TRAINING_CHOICE_REGIONS,...STADIUM_LABEL_REGIONS].some(([a,z])=>i>=a&&i<z));assert.equal(classify(i),section?.area??'pre-partida');
 }
 assert.deepEqual(base,before);assert.deepEqual(project,saved);
 const skipped=base.slice();plusNativeMenuTextWriter(skipped,project,base,['jogadores']);assert.deepEqual(skipped,base);
 const draft=base.slice();plusNativeMenuTextWriter(draft,{additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',drafts:values}},base);assert.deepEqual(draft,base);
});
test('native field limits and base mismatch refuse all writes atomically',()=>{
 const section=sections.find(s=>s.id==='controls-help-native'),field=section.fields[0],base=fixture(),rom=base.slice();
 assert.throws(()=>plusNativeMenuTextWriter(rom,state({[section.id]:{[field[0]]:'X'.repeat(200)}}),base),/excede/);assert.deepEqual(rom,base);
 const bad=base.slice();bad[field[3].pool.segments[0].pc]^=1;const copy=bad.slice();
 assert.throws(()=>plusNativeMenuTextWriter(copy,state({[section.id]:{[field[0]]:'Ajuda'}}),bad),/ROM-base diverge/);assert.deepEqual(copy,bad);
 assert.throws(()=>encodeNativeMenuField(field,'🙂'),/indisponível/);
});


test('all 139 Portuguese presets fit native fonts, row limits and ROM export',()=>{
 const base=fixture(),before=base.slice(),rom=base.slice(),values={};
 for(const section of sections){values[section.id]={};for(const field of section.fields){assert.equal(typeof field[2],'string',field[0]);assert.ok(field[2].trim(),field[0]);values[section.id][field[0]]=field[2];encodeNativeMenuField(field,field[2]);}}
 plusNativeMenuTextWriter(rom,state(values),base);assert.deepEqual(base,before);assert.deepEqual(pendingAdditionalTextExports(state(values)),[]);
 for(const section of sections)for(const field of section.fields){const encoded=encodeNativeMenuField(field,field[2]);field[3].pool.segments.forEach((seg,i)=>{const pc=field[3].pool.relocation?.pc??seg.pc;assert.deepEqual(rom.slice(pc,pc+encoded[i].length),encoded[i],field[0]);if(field[3].pool.relocation)assert.deepEqual(rom.slice(seg.pc,seg.pc+seg.original.length),base.slice(seg.pc,seg.pc+seg.original.length));});}
});

test('Portuguese mode selector prefixes MODO without moving reused training fields',()=>{
 const b=fixture(),r=b.slice(),p=state({'training-native':{data_87df61:'MODO'}});
 plusNativeMenuTextWriter(r,p,b);
 for(const [pc,,next]of TRAINING_SELECTOR_POSITIONS){assert.equal(r[pc]|r[pc+1]<<8,next);assert.equal(areaClassifier(r,b)(pc),'pre-partida');}
 const skipped=b.slice();plusNativeMenuTextWriter(skipped,p,b,['partida']);assert.deepEqual(skipped,b);
 const bad=b.slice();bad[TRAINING_SELECTOR_POSITIONS[0][0]]^=1;const copy=bad.slice();assert.throws(()=>plusNativeMenuTextWriter(copy,p,bad),/posição original/);assert.deepEqual(copy,bad);
});

test('standalone training choices relocate full names and end before the four TRAINING suffix calls',()=>{
 const b=fixture(),r=b.slice(),v={'training-native':{data_87df39:'LIVRE',data_87df5b:'GOLEIRO'}};plusNativeMenuTextWriter(r,state(v),b);
 for(const f of sections.find(s=>s.id==='training-native').fields.filter(f=>f[3].pool.relocation)){const {pc,ref}=f[3].pool.relocation;assert.equal(r[ref]|r[ref+1]<<8,pc&65535);assert.equal(r[ref+4],v['training-native'][f[0]].length);}
 assert.deepEqual([...r.slice(0x3BE05,0x3BE07)],[0x2A,0xFF]);
 const bad=b.slice();bad[0x3FBA0]=0;const copy=bad.slice();assert.throws(()=>plusNativeMenuTextWriter(copy,state(v),bad),/reserva/);assert.deepEqual(copy,bad);
});


test('stadium label is editable before the country and supports a colon without overwriting adjacent text',()=>{
 const base=fixture(),rom=base.slice(),field=sections.find(s=>s.id==='stadium-native').fields.find(f=>f[0]==='data_87cad3');
 plusNativeMenuTextWriter(rom,state({'stadium-native':{data_87cad3:'ESTÁDIO:'}}),base);
 assert.deepEqual(rom.slice(0x3FBB0,0x3FBB8),encodeNativeMenuField(field,'ESTÁDIO:')[0]);
 assert.deepEqual(rom.slice(0x3B1BE,0x3B1C0),Uint8Array.of(0x28,1));
 assert.deepEqual(rom.slice(0x3448F,0x34491),Uint8Array.of(0x31,1));
 assert.deepEqual(rom.slice(0x3CAD3,0x3CAE4),base.slice(0x3CAD3,0x3CAE4));
 const skipped=base.slice();plusNativeMenuTextWriter(skipped,state({'stadium-native':{data_87cad3:'ESTÁDIO:'}}),base,['jogadores']);assert.deepEqual(skipped,base);
 const bad=base.slice();bad[0x3448F]=0;const before=bad.slice();assert.throws(()=>plusNativeMenuTextWriter(bad,state({'stadium-native':{data_87cad3:'ESTÁDIO:'}}),bad),/posições/);assert.deepEqual(bad,before);
});
