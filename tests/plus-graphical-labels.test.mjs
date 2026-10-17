import test from 'node:test';
import assert from 'node:assert/strict';
import {plusGraphicalLabelsWriter,transformLabelPlanes,drawGraphicalLabel,prepareSharedGraphicalBaseline} from '../src/core/plus-graphical-labels.mjs';
import {GRAPHICAL_LABEL_ASSETS,graphicalLabelArea} from '../src/core/graphical-label-layout.mjs';
import {ADDITIONAL_TEXT_SECTIONS,pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
import {expandPlusTo4MiB} from '../src/core/plus-tactics-infrastructure.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {seedGraphicalLabelFixture} from './graphical-label-fixture.mjs';
const baseFixture=()=>seedGraphicalLabelFixture(new Uint8Array(0x200000).fill(0xA5));
function state(){const values={};for(const s of ADDITIONAL_TEXT_SECTIONS.slice(0,2))values[s.id]=Object.fromEntries(s.fields.map(f=>[f[0],f[2]]));values['navigation-labels']={exit:'SAIR',cancel:'DESFAZ'};return {additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values}};}
const asset=id=>GRAPHICAL_LABEL_ASSETS.find(a=>a.id===id);
const unpack=(r,a)=>{const d=konamiLzDecompress(r,a.slot).data;return a.planar?transformLabelPlanes(d):d;};
test('all 18 pending graphical requests write native streams with immutable base and complete classification',()=>{
 const base=baseFixture(),before=base.slice(),s=state(),beforeState=structuredClone(s),rom=expandPlusTo4MiB(base),initial=rom.slice();
 plusGraphicalLabelsWriter(rom,s,base);assert.deepEqual(base,before);assert.deepEqual(s,beforeState);assert.deepEqual(pendingAdditionalTextExports(s),[]);
 for(const a of GRAPHICAL_LABEL_ASSETS.filter(a=>a.id!=='formationRoleButtonTop')){assert.ok(unpack(rom,a).some(Boolean),a.id);for(const pc of a.pointers){const cpu=rom[pc]|rom[pc+1]<<8|rom[pc+2]<<16;const at=((cpu>>16)&127)*0x8000+(cpu&0x7fff);assert.equal(at,a.slot);}}
 for(let i=0;i<rom.length;i++)if(rom[i]!==initial[i])assert.notEqual(graphicalLabelArea(i),undefined,'unclassified write '+i.toString(16));
 assert.equal(unpack(rom,asset('playerSkills')).length,768);
 assert.deepEqual(rom.slice(0x3C626,0x3C64A),base.slice(0x3C626,0x3C64A),'native layout unchanged');
 assert.deepEqual([...rom.slice(0x3dfb7,0x3dfbe)],[0x7a,0x68,0x70,0x79,0,0,0]);
 const attack=unpack(rom,asset('attackParticipation'));assert.ok(attack.slice(8*32,50*32).every(v=>v===0));assert.ok(attack.slice(68*32,69*32).every(v=>v===0));
 assert.deepEqual(rom.slice(0xd0c40,0xd0c60),base.slice(0xd0c40,0xd0c60),'GK preserved');
});
test('unchecked phases do not apply graphical requests or allocate their native streams',()=>{
 const base=baseFixture(),s=state();for(const area of ['jogadores','formacoes','pre-partida']){
  const rom=prepareSharedGraphicalBaseline(expandPlusTo4MiB(base),s,base,[area]),before=rom.slice();plusGraphicalLabelsWriter(rom,s,base,[area]);
  let count=0;for(let i=0;i<rom.length;i++)if(rom[i]!==before[i]){assert.ok(graphicalLabelArea(i)===area||graphicalLabelArea(i)===null);count++;}assert.ok(count>0);
 }
 const rom=expandPlusTo4MiB(base),before=rom.slice();plusGraphicalLabelsWriter(rom,s,base,['metadados']);assert.deepEqual(rom,before);
});
test('English restoration and drafts leave original native assets and layout untouched',()=>{
 const base=baseFixture(),s=state();for(const sec of ADDITIONAL_TEXT_SECTIONS)for(const [id,en] of sec.fields)if(s.additionalScreenTextsV1.values[sec.id])s.additionalScreenTextsV1.values[sec.id][id]=en;
 const rom=expandPlusTo4MiB(base),before=rom.slice();plusGraphicalLabelsWriter(rom,s,base);assert.deepEqual(rom,before);
 plusGraphicalLabelsWriter(rom,{additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',drafts:state().additionalScreenTextsV1.values}},base);assert.deepEqual(rom,before);
});
test('partial attribute edits preserve original labels, digits and points glyphs',()=>{
 const base=baseFixture(),rom=expandPlusTo4MiB(base);plusGraphicalLabelsWriter(rom,{additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'player-labels':{intelligence:'INTELIGÊNCIA'}}}},base);
 const raw=unpack(rom,asset('playerSkills'));
 assert.ok(raw.slice(12*16,16*16).some(Boolean));
 assert.ok(raw.slice(0,12*16).every(v=>v===0));assert.ok(raw.slice(16*16).every(v=>v===0));
});
test('overlong text, unknown glyphs, incompatible pointers and occupied reservations fail before mutation',()=>{
 for(const mutate of [s=>s.additionalScreenTextsV1.values['player-labels'].intelligence='X'.repeat(50),s=>s.additionalScreenTextsV1.values['formation-labels'].forwards='@']){
  const base=baseFixture(),rom=expandPlusTo4MiB(base),before=rom.slice(),s=state();mutate(s);assert.throws(()=>plusGraphicalLabelsWriter(rom,s,base));assert.deepEqual(rom,before);
 }
 for(const mutate of [b=>b[0x111d7]^=1]){const base=baseFixture();mutate(base);const rom=expandPlusTo4MiB(base),before=rom.slice();assert.throws(()=>plusGraphicalLabelsWriter(rom,state(),base),/diverge|ocupado/);assert.deepEqual(rom,before);}
 const base=baseFixture(),rom=expandPlusTo4MiB(base);rom[asset('playerSkills').slot]=0;const before=rom.slice();assert.throws(()=>plusGraphicalLabelsWriter(rom,state(),base),/indisponível/);assert.deepEqual(rom,before);
});
test('all padded native strategy ranges are assigned to the strategy phase',()=>{
 const classify=areaClassifier(new Uint8Array(0x200000));for(const [a,b] of [[248181,248182],[248185,248186],[248203,248204],[248207,248208],[248227,248229],[248333,248334],[248336,248338]])for(let i=a;i<=b;i++)assert.equal(classify(i),'textos-estrategias');
});
test('planar transform round-trips both 2bpp and 4bpp streams; accents use supported plain letters',()=>{
 const raw=Uint8Array.from({length:96},(_,i)=>i*7&255);assert.deepEqual(transformLabelPlanes(transformLabelPlanes(raw),true),raw);
 const a=new Uint8Array(96),b=a.slice();drawGraphicalLabel(a,'PULO',{tiles:6});drawGraphicalLabel(b,'PÚLO',{tiles:6});assert.deepEqual(a,b);
});

test('shared CANCEL/position tiles apply in their own cumulative phases without leaking role translations',()=>{
 const base=seedGraphicalLabelFixture(makePlusTacticalFixture()),before=base.slice(),s=state(),shots=[];
 const report=buildCumulativeProject(base,{state:{semantic:s}},{selectedAreas:['infraestrutura','pre-partida','jogadores','formacoes'],onRom:(r,e)=>shots.push({r,e})});
 assert.deepEqual(report.pendingTextChanges,[]);assert.deepEqual(report.unassignedLegacyRanges,[]);assert.deepEqual(base,before);
 const initial=unpack(shots[0].r,asset('teamStats')),pre=unpack(shots[1].r,asset('teamStats')),final=unpack(shots.at(-1).r,asset('teamStats'));
 assert.ok(initial.every(v=>v===0));assert.ok(pre.slice(2*32,6*32).some(Boolean));assert.ok(pre.slice(6*32,12*32).every(v=>v===0));
 assert.deepEqual(final.slice(2*32,6*32),pre.slice(2*32,6*32));assert.ok(final.slice(8*32,12*32).some(Boolean));
 const onlyRoles=[];buildCumulativeProject(base,{state:{semantic:s}},{selectedAreas:['formacoes'],onRom:r=>onlyRoles.push(r)});
 assert.ok(unpack(onlyRoles[0],asset('teamStats')).slice(2*32,6*32).every(v=>v===0),'unchecked navigation leaves CANCEL unchanged');
 assert.equal(onlyRoles[0][asset('navigationButtons').pointers[0]],base[asset('navigationButtons').pointers[0]]);
});
test('custom DF keeps independent MF copies and remaps both halves of its native buttons',()=>{
 const base=baseFixture(),s={additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'formation-labels':{defenders:'ZG'}}}},rom=expandPlusTo4MiB(base);
 plusGraphicalLabelsWriter(rom,s,base,['formacoes']);assert.ok(unpack(rom,asset('formationRoleButtonTop')).some(Boolean));
 const map=unpack(rom,asset('formationRoleMap'));assert.deepEqual([...map.slice(0,12)],[0xb8,0x1c,0xb9,0x1c,0x6b,0x0c,0xae,0x0c,0x6c,0x0c,0xaf,0x0c]);
 assert.deepEqual(unpack(rom,asset('attackParticipation')).slice(2*32,8*32),new Uint8Array(6*32),'unchanged M and FW button tiles preserved');
});

test('default CANCELAR also fits the native B-arrow header without replacing its prefix',()=>{
 const base=baseFixture(),rom=expandPlusTo4MiB(base),s=state();s.additionalScreenTextsV1.values['navigation-labels'].cancel='CANCELAR';plusGraphicalLabelsWriter(rom,s,base);
 const raw=unpack(rom,asset('cancelHeader'));assert.ok(raw.slice(17*16).some(Boolean));assert.ok(raw.slice(0,16*16).every(v=>v===0));
});
