import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const patch=fs.readFileSync(new URL('../scripts/patch-project-open-semantic-only.mjs',import.meta.url),'utf8');
const pkg=fs.readFileSync(new URL('../package.json',import.meta.url),'utf8');

test('abertura do projeto hidrata UI sem reaplicar estado semântico diretamente na ROM',()=>{
  assert.match(patch,/const reapplyProjectP=.*__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
  assert.match(patch,/html=html\.replace\(reapplyProjectP,'void 0;'\)/);
  assert.match(patch,/hydrateDom\\s\*\\\(\\s\*p/);
  assert.match(patch,/reaplicação pós-importação ainda presente/);
});

test('hidratador visual pode ser reposto da fonte canônica versionada',()=>{
  assert.match(patch,/project-import-v11\.mjs/);
  assert.match(patch,/projectImportSource=fs\.readFileSync/);
  assert.match(patch,/isssd-git-project-import-v11/);
  assert.match(patch,/canonicalModule/);
  assert.match(patch,/hidratação visual do projeto não pôde ser restaurada/);
});

test('neutralização pós-importação não depende da existência textual de applyFull',()=>{
  assert.doesNotMatch(patch,/applyFullRx/);
  assert.doesNotMatch(patch,/applyFullMatch/);
  assert.doesNotMatch(patch,/applyFullBlock/);
});

test('recusa de writer físico durante abertura semantic-only não aborta o projeto',()=>{
  assert.match(patch,/semanticWriterRefusal/);
  assert.match(patch,/Os textos do projeto foram restaurados, mas não puderam ser aplicados automaticamente à ROM/);
  assert.match(patch,/if\(!semanticWriterRefusal\.test\(message\)\)throw e/);
  assert.match(patch,/__ISSSD_SEMANTIC_OPEN_WRITER_BYPASSED__/);
  assert.match(patch,/let result=true/);
});

test('open semântico inicializa a sessão com a ROM-base como base e current',()=>{
  assert.match(patch,/studioCore\(\)\.applyProject\(cleanBase,cleanBase,baseName,d\?\.state\?\.ui\|\|\{\},d\?\.base\?\.profile\|\|null\)/);
  assert.doesNotMatch(patch,/else\{rom=new Uint8Array\(baseBytes\);\}/);
  assert.match(patch,/original\/rom\/fileName\/headerSize\/perfil e buildTeams/);
});

test('teamsV1 é hidratado depois de recarregar os modelos da ROM-base',()=>{
  const guard=patch.indexOf('const guard=');
  const sync=patch.indexOf('syncModelsFromRom?.()',guard);
  const state=patch.indexOf("const teamsState=d?.state?.semantic?.teamsV1",sync);
  const hydrate=patch.indexOf('const hydrate=window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__',state);
  const render=patch.indexOf('renderEverything?.()',hydrate);
  assert.ok(guard>=0&&sync>guard&&state>sync&&hydrate>state&&render>hydrate);
  assert.match(patch,/__ISSSD_PROJECT_TEAMS_HYDRATED_V1__/);
});

test('ciclo legado de abertura fica em modo semântico e não monta ROM parcial',()=>{
  assert.match(patch,/window\.__ISSSD_SEMANTIC_OPEN_ONLY__=true/);
  assert.match(patch,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)\{\$\{physical\}\}else\{\$\{semanticBaseInit\}\}/);
  assert.match(patch,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)\$\{mandatory\}/);
  assert.match(patch,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)window\.__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
  assert.match(patch,/if\(window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)return false/);
  assert.doesNotMatch(patch,/legacyApply\(d,new Uint8Array\(baseBytes\),baseName\)/);
});

test('ROM autoritativa é sempre recolocada na base limpa durante abertura',()=>{
  assert.match(patch,/__ISSSD_RESTORE_CLEAN_CURRENT_V1__\(baseBytes\)/);
  assert.match(patch,/__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true/);
  assert.match(patch,/__ISSSD_PLUS_4MB_MANDATORY__=false/);
});

test('barreira semântica roda após overlay e antes do verificador final',()=>{
  const build=JSON.parse(pkg).scripts['build:editor'];
  const exportPos=build.indexOf('patch-canonical-rom-export.mjs');
  const overlayPos=build.indexOf('patch-team-semantic-overlay.mjs');
  const openPos=build.indexOf('patch-project-open-semantic-only.mjs');
  const verifyPos=build.indexOf('verify-final-editor-invariants.mjs');
  assert.ok(exportPos>=0&&overlayPos>exportPos&&openPos>overlayPos&&verifyPos>openPos);
});


test('actual semantic-open wrapper restores group state and loads both text stores after resetting ROM models',async()=>{
 const begin=patch.indexOf("const marker='isssd-project-open-semantic-only-v4'"),end=patch.indexOf("if(!html.includes('</body>'))",begin);
 const script=vm.runInNewContext(patch.slice(begin,end)+'\nguard',{html:''});
 const body=script.slice(script.indexOf('>')+1,script.lastIndexOf('</script>'));
 const base=new Uint8Array([1,2,3,4]),calls=[];let current=base.slice(),groupState=null,loaded=null,additional=null,names=null;
 const project={base:{profile:'iss-deluxe-plus'},state:{semantic:{plusGroups:{labels:['CONMEBOL 1'],groups:[[30,31,32,35,40,39]]},screenTextsV1:{schema:'isssd-screen-texts-v1',values:{'game-modes':{friendly:'JOGATINA'}}},additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'uniform-labels':{shirt:'CAMISA'}}}}}};
 project.state.semantic.teamNamesV1={schema:'isssd-team-names-v1',values:{30:{full:'BRASIL',big:'BRASIL',short:'BRASIL'}}};
 const window={__ISSSD_TEAM_NAME_LANGUAGES__:{hydrate:p=>{names=structuredClone(p.state.semantic.teamNamesV1);calls.push('names');}},__ISSSD_RESTORE_CLEAN_CURRENT_V1__:bytes=>{current=bytes.slice();calls.push('clean');},__ISSSD_GIT_PROJECT_IMPORT_V11__:{loadProject:p=>{loaded=structuredClone(p);calls.push('screen');}},__ISSSD_ADDITIONAL_SCREEN_TEXTS__:{hydrate:p=>{additional=structuredClone(p.state.semantic.additionalScreenTextsV1);calls.push('additional');}}};
 const context=vm.createContext({window,Uint8Array,console,studioApplyProjectWithBase:async()=>{current.fill(255);return true;},studioCore:()=>({restorePlusGroupsProjectState:s=>{groupState=structuredClone(s);calls.push('groups');},bytesEqualToBase:()=>current.every((v,i)=>v===base[i])}),syncModelsFromRom:()=>{groupState={labels:['AMERICA 1']};calls.push('sync');},renderEverything:()=>calls.push('render'),studioMessage:async()=>{}});
 vm.runInContext(body,context);await context.studioApplyProjectWithBase(project,base,'base.sfc');
 assert.deepEqual(groupState,project.state.semantic.plusGroups);assert.deepEqual(loaded.state.semantic.screenTextsV1,project.state.semantic.screenTextsV1);assert.deepEqual(additional,project.state.semantic.additionalScreenTextsV1);
 assert.deepEqual(names,project.state.semantic.teamNamesV1);assert.ok(calls.indexOf('names')>calls.indexOf('sync'));assert.ok(calls.indexOf('groups')>calls.indexOf('sync'));assert.ok(calls.indexOf('screen')>calls.indexOf('sync'));assert.deepEqual(current,base);
});
