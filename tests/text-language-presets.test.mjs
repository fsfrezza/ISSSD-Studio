import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {encodePlusStrategyText,decodePlusStrategyText} from '../src/core/plus-strategy-text.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../project-data/text-language-presets-v1.json',import.meta.url)));
const source=fs.readFileSync(new URL('../editor-src/project-import-v11.mjs',import.meta.url),'utf8');
test('Portuguese presets use user project text without FB96 fallback',()=>{
 assert.equal(catalog.sources.portuguese.profile,'user-project');
 assert.equal(catalog.sections['main-menu'].portuguese.scenario,'CENÁRIOS');
 assert.equal(catalog.sections['match-options'].portuguese.substitution,'SUBSTITUICOES');
 assert.equal(catalog.sections.controls.portuguese.highball,'BOLA ALTA');
 assert.equal(catalog.sections.controls.portuguese.passball,'PASSE');
 assert.equal(catalog.sections['game-modes'].portuguese.friendlyDesc,'X1 maroto');
 assert.equal(catalog.sections['title-screen'].portuguese.press,'Toque');
});
test('language buttons stage editable fields, preserve unmapped descriptions and never call commit or ROM APIs',()=>{
 const nodes=new Map(),events=[];
 for(const [field,value] of Object.entries(catalog.sections['match-options'].english))nodes.set('matchopt_'+field,{value:'CUSTOM',dataset:{},dispatchEvent:()=>events.push(field)});
 nodes.set('matchopt_formationDesc',{value:'Preserve this custom description',dataset:{}});
 nodes.set('textLanguageStatus_match-options',{textContent:''});
 const context=vm.createContext({TEXT_LANGUAGE_PRESETS:{...catalog,sections:{...catalog.sections,'match-options':{...catalog.sections['match-options'],portuguese:Object.fromEntries(Object.entries(catalog.sections['match-options'].portuguese).filter(([k])=>!k.endsWith('Desc')))}}},document:{getElementById:id=>nodes.get(id)},Event:class{},screenTextsBaseline:{values:{}},touched:{screen:new Set()},currentProject:null,putScreen:()=>{throw Error('Must not implement while filling')},setText:(n,v)=>{if(n)n.textContent=v}});
 const start=source.indexOf('const TEXT_LANGUAGE_AREAS='),end=source.indexOf('function installTextLanguageButtons',start);
 vm.runInContext(source.slice(start,end),context);
 vm.runInContext("fillTextLanguagePreset('match-options','portuguese')",context);
 assert.equal(nodes.get('matchopt_substitution').value,'SUBSTITUICOES');assert.equal(nodes.get('matchopt_formationDesc').value,'Preserve this custom description');
 assert.equal(events.length,6);assert.match(nodes.get('textLanguageStatus_match-options').textContent,/rascunho/);
 nodes.get('matchopt_substitution').value='MEU TEXTO';assert.equal(nodes.get('matchopt_substitution').value,'MEU TEXTO');
 vm.runInContext("fillTextLanguagePreset('match-options','english')",context);assert.equal(nodes.get('matchopt_substitution').value,'SELECT SQUAD');
});

test('project auxiliary phrases use native row padding, preserve control bytes and respect phase selection',async()=>{
 const {NATIVE_AUX_TEXT_GROUPS,plusNativeScreenTextWriter,encodeNativeAuxText}=await import('../src/core/plus-native-screen-text.mjs');
 const base=new Uint8Array(0x200000);base.fill(0xA5);const before=base.slice();
 const state={screenTextsV1:{values:{'strategy-aux':catalog.sections['strategy-aux'].portuguese}}};
 for(const g of NATIVE_AUX_TEXT_GROUPS)assert.equal(encodeNativeAuxText(g,state.screenTextsV1.values['strategy-aux'][g.id]).length,g.rows.reduce((a,b)=>a+b,0));
 const rom=base.slice();plusNativeScreenTextWriter(rom,state,['textos-estrategias']);
 for(let i=0;i<rom.length;i++)if(rom[i]!==base[i])assert.ok(NATIVE_AUX_TEXT_GROUPS.some(g=>i>=g.pc&&i<g.pc+g.rows.reduce((a,b)=>a+b,0)),i.toString(16));
 const first=NATIVE_AUX_TEXT_GROUPS[0];const dec=a=>Array.from(a,b=>b?String.fromCharCode(b-11+65):' ').join('');
 assert.equal(dec(rom.slice(first.pc,first.pc+9)).trim(),'AJUSTE');assert.equal(dec(rom.slice(first.pc+9,first.pc+19)).trim(),'TATICAS');
 const skipped=base.slice();plusNativeScreenTextWriter(skipped,state,['jogadores']);assert.deepEqual(skipped,base);assert.deepEqual(base,before);
});

test('main-menu project confirmation preserves texts and style independently of native raster budget',()=>{
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
 const statement=build.match(/const semanticMenuCommit=([^\n]+);/)[0];
 const values={},style={items:[{scale:115,width:100}]};let confirmations=0;
 const context=vm.createContext({KEY:'mainMenuGraphicTextsV600',uiTexts:()=>Object.values(catalog.sections['main-menu'].portuguese),styleNow:()=>style,verify:()=>{throw Error('Rasterizer must not run while confirming project text')},renderPreview:()=>{},status:()=>{},window:{ISSSDTextIntentions:{setDraft:(key,value)=>values[key]=value,commitAll:()=>confirmations++}}});
 vm.runInContext(statement+'\n'+"eval(semanticMenuCommit);commit()",context);
 assert.equal(confirmations,1);const saved=JSON.parse(values.mainMenuGraphicTextsV600);
 assert.equal(saved.texts[0],'JOGATINA');assert.equal(saved.texts[4],'MEGACOPA');assert.deepEqual(saved.style,style);
});
