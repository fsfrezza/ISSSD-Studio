import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {SOUND_SLOTS} from '../src/core/sound-slots.mjs';
import {SOUND_SCHEMA,terminatedBrr,plusSoundsWriter} from '../src/core/plus-sounds.mjs';
import {canonicalProjectDocument} from '../src/core/project-serialize.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
const fb=JSON.parse(fs.readFileSync(new URL('../project-data/fb96-sound-references.json',import.meta.url))),legacy=fs.readFileSync(new URL('../.editor-vendor/legacy-ui/ISSSD-Studio.html',import.meta.url),'utf8');
const galvao=Uint8Array.from(Buffer.from(legacy.match(/REF_GA=b64\(`([^`]+)`\)/)[1],'base64'));
const state=source=>({soundsV1:{schema:SOUND_SCHEMA,values:Object.fromEntries(SOUND_SLOTS.map(s=>[s.id,{source,brrBase64:source==='fb96'?fb.samples[s.id]:Buffer.from(terminatedBrr(galvao.slice(s.pc-0x180000,s.pc-0x180000+s.capacity))).toString('base64')}]))}});
for(const source of ['galvao','fb96'])test(`${source}: all 74 BRR samples fit, survive project serialization and preserve bytes after their own END blocks`,()=>{
 const semantic=state(source),doc=canonicalProjectDocument({state:{semantic}}),reopened=JSON.parse(JSON.stringify(doc));assert.deepEqual(reopened.state.semantic.soundsV1,semantic.soundsV1);
 const base=new Uint8Array(0x200000).fill(0xA5),rom=base.slice(),before=base.slice(),saved=structuredClone(semantic);plusSoundsWriter(rom,reopened.state.semantic,base,['sons']);
 let changed=0;const expected=base.slice();for(const s of SOUND_SLOTS){const bytes=terminatedBrr(Uint8Array.from(Buffer.from(semantic.soundsV1.values[s.id].brrBase64,'base64')),s.capacity);expected.set(bytes,s.pc);changed+=bytes.length;assert.ok(bytes.at(-9)&1);assert.equal(rom[s.pc+bytes.length],base[s.pc+bytes.length]);}
 assert.deepEqual(rom,expected);assert.deepEqual(base,before);assert.deepEqual(semantic,saved);assert.ok(changed>100000);
 const skipped=base.slice();plusSoundsWriter(skipped,semantic,base,['partida']);assert.deepEqual(skipped,base);
});
test('invalid audio batches fail before any write, including an oversized or unterminated last sample',()=>{
 const base=new Uint8Array(0x200000).fill(255),last=SOUND_SLOTS.at(-1);
 for(const change of [{source:'fb96',brrBase64:Buffer.alloc(last.capacity+9).toString('base64')},{source:'fb96',brrBase64:Buffer.alloc(9).toString('base64')},{source:'fb96',brrBase64:'not base64'}]){const s=state('fb96'),rom=base.slice();s.soundsV1.values[last.id]=change;assert.throws(()=>plusSoundsWriter(rom,s,base));assert.deepEqual(rom,base);}
});
test('canonical ROM and cumulative Sons phase apply audio over stale binary samples and exclude it when unchecked',()=>{
 const base=makePlusTacticalFixture(),semantic=state('fb96'),project={state:{semantic,patches:[{off:SOUND_SLOTS[0].pc,bytes:[77,88,99]}]}};
 const built=buildPlusProjectRom(base,project);const first=SOUND_SLOTS[0],bytes=Buffer.from(fb.samples[first.id],'base64');assert.deepEqual(built.rom.slice(first.pc,first.pc+bytes.length),new Uint8Array(bytes));
 let final;const manifest=buildCumulativeProject(base,project,{selectedAreas:['sons'],onRom:r=>{final=r;}});assert.equal(manifest.entries.length,1);assert.equal(manifest.entries[0].stage,'sons');assert.equal(manifest.unassignedLegacyRanges.length,0);assert.deepEqual(final.slice(first.pc,first.pc+bytes.length),new Uint8Array(bytes));
 const skipped=buildPlusProjectRom(base,project,{selectedAreas:['partida']});assert.equal(skipped.rom[first.pc],77,'legacy patches are still subsequently filtered by cumulative area selection');
});
function ui(){
 const rom=new Uint8Array(0x200000),ref=new Uint8Array(0x80000);for(const s of SOUND_SLOTS){ref[s.pc-0x180000]=1;ref[s.pc-0x180000+1]=0x21;}
 const select={value:'0'},document={readyState:'loading',addEventListener(){},getElementById:id=>id==='sndSelect'?select:null};
 const window={activeRomProfile:{id:'iss-deluxe-plus'},__ISSSD_PREKICK_HOST__:{rom:()=>rom,header:()=>0},ISSSDSounds:{references:()=>({english:ref,galvao:ref})},__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__:p=>{p.prior=true;},studioApplyProjectWithBase:async p=>{if(p.fail)throw Error('load failed');window.seen=window.__ISSSD_SOUNDS_EDITOR__.snapshot();}};
 const scope=vm.createContext({window,document,SOUND_SLOTS,FB96_SOUND_REFERENCES:fb,atob,btoa,Uint8Array,Float32Array,setTimeout,clearTimeout});vm.runInContext(fs.readFileSync(new URL('../editor-src/sounds-editor.mjs',import.meta.url),'utf8'),scope);return {api:window.__ISSSD_SOUNDS_EDITOR__,rom,select,window,ref};
}
test('UI presets replace current per-slot choices atomically, reopen intact and never mutate the browser ROM',()=>{
 const {api,rom,select}=ui(),before=rom.slice();api.apply('fb96',true);assert.equal(Object.keys(api.snapshot().values).length,74);api.apply('galvao');assert.equal(api.snapshot().values[SOUND_SLOTS[0].id].source,'galvao');assert.equal(api.snapshot().values[SOUND_SLOTS[1].id].source,'fb96');
 const project={state:{semantic:{}}};api.finalize(project);const other=ui();other.api.hydrate(JSON.parse(JSON.stringify(project)));assert.deepEqual(JSON.parse(JSON.stringify(other.api.snapshot())),JSON.parse(JSON.stringify(api.snapshot())));assert.deepEqual(rom,before);
 api.apply('galvao',true);assert.ok(Object.values(api.snapshot().values).every(v=>v.source==='galvao'));select.value='1';api.apply('original');assert.equal(api.snapshot().values[SOUND_SLOTS[1].id].source,'original');assert.deepEqual(rom,before);
 api.hydrate({state:{semantic:{}}});assert.equal(Object.keys(api.snapshot().values).length,0);
});

test('UI rejects a broken whole-reference batch atomically and keeps the prior selected sounds',()=>{
 const {api,ref}=ui();api.apply('fb96',true);const before=JSON.stringify(api.snapshot()),last=SOUND_SLOTS.at(-1);ref[last.pc-0x180000]=0;
 assert.throws(()=>api.apply('galvao',true),/final BRR/);assert.equal(JSON.stringify(api.snapshot()),before);assert.throws(()=>api.apply('unknown'),/desconhecida/);
});
test('opening respects the filtered project and rolls back sound state when the underlying load fails',async()=>{
 const {api,window}=ui();api.apply('fb96',true);const previous=JSON.stringify(api.snapshot());await assert.rejects(()=>window.studioApplyProjectWithBase({fail:true,state:{semantic:{}}}),/load failed/);assert.equal(JSON.stringify(api.snapshot()),previous);
 await window.studioApplyProjectWithBase({state:{semantic:{}}});assert.equal(Object.keys(api.snapshot().values).length,0);assert.equal(Object.keys(window.seen.values).length,0,'the native snapshot sees only sound choices selected during import');
});

test('installed buttons preview FB96 and the selected project sound and persist both bulk source choices',async()=>{
 const nodes=new Map();class Element{
  constructor(tag='div',id=''){this.tag=tag;this.style={};this.listeners={};this.children=[];this.value='0';this.id=id;}
  set id(v){this._id=v;if(v)nodes.set(v,this);}get id(){return this._id;}
  append(...children){this.children.push(...children);}addEventListener(name,fn){this.listeners[name]=fn;}
  cloneNode(){const n=new Element(this.tag,this.id);n.textContent=this.textContent;return n;}replaceWith(n){nodes.set(this.id,n);}
 }
 const page=new Element('section','page-sounds'),card=new Element(),intro=new Element('p');page.querySelector=s=>s==='.card'?card:intro;
 for(const id of ['sndSelect','sndStatus','sndPlayEnglish','sndPlayGalvao','sndPlayCurrent','sndRestore','sndFile'])new Element(id==='sndSelect'?'select':'button',id);
 const rom=new Uint8Array(0x200000),ref=new Uint8Array(0x80000);for(const s of SOUND_SLOTS)ref[s.pc-0x180000]=1;const decoded=[];
 class AudioContext{constructor(){this.state='running';this.destination={};}createBuffer(){return {copyToChannel(){}};}createBufferSource(){return {connect(){},start(){},stop(){}};}createGain(){return {gain:{},connect(){}};}}
 const document={readyState:'loading',addEventListener(){},getElementById:id=>nodes.get(id)||null,createElement:tag=>new Element(tag)};
 const window={activeRomProfile:{id:'iss-deluxe-plus'},AudioContext,__ISSSD_PREKICK_HOST__:{rom:()=>rom,header:()=>0},ISSSDSounds:{references:()=>({english:ref,galvao:ref}),decodeBRR:b=>{decoded.push(Buffer.from(b));return new Float32Array(16);}}};
 vm.runInNewContext(fs.readFileSync(new URL('../editor-src/sounds-editor.mjs',import.meta.url),'utf8'),{window,document,SOUND_SLOTS,FB96_SOUND_REFERENCES:fb,atob,btoa,Uint8Array,Float32Array,setTimeout,clearTimeout});window.__ISSSD_SOUNDS_EDITOR__.install();
 await nodes.get('sndPlayFb96').listeners.click();assert.deepEqual(decoded.at(-1),Buffer.from(fb.samples[SOUND_SLOTS[0].id],'base64'));assert.match(nodes.get('sndStatus').textContent,/Reproduzindo FB96/);
 await nodes.get('sndAllFb96').listeners.click();await nodes.get('sndPlayCurrent').listeners.click();assert.deepEqual(decoded.at(-1),Buffer.from(fb.samples[SOUND_SLOTS[0].id],'base64'));
 await nodes.get('sndAllGalvao').listeners.click();assert.ok(Object.values(window.__ISSSD_SOUNDS_EDITOR__.snapshot().values).every(v=>v.source==='galvao'));
 await nodes.get('sndRestore').listeners.click();assert.equal(window.__ISSSD_SOUNDS_EDITOR__.snapshot().values[SOUND_SLOTS[0].id].source,'original');assert.ok(rom.every(v=>v===0));
});
