import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_MENU_TEXT_SECTIONS as sections} from '../src/core/native-menu-text-fields.mjs';
import {encodeNativeMenuField,plusNativeMenuTextWriter} from '../src/core/plus-native-menu-text.mjs';
import {pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
const state=values=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values}});
function fixture(){const base=new Uint8Array(0x200000).fill(0xa5);for(const s of sections)for(const f of s.fields){const bytes=encodeNativeMenuField(f,f[1]);f[3].pool.segments.forEach((seg,i)=>base.set(bytes[i],seg.pc));}return base;}
test('138 audited fields keep original native bytes and separate screen ownership',()=>{
 assert.equal(sections.reduce((n,s)=>n+s.fields.length,0),138);assert.equal(sections.length,20);
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
  const section=sections.find(s=>s.fields.some(f=>f[3].pool.segments.some(seg=>i>=seg.pc&&i<seg.pc+seg.original.length)));assert.ok(section);assert.equal(classify(i),section.area);
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


test('all 138 Portuguese presets fit native fonts, row limits and ROM export',()=>{
 const base=fixture(),before=base.slice(),rom=base.slice(),values={};
 for(const section of sections){values[section.id]={};for(const field of section.fields){assert.equal(typeof field[2],'string',field[0]);assert.ok(field[2].trim(),field[0]);values[section.id][field[0]]=field[2];encodeNativeMenuField(field,field[2]);}}
 plusNativeMenuTextWriter(rom,state(values),base);assert.deepEqual(base,before);assert.deepEqual(pendingAdditionalTextExports(state(values)),[]);
 for(const section of sections)for(const field of section.fields){const encoded=encodeNativeMenuField(field,field[2]);field[3].pool.segments.forEach((seg,i)=>assert.deepEqual(rom.slice(seg.pc,seg.pc+seg.original.length),encoded[i],field[0]));}
});
