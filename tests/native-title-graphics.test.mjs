import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {applyNativeTitleGraphics} from '../src/core/native-title-graphics.mjs';

function data(){
 const base=makePlusTacticalFixture(),pc=0x180000,len=14848;
 const raw=new Uint8Array(len),literal=[];for(let i=0;i<len;i+=31){const n=Math.min(31,len-i);literal.push(0x80|n,...raw.slice(i,i+n));}
 const size=literal.length+2;base.set([size&255,(size>>8)|0x80,...literal],pc);base.set([0,0x80,0xB0],0x11971);
 const expected=Array(len).fill(1),packed=konamiLzCompress(Uint8Array.from(expected));packed[1]|=0x80;
 const project={state:{semantic:{},titleComposerV2:{state:{elements:[{id:'photo1',role:'photo1',visible:true,assetDefinition:'customizada'}]},assets:{photo1:'data:image/png;base64,embedded'}}}};
 const payload={groups:[{id:'fotos',pc,bytes:[...packed],expectedRaw:expected}]};return {base,pc,expected,project,payload};
}

test('custom native photos are present in phase 03 and all later ROMs, not earlier ones',()=>{
 const {base,pc,project,payload}=data(),before=base.slice(),shots=[];
 const m=buildCumulativeProject(base,project,{titleGraphics:payload,onRom:(r,e)=>shots.push({r,e})});
 for(const {r,e}of shots){const raw=konamiLzDecompress(r,pc).data;assert.ok(raw.every(v=>v===(e.index<3?0:1)));}
 assert.equal(m.entries[2].stage,'tela-inicial');assert.deepEqual(base,before);
 assert.throws(()=>buildCumulativeProject(base,project,{onRom(){}}),/falta conversão nativa/);
 assert.doesNotThrow(()=>buildCumulativeProject(base,project,{selectedAreas:['metadados','formacoes'],onRom(){}}));
});

test('native photo writer rejects altered pointers, corrupted pixels and missing photo header flag',()=>{
 const {base,project,payload}=data();
 let bad=structuredClone(payload);bad.groups[0].pc++;assert.throws(()=>applyNativeTitleGraphics(base.slice(),base,project,bad),/ponteiro/);
 bad=structuredClone(payload);bad.groups[0].expectedRaw[0]=2;assert.throws(()=>applyNativeTitleGraphics(base.slice(),base,project,bad),/Round-trip/);
 bad=structuredClone(payload);bad.groups[0].bytes[1]&=0x7F;assert.throws(()=>applyNativeTitleGraphics(base.slice(),base,project,bad),/planar/);
});

test('browser export prepares custom photos and materializes only a base copy',async()=>{
 let source=fs.readFileSync(new URL('../editor-src/cumulative-export-ui.mjs',import.meta.url),'utf8').replace('__CUMULATIVE_PHASES__','[]');
 const {project}=data(),base=new Uint8Array(40),prepared=new Uint8Array(40);prepared[10]=9;let called=false;
 const preview={changed:['fotos'],groups:{fotos:Uint8Array.of(1)}};
 const window={titleReadGroupInfo:()=>({pc:10,compressedSize:1})};
 const c={window,Uint8Array,studioEnsureTitleGraphicsPreviewForSave:async()=>{called=true},studioExplicitTitleGraphicsPreview:()=>preview,studioCore:()=>({snapshot:()=>({base,headerSize:0})}),studioFinalizeExperimentalGraphics:copy=>{assert.notEqual(copy,base);copy.set(prepared);return copy}};
 vm.runInNewContext(source,c);
 const result=await window.__ISSSD_PREPARE_TITLE_GRAPHICS__(project);
 assert.equal(called,true);assert.equal(result.groups[0].bytes[0],9);assert.equal(base[10],0);
});

test('export dialog always prepares infrastructure and offers all eleven editable phases including match announcements and sounds',async()=>{
 const {CUMULATIVE_AREAS}=await import('../src/core/cumulative-areas.mjs');
 const source=fs.readFileSync(new URL('../editor-src/cumulative-export-ui.mjs',import.meta.url),'utf8').replace('__CUMULATIVE_PHASES__',JSON.stringify(CUMULATIVE_AREAS));
 const nodes=[];const document={createElement:tag=>{const n={tag,style:{setProperty(name,value){this[name]=value}},append(){},addEventListener(){},close(){},remove(){},showModal(){}};nodes.push(n);return n},createTextNode:text=>text,body:{append(){}}};
 const window={};vm.runInNewContext(source,{window,document});
 const pending=window.__ISSSD_PICK_CUMULATIVE_AREAS__();
 const boxes=nodes.filter(n=>n.type==='checkbox');assert.equal(boxes.length,11);
 assert.deepEqual(boxes.map(n=>n.value),['metadados','tela-inicial','menu-principal','pre-partida','textos-estrategias','selecao-equipes','jogadores','formacoes','partida','sons','melhorias-jogo']);
 boxes[1].checked=false;boxes[2].checked=false;
 nodes.find(n=>n.tag==='form').onsubmit({preventDefault(){}});
 const selected=Array.from(await pending);assert.equal(selected.length,10);assert.equal(selected[0],'infraestrutura');assert.ok(!selected.includes('tela-inicial'));assert.ok(!selected.includes('menu-principal'));
});

test('export dialog can export the mandatory infrastructure alone',async()=>{
 const {CUMULATIVE_AREAS}=await import('../src/core/cumulative-areas.mjs');
 const source=fs.readFileSync(new URL('../editor-src/cumulative-export-ui.mjs',import.meta.url),'utf8').replace('__CUMULATIVE_PHASES__',JSON.stringify(CUMULATIVE_AREAS));
 const nodes=[];const document={createElement:tag=>{const n={tag,style:{setProperty(name,value){this[name]=value}},append(){},addEventListener(){},close(){},remove(){},showModal(){}};nodes.push(n);return n},createTextNode:text=>text,body:{append(){}}};
 const window={};vm.runInNewContext(source,{window,document});
 const pending=window.__ISSSD_PICK_CUMULATIVE_AREAS__();
 nodes.filter(n=>n.type==='checkbox').forEach(n=>n.checked=false);
 nodes.find(n=>n.tag==='form').onsubmit({preventDefault(){}});
 assert.deepEqual(Array.from(await pending),['infraestrutura']);
});
