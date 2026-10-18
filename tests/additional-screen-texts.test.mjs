import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ADDITIONAL_TEXT_SECTIONS as sections,normalizeAdditionalText,pendingAdditionalTextExports,pendingTextExportReport} from '../src/core/additional-screen-text-fields.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../project-data/additional-screen-text-fields.json',import.meta.url)));
const source=fs.readFileSync(new URL('../editor-src/additional-screen-texts.mjs',import.meta.url),'utf8');
function harness(){
 const nodes=new Map(),document={readyState:'loading',addEventListener(){},getElementById:id=>nodes.get(id),documentElement:null};
 for(const section of sections)for(const [id,en] of section.fields)nodes.set('additionalText_'+section.id+'_'+id,{value:en});
 const window={},context=vm.createContext({ADDITIONAL_TEXT_SECTIONS:sections,document,window,MutationObserver:class{observe(){}},setTimeout:()=>0,clearTimeout(){}});
 vm.runInContext(source,context);return {api:window.__ISSSD_ADDITIONAL_SCREEN_TEXTS__,nodes,window};
}
test('new text fields have user-approved translations and belong to their actual tabs',()=>{
 assert.deepEqual(catalog,sections);
 const players=sections.find(s=>s.id==='player-labels');assert.equal(players.page,'players');
 const pt=Object.fromEntries(players.fields.map(([id,,value])=>[id,value]));
 assert.deepEqual([pt.shotPower,pt.jump,pt.pointsLeft,pt.dash,pt.speed],['CHUTE (POT)','PULO','FALTA','ARRANQUE','RAPIDEZ']);
 assert.equal(normalizeAdditionalText(pt.shotPower),'CHUTE (POT)');assert.equal(normalizeAdditionalText('CALÇÃO'),'CALCAO');
 assert.equal(sections.find(s=>s.id==='uniform-labels').page,'uniforms');
 assert.equal(sections.find(s=>s.id==='cursor-labels').page,'texts-cursor');
 assert.ok(sections.find(s=>s.id==='navigation-labels').fields.some(([id,en,pt])=>id==='exit'&&en==='EXIT'&&pt==='SAIR'));
});
test('language fill is a draft, real confirmation saves full inscriptions, and reload restores them',()=>{
 const {api,nodes}=harness();api.fill('player-labels','portuguese');
 assert.equal(api.snapshot().values['player-labels'],undefined);
 assert.equal(nodes.get('additionalText_player-labels_shotPower').value,'CHUTE (POT)');
 const project={state:{semantic:{romInternalTitle:'UNCHANGED'}}};api.finalize(project);
 const reopened=harness();reopened.api.hydrate(JSON.parse(JSON.stringify(project)));
 assert.equal(reopened.api.snapshot().drafts['player-labels'].shotPower,'CHUTE (POT)');
 // In a browser install hydrates DOM inputs; the mock has no rendered pages.
 for(const [field,,pt] of sections[0].fields)reopened.nodes.get('additionalText_player-labels_'+field).value=pt;
 reopened.nodes.get('additionalText_player-labels_shotPower').value='FORCA DO CHUTE';
 reopened.api.commit('player-labels');const saved={state:{semantic:{}}};reopened.api.finalize(saved);
 assert.equal(saved.state.semantic.additionalScreenTextsV1.values['player-labels'].shotPower,'FORCA DO CHUTE');
 assert.equal(project.state.semantic.romInternalTitle,'UNCHANGED');
 const third=harness();third.api.hydrate(JSON.parse(JSON.stringify(saved)));
 assert.equal(third.api.snapshot().values['player-labels'].speed,'RAPIDEZ');
 third.api.fill('player-labels','english');assert.equal(third.api.snapshot().values['player-labels'].shotPower,'FORCA DO CHUTE');
 third.api.commit('player-labels');assert.equal(third.api.snapshot().values['player-labels'].shotPower,'SHOTPOWR');
});
test('blank and spaced user inscriptions survive actual finalizer without auto-confirming drafts',()=>{
 const {api,nodes,window}=harness();api.fill('navigation-labels','portuguese');
 nodes.get('additionalText_navigation-labels_exit').value='';nodes.get('additionalText_navigation-labels_reset').value='VOLTAR AO ORIGINAL';api.commit('navigation-labels');
 const project={state:{semantic:{}}};window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(project);
 assert.equal(project.state.semantic.additionalScreenTextsV1.values['navigation-labels'].exit,'');
 assert.equal(project.state.semantic.additionalScreenTextsV1.values['navigation-labels'].reset,'VOLTAR AO ORIGINAL');
});
test('supported player text leaves no pending report; unsupported text still respects selected areas',()=>{
 const {api}=harness();api.fill('player-labels','portuguese');const project={state:{semantic:{}}};api.finalize(project);
 assert.deepEqual(pendingAdditionalTextExports(project.state.semantic),[],'unconfirmed drafts do not affect ROM');
 api.commit('player-labels');api.finalize(project);const before=structuredClone(project);
 const pending=pendingAdditionalTextExports(project.state.semantic);
 assert.deepEqual(pending,[]);
 const unsupported={additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'navigation-labels':{reset:'RESTAURAR'}}}};
 assert.match(pendingTextExportReport(pendingAdditionalTextExports(unsupported)),/NÃO APLICADOS/);
 assert.deepEqual(pendingAdditionalTextExports(unsupported,['jogadores']),[]);
 assert.deepEqual(pendingAdditionalTextExports(project.state.semantic,['pre-partida']),[]);
 assert.equal(JSON.stringify(project),JSON.stringify(before));
 api.fill('player-labels','english');api.commit('player-labels');api.finalize(project);assert.deepEqual(pendingAdditionalTextExports(project.state.semantic),[]);
});

test('rendered cards use their own tabs, language buttons stay adjacent, and hydration restores edited inputs',()=>{
 const nodes=new Map();
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.listeners={};this.value='';}
  set id(v){this._id=v;nodes.set(v,this);}get id(){return this._id;}
  appendChild(node){node.parentElement=this;this.children.push(node);return node;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  querySelector(selector){return selector==='.rom-content'?this.content:null;}
 }
 for(const section of sections){if(section.page==='texts-cursor'||section.createPage||nodes.has('page-'+section.page))continue;const page=new Element('section');page.id='page-'+section.page;page.content=page.appendChild(new Element('div'));}
 const document={readyState:'complete',getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),documentElement:null,activeElement:null};
 const controlsNav=new Element('button');controlsNav.id='nav-controls';const navigation=[];controlsNav.after=node=>navigation.push(node);
 const window={};vm.runInContext(source,vm.createContext({ADDITIONAL_TEXT_SECTIONS:sections,document,window,
  ensureScreenPage:(id,title)=>{const page=new Element('section');page.id='page-'+id;page.content=page.appendChild(new Element('div'));page.title=title;return page;},
  makeNavButton:(id,page,label)=>{const button=new Element('button');button.id=id;button.dataset.page=page;button.textContent=label;return button;},
  MutationObserver:class{},clearTimeout(){},setTimeout(){}}));
 assert.equal(navigation[0].id,'nav-texts-cursor');assert.equal(navigation[0].textContent,'Textos Cursor');
 assert.equal(nodes.get('page-texts-cursor').title,'Textos Cursor');assert.equal(nodes.has('additionalCard_control-labels'),false);
 for(const section of sections.filter(s=>s.createPage)){assert.equal(nodes.get('page-'+section.page).title,section.title);assert.equal(nodes.get('nav-'+section.page).dataset.page,section.page);}
 const api=window.__ISSSD_ADDITIONAL_SCREEN_TEXTS__;
 assert.equal([...nodes.keys()].filter(k=>k.startsWith('additionalText_')).length,sections.reduce((n,s)=>n+s.fields.length,0));
 for(const section of sections){
  const card=nodes.get('additionalCard_'+section.id);assert.equal(card.parentElement,nodes.get('page-'+section.page).content);
  const english=nodes.get('additional_'+section.id+'_english'),pt=nodes.get('additional_'+section.id+'_portuguese');
  assert.equal(english.parentElement.children.indexOf(pt),english.parentElement.children.indexOf(english)+1);
  assert.equal(english.textContent,'Restaurar originais (inglês)');assert.equal(pt.textContent,'Usar em português');
 }
 nodes.get('additional_player-labels_portuguese').onclick();const input=nodes.get('additionalText_player-labels_shotPower');
 assert.equal(input.value,'CHUTE (POT)');input.value='FORÇA ';input.listeners.input();api.install();assert.equal(input.value,'FORÇA ');
 input.value='FORÇA DO CHUTE';input.listeners.input();nodes.get('additional_player-labels_commit').onclick();
 const project={state:{semantic:{}}};window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(project);
 api.fill('player-labels','english');assert.equal(input.value,'SHOTPOWR');api.hydrate(JSON.parse(JSON.stringify(project)));
 assert.equal(input.value,'FORÇA DO CHUTE');assert.equal(nodes.get('additionalText_player-labels_speed').value,'RAPIDEZ');
 const count=nodes.size;api.install();api.install();assert.equal(nodes.size,count,'Repeated install does not duplicate cards or fields');
});

test('selective graphical save includes and excludes new text state even without old screenTextsV1',()=>{
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
 const context=vm.createContext({html:`const cat=o=>{const sem=o.state.semantic,tw=sem.textWorkspaceV2.sections;return {'texts.graphics':tw.graphicIntents||null}};
 function removeCategory(obj,id){const sem=obj.state.semantic,tw=sem.textWorkspaceV2.sections;if(id==='unused'){}else if(id==='texts.graphics'&&tw)tw.graphicIntents={};}`});
 const start=build.indexOf('// Selective save/open'),end=build.indexOf('// Full auxiliary',start);vm.runInContext(build.slice(start,end),context);vm.runInContext(context.html,context);
 context.project={state:{semantic:{additionalScreenTextsV1:{values:{'player-labels':{jump:'PULO'}}},textWorkspaceV2:{sections:{graphicIntents:{}}}}}};
 assert.equal(vm.runInContext("cat(project)['texts.graphics'].additional.values['player-labels'].jump",context),'PULO');
 vm.runInContext("removeCategory(project,'texts.graphics')",context);assert.equal(context.project.state.semantic.additionalScreenTextsV1,undefined);
});


test('moving control help to Cursor preserves legacy saved values and drafts without changing the source project',()=>{
 const {api}=harness();const project={state:{semantic:{additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'control-labels':{type:'MEU TIPO',pageHelp:'AJUDA ANTIGA'},'cursor-labels':{type:'TIPO MAIS NOVO'}},drafts:{'control-labels':{pageHelp:'RASCUNHO COM ESPACO '}}}}}};
 const before=JSON.stringify(project);api.hydrate(project);assert.equal(JSON.stringify(project),before);
 const saved={state:{semantic:{}}};api.finalize(saved);const state=saved.state.semantic.additionalScreenTextsV1;
 assert.equal(state.values['control-labels'],undefined);assert.equal(state.values['cursor-labels'].type,'TIPO MAIS NOVO');
 assert.equal(state.values['cursor-labels'].pageHelp,'AJUDA ANTIGA');assert.equal(state.drafts['cursor-labels'].pageHelp,'RASCUNHO COM ESPACO ');
});

test('Cursor Portuguese button fills all 26 fields as drafts and saves the full translations after confirmation',()=>{
 const {api,nodes}=harness();const cursor=sections.find(s=>s.id==='cursor-labels');assert.equal(cursor.fields.length,26);
 api.fill('cursor-labels','portuguese');
 for(const [id,,pt] of cursor.fields){assert.equal(typeof pt,'string',id);assert.ok(pt.trim(),id);assert.equal(nodes.get('additionalText_cursor-labels_'+id).value,pt,id);}
 assert.equal(api.snapshot().values['cursor-labels'],undefined,'language fill must not confirm');
 api.commit('cursor-labels');const project={state:{semantic:{}}};api.finalize(project);
 const expected=Object.fromEntries(cursor.fields.map(([id,,pt])=>[id,pt]));
 assert.equal(JSON.stringify(project.state.semantic.additionalScreenTextsV1.values['cursor-labels']),JSON.stringify(expected));
 const reopened=harness();reopened.api.hydrate(JSON.parse(JSON.stringify(project)));
 assert.equal(JSON.stringify(reopened.api.snapshot().values['cursor-labels']),JSON.stringify(expected));
 api.fill('cursor-labels','english');assert.equal(JSON.stringify(api.snapshot().values['cursor-labels']),JSON.stringify(expected),'restoring English is also only a draft until confirmed');
});


test('new native screen fields round-trip confirmed values and stage Portuguese without auto-confirming',()=>{
 const {api,nodes}=harness();const group=sections.find(s=>s.id==='controls-help-native'),field=group.fields[0];
 nodes.get('additionalText_'+group.id+'_'+field[0]).value='Minha ajuda\nLinha dois';api.commit(group.id);
 const project={state:{semantic:{}}};api.finalize(project);const reopened=harness();reopened.api.hydrate(project);
 assert.equal(reopened.api.snapshot().values[group.id][field[0]],'Minha ajuda\nLinha dois');
 reopened.api.fill(group.id,'portuguese');assert.equal(reopened.api.snapshot().values[group.id][field[0]],'Minha ajuda\nLinha dois');assert.equal(reopened.api.snapshot().drafts[group.id][field[0]],field[2]);
 const screen=sections.find(s=>s.id==='scenario-native');api.fill(screen.id,'english');api.finalize(project);
 assert.deepEqual(Object.keys(project.state.semantic.additionalScreenTextsV1.drafts[screen.id]),screen.fields.map(f=>f[0]));
 assert.equal(project.state.semantic.additionalScreenTextsV1.values[screen.id],undefined);
});


test('Portuguese button fills every newly incorporated screen field and persists all after confirmation',()=>{
 const {api,nodes}=harness(),native=sections.filter(s=>s.nativePool);assert.equal(native.length,20);
 for(const section of native){api.fill(section.id,'portuguese');for(const [id,,pt] of section.fields){assert.equal(typeof pt,'string');assert.ok(pt.trim());assert.equal(nodes.get('additionalText_'+section.id+'_'+id).value,pt);}assert.equal(api.snapshot().values[section.id],undefined);api.commit(section.id);}
 const project={state:{semantic:{}}};api.finalize(project);const reopened=harness();reopened.api.hydrate(JSON.parse(JSON.stringify(project)));
 for(const section of native)for(const [id,,pt] of section.fields)assert.equal(reopened.api.snapshot().values[section.id][id],pt);
});
