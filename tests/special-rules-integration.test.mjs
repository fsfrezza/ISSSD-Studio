import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../editor-src/special-rules.mjs',import.meta.url),'utf8');
const builder=readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
const pipeline=readFileSync(new URL('../src/core/project-build.mjs',import.meta.url),'utf8');

test('editor bundles special rules into generated HTML',()=>{
  assert.match(builder,/editor-src\/special-rules\.mjs/);
  assert.match(builder,/uniformRuntime\+'\\n'\+specialRulesRuntime/);
});
test('special rule saves and restores the same semantic key',()=>{
  assert.match(script,/const KEY='goalkeeperBackpassNoHands'/);
  assert.match(script,/specialRulesV1=getState\(\)/);
  assert.match(script,/setState\(project\?\.state\?\.semantic\)/);
  assert.match(script,/Melhorias de Jogo/);
});
test('pipeline applies optional validated improvements',()=>{
 const pipeline=readFileSync(new URL('../src/core/plus-build-pipeline.mjs',import.meta.url),'utf8');
 assert.match(pipeline,/gameImprovementsWriter\(work,state,baseRom,selectedAreas\)/);
});

test('actual UI runtime round-trips selection, defaults old projects off and rolls back failed opens',async()=>{
 const vm=await import('node:vm');
 const box={checked:false};let fail=false;
 const document={readyState:'loading',addEventListener(){},getElementById:id=>id==='isssdBackpassRule'?box:null};
 const window={__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__:p=>{p.kept=true;return p;},__ISSSD_GIT_REAPPLY_PROJECT_STATE__:()=>true,studioApplyProjectWithBase:async()=>{if(fail)throw Error('failed');return true;}};
 vm.runInNewContext(script,{window,document});
 assert.equal(window.ISSSDSpecialRules.getState().goalkeeperBackpassNoHands,false);
 const project={state:{semantic:{specialRulesV1:{schema:'isssd-special-rules-v1',goalkeeperBackpassNoHands:true}}}};
 await window.studioApplyProjectWithBase(project);assert.equal(box.checked,true);
 const saved={state:{semantic:{}}};window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(saved);
 assert.equal(saved.kept,true);assert.equal(saved.state.semantic.specialRulesV1.goalkeeperBackpassNoHands,true);
 window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__({state:{semantic:{}}});assert.equal(box.checked,false);
 window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__(JSON.parse(JSON.stringify(saved)));assert.equal(box.checked,true);
 fail=true;await assert.rejects(window.studioApplyProjectWithBase({state:{semantic:{}}}),/failed/);assert.equal(box.checked,true);
});
