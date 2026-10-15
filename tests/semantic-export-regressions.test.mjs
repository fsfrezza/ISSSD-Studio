import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {plusControllerTextWriter,CONTROLLER_SLOTS} from '../src/core/plus-controller-text.mjs';
import {plusNativeScreenTextWriter,NATIVE_SCREEN_TEXT_FIELDS} from '../src/core/plus-native-screen-text.mjs';
import {konamiLzCompress,konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {PLUS_NAME_POINTER_TABLE,readPlusPlayerName,encodeFixedPlayerName,resolvePlusPlayerNameOffset} from '../src/core/plus-player-name.mjs';
import {playerOffset} from '../src/core/plus-player.mjs';
import {resolvePlusTacticalRecord} from '../src/core/plus-tactics-address.mjs';
import {decodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';
const current=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url)));
function baseFixture(){
 const base=makePlusTacticalFixture();
 for(let t=0;t<56;t++){
  const ptr=0xBD20+t*160;base[PLUS_NAME_POINTER_TABLE+t*2]=ptr&255;base[PLUS_NAME_POINTER_TABLE+t*2+1]=ptr>>8;
  for(let p=0;p<20;p++){base.set(encodeFixedPlayerName('BASE'+p),resolvePlusPlayerNameOffset(base,t,p));base.set([0x44,0x44,0x44,0x44,0x24,p,0x11],playerOffset(t,p));}
 }
 base.set(konamiLzCompress(new Uint8Array(496)),0x108162);return base;
}
test('current project builds named Brazil and native labels cumulatively despite stale binary player mirrors',()=>{
 const base=baseFixture(),before=base.slice(),doc=structuredClone(current),shots=[];
 buildCumulativeProject(base,doc,{selectedAreas:['infraestrutura','pre-partida','textos-estrategias','jogadores','formacoes'],onRom:(r,e)=>shots.push({r,e})});
 const final=shots.at(-1).r;
 for(const p of current.state.semantic.teamsV1.teams[30].players)assert.equal(readPlusPlayerName(final,30,p.slot-1).name,p.custom.name.replaceAll("'",'’'));
 assert.equal(readPlusPlayerName(shots.find(s=>s.e.stage==='textos-estrategias').r,30,1).name,'BASE1');
 const cafu=playerOffset(30,1);assert.equal(final[cafu+5],1);assert.equal(final[cafu]&15,8);
 const bt=decodePlusTacticalRecord(resolvePlusTacticalRecord(base,30).raw).players[0],t=decodePlusTacticalRecord(resolvePlusTacticalRecord(final,30).raw).players[0];
 assert.equal(t.x,bt.x);assert.equal(t.y,32);
 assert.deepEqual(base,before);assert.deepEqual(doc,current);
});
test('native strategy labels use project values; normalize apostrophe accent spelling and preserve surrounding bytes',()=>{
 const r=new Uint8Array(0x200000);r.fill(0xA5);const original=r.slice();
 plusNativeScreenTextWriter(r,current.state.semantic);
 const dec=(pc,n)=>Array.from(r.slice(pc,pc+n),b=>b===0?' ':String.fromCharCode(b-11+65)).join('').trim();
 assert.equal(dec(248175,6),'AJUSTE');assert.equal(dec(248283,4),'SO');assert.equal(dec(248339,10),'TATICAS');
 for(let i=0;i<r.length;i++)if(!NATIVE_SCREEN_TEXT_FIELDS.some(f=>i>=f.pc&&i<f.pc+f.capacity))assert.equal(r[i],original[i]);
});
test('controller conversion uses committed semantic texts and replaces compressed pixels without modifying base',()=>{
 const base=baseFixture(),before=base.slice(),r=base.slice();plusControllerTextWriter(r,current.state.semantic,base);
 const raw=konamiLzDecompress(r,0x108162).data;assert.equal(raw.length,496);
 for(const [id,original,x0,x1] of CONTROLLER_SLOTS){if(current.state.semantic.textWorkspaceV2.sections.graphicIntents.values['controller.'+id]===original)continue;let ink=0;for(let x=x0;x<x1;x++)for(let y=0;y<8;y++){const t=Math.floor(x/8),bit=7-x%8;ink+=((raw[t*16+y*2]>>bit)&1)|(((raw[t*16+y*2+1]>>bit)&1)<<1)}assert.ok(ink>0,original);}
 assert.deepEqual(base,before);
 const untouched=base.slice();plusControllerTextWriter(untouched,{});assert.deepEqual(untouched,base);
 assert.throws(()=>plusControllerTextWriter(base.slice(),{textWorkspaceV2:{sections:{graphicIntents:{values:{'controller.high':'ABCDEFGHIJKLMNOP'}}}}},base),/possui|exceeds/);
});
test('unchecked text/controller phases do not leak native changes into player ROMs',()=>{
 const base=baseFixture(),shots=[];
 buildCumulativeProject(base,current,{selectedAreas:['jogadores','formacoes'],onRom:r=>shots.push(r)});
 for(const r of shots){assert.deepEqual(r.slice(0x108162,0x108162+390),base.slice(0x108162,0x108162+390));assert.deepEqual(r.slice(248175,248349),base.slice(248175,248349));assert.equal(readPlusPlayerName(r,30,1).name,'Cafu');}
});

test('late visual project hook restores UI state without calling physical project or metadata writers',async()=>{
 const vm=await import('node:vm');
 const source=fs.readFileSync(new URL('../editor-src/visual-bridge-overrides.mjs',import.meta.url),'utf8');
 const start=source.indexOf('function restoreFullProject(project){'),end=source.indexOf('window.__ISSSD_GIT_AFTER_PROJECT_OPEN__',start);
 let writes=0,ui=0;
 const context=vm.createContext({console,sem:p=>p.state.semantic,cleanTitle:String,restoreCanonicalTextState:()=>ui++,restoreTitleScreenState:()=>ui++,hydrateVisibleTextFields:()=>ui++,auditProjectHydration:()=>ui++,loadedProject:null});
 context.window=context;context.__ISSSD_GIT_REAPPLY_PROJECT_STATE__=()=>writes++;context.__ISSSD_ROM_META_WRITE_TITLE__=()=>writes++;
 vm.runInContext(source.slice(start,end),context);context.restoreFullProject(current);
 assert.equal(writes,0);assert.equal(ui,4);assert.equal(context.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__,current.state.semantic.romInternalTitle);
});

test('selected cumulative main-menu phase explicitly renders committed semantic graphics',async()=>{
 const {canonicalProjectSemantic}=await import('../src/core/project-semantic.mjs');
 const {plusMainMenuWriteRegions}=await import('../src/core/plus-main-menu-renderer.mjs');
 const base=baseFixture(),shots=[];
 buildCumulativeProject(base,current,{selectedAreas:['menu-principal','jogadores'],onRom:r=>shots.push(r)});
 const expected=plusMainMenuWriteRegions(canonicalProjectSemantic(current).plusMainMenu).regions;
 for(const r of shots)for(const region of expected)assert.deepEqual(r.slice(region.pc,region.pc+region.bytes.length),region.bytes,region.name);
 assert.notDeepEqual(shots[0].slice(0xF0000,0xF0000+1628),base.slice(0xF0000,0xF0000+1628));
});

test('attack export follows R. Gaucho identity through a slot exchange and preserves explicit Dunga false',()=>{
 const base=baseFixture(),project=structuredClone(current),ps=project.state.semantic.teamsV1.teams[30].players;
 const br=resolvePlusTacticalRecord(base,30);base[br.recordPc+25]|=4;
 ps[5].custom.tactical||={};ps[5].custom.tactical.attack=false;
 ps[7].custom.tactical||={};ps[7].custom.tactical.attack=true;
 const before=base.slice();
 for(const move of [false,true]){
  if(move){ps[5].slot=8;ps[7].slot=6;}
  let final;buildCumulativeProject(base,project,{selectedAreas:['jogadores','formacoes'],onRom:r=>{final=r}});
  const players=decodePlusTacticalRecord(resolvePlusTacticalRecord(final,30).raw).players;
  assert.equal(players[ps[7].slot-2].attack,true);assert.equal(players[ps[5].slot-2].attack,false);
  assert.equal(readPlusPlayerName(final,30,ps[7].slot-1).name,'R.Gaucho');
  assert.equal(readPlusPlayerName(final,30,ps[5].slot-1).name,'Dunga');
  assert.deepEqual(base,before);
 }
});
