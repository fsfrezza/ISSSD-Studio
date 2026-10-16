import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../editor-src/project-import-v11.mjs',import.meta.url),'utf8');
function runtime(nodes=[]){
 const drafts={};
 const window={ISSSDTextIntentions:{setDraft:(k,v)=>drafts[k]=v}};
 const document={querySelectorAll:()=>nodes};
 const context=vm.createContext({window,document,console});
 vm.runInContext(source.slice(0,source.indexOf('function commitControls')),context);
 return {context,drafts,window};
}
function input(id,value,owned=false){return {id,value,dataset:owned?{screenTextOwner:'controls',screenTextField:id.slice('ctrlterm_'.length)}:{},matches:q=>owned&&q==='[data-screen-text-owner][data-screen-text-field]'};}
test('typing full control phrases preserves intermediate spaces and empty drafts',()=>{
 const {context,drafts}=runtime();
 context.input=input('ctrlterm_highball','',true);
 for(const c of 'BOLA ALTA'){
  context.input.value+=c;
  const before=context.input.value;
  vm.runInContext('syncWholeControl(CONTROL_TERM_GROUPS[0],input)',context);
  assert.equal(context.input.value,before);
 }
 assert.equal(drafts['controller.highball'],'BOLA ALTA');
 context.input.value='';vm.runInContext('syncWholeControl(CONTROL_TERM_GROUPS[0],input)',context);
 assert.equal(vm.runInContext('controlProjectValues().highball',context),'');
 context.input.value=' bola  alta ';
 vm.runInContext('syncWholeControl(CONTROL_TERM_GROUPS[0],input,{commit:true})',context);
 assert.equal(context.input.value,'BOLA ALTA');
});
test('screen-owned controls take precedence over stale hidden word inputs when capturing a project',()=>{
 const {context}=runtime([input('ctrlterm_shoot','CHUTA',true),input('tx621_shoot','SHOOT'),input('ctrlterm_passball','PASSE CURTO',true)]);
 const captured=JSON.parse(vm.runInContext('JSON.stringify(captureScreenTexts())',context));
 assert.equal(captured.values.controls.shoot,'CHUTA');assert.equal(captured.values.controls.passball,'PASSE CURTO');
});
test('public project snapshots used by selective save finalize complete control state without a separate export hook',async()=>{
 const {context,window}=runtime([input('ctrlterm_highball','BOLA ALTA',true),input('ctrlterm_passball','PASSE CURTO',true)]);
 window.studioProjectObject=async()=>({state:{semantic:{textWorkspaceV2:{sections:{}}}}});
 const start=source.indexOf('const priorFinalize='),end=source.indexOf('const previousAfterOpen=',start);
 vm.runInContext(source.slice(start,end),context);
 const obj=await window.studioProjectObject();
 assert.equal(obj.state.semantic.screenTextsV1.values.controls.highball,'BOLA ALTA');
 assert.equal(obj.state.semantic.screenTextsV1.values.controls.passball,'PASSE CURTO');
 const saved=JSON.stringify(obj);
 vm.runInContext('currentProject=JSON.parse(saved);screenTextsBaseline=projectScreenTexts(currentProject);touched.screen.clear()',Object.assign(context,{saved}));
 assert.equal(vm.runInContext('controlProjectValues().passball',context),'PASSE CURTO');
});

test('selective project save detects complete control changes and excludes them when graphics are unchecked',()=>{
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
 const context=vm.createContext({html:`const cat=o=>{const sem=o.state.semantic,tw=sem.textWorkspaceV2.sections;return {'texts.graphics':tw.graphicIntents||null}};
 function removeCategory(obj,id){const sem=obj.state.semantic,tw=sem.textWorkspaceV2.sections;if(id==='unused'){}else if(id==='texts.graphics'&&tw)tw.graphicIntents={};}`});
 const start=build.indexOf('// Selective save/open'),end=build.indexOf('const css=',start);
 vm.runInContext(build.slice(start,end),context);
 vm.runInContext(context.html,context);
 context.project={state:{semantic:{teamsV1:{schema:'preserved'},textWorkspaceV2:{sections:{graphicIntents:{values:{'controller.high':'OLD'}}}},screenTextsV1:{values:{controls:{highball:'BOLA ALTA'},'match-options':{start:'COMECA'}}}}}};
 assert.equal(vm.runInContext("cat(project)['texts.graphics'].controls.highball",context),'BOLA ALTA');
 vm.runInContext("removeCategory(project,'texts.graphics')",context);
 assert.equal(context.project.state.semantic.screenTextsV1.values.controls,undefined);
 assert.equal(context.project.state.semantic.screenTextsV1.values['match-options'].start,'COMECA');
 assert.equal(context.project.state.semantic.teamsV1.schema,'preserved');
});
