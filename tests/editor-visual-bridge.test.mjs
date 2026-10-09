import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const build=()=>fs.readFileSync(path.join(root,'scripts/build-editor.mjs'),'utf8');
const runtime=()=>fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.mjs'),'utf8');

test('editor automation sources are versioned',()=>{
 for(const rel of ['scripts/build-editor.mjs','scripts/serve-editor.mjs','editor-src/visual-bridge-overrides.css','editor-src/visual-bridge-overrides.mjs'])assert.equal(fs.existsSync(path.join(root,rel)),true,rel+' missing');
});

test('build uses Visual Bridge as source and does not silently fall back to skeleton',()=>{
 const src=build();assert.match(src,/ISSSD-Studio-Visual-Bridge/);assert.match(src,/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/);assert.doesNotMatch(src,/editor\/index\.html/);
});

test('layout keeps requested compact modes and four-column strategies',()=>{
 const css=fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.css'),'utf8');assert.match(css,/gm610Fields/);assert.match(css,/repeat\(4,minmax\(205px,1fr\)\)/);
});

test('build requires exact post-import, pre-save and final project protection hooks',()=>{
 const src=build();
 assert.match(src,/__ISSSD_GIT_AFTER_PROJECT_OPEN__/);assert.match(src,/finalImportNeedle/);assert.match(src,/openHookCount!==1/);
 assert.match(src,/hook pós-importação foi inserido entre if\/else legado/);assert.match(src,/__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__/);
 assert.match(src,/__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__/);assert.match(src,/proteção de baseline/);
});

test('build removes stale injected Git runtime and always injects exactly one current runtime',()=>{
 const src=build();assert.match(src,/replace\(\/<!--\\s\*ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/);assert.match(src,/isssd-git-visual-bridge-overrides/);assert.match(src,/isssd-git-visual-bridge-runtime/);assert.match(src,/markerCount/);assert.match(src,/runtimeCount/);assert.match(src,/styleCount/);assert.match(src,/git-visual-bridge-v8-safe-project-save/);
});

test('project open restores every canonical textual family automatically',()=>{
 const src=runtime();for(const token of ['ISSSDTextWorkspace','studioTextProjectDrafts','__ISSSD_PREKICK_TEXTS__','ISSSDTextIntentions','data-profile-text','data-pk-id','data-mm-real','data-mainmenu-fb96','st612_','pk590_','mainMenuFb96Draft','mainMenuCommittedDraft'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('project save starts from loaded baseline and overlays only touched text fields',()=>{
 const src=runtime();
 for(const token of ['sem(loadedProject).textWorkspaceV2','touched.direct','touched.preKickoff','touched.mainMenu','touched.graphicIntents','safeWorkspaceForSave','touchedFieldValue'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.doesNotMatch(src,/const ws=clone\(api\.snapshot\(\)\)/);
});

test('untouched title screen and embedded assets are preserved from loaded project',()=>{
 const src=runtime();assert.match(src,/!touched\.titleScreen/);assert.match(src,/baseComposer/);assert.match(src,/baseTitle/);assert.match(src,/beforeAssets/);assert.match(src,/afterAssets/);assert.match(src,/salvamento cancelado/);
});

test('manual hydration diagnostic is removed from production UI',()=>{
 const src=runtime();assert.doesNotMatch(src,/isssdProjectHydrationDiagnostic/);assert.doesNotMatch(src,/Aplicar dados do projeto aos campos/);
});

test('editor build protects legacy deferred patch length during project save',()=>{
 const src=build();assert.match(src,/unsafeDeferredLength/);assert.match(src,/studioDeferredPlayerPatches\|\|\[\]/);assert.match(src,/replaceAll\(unsafeDeferredLength,safeDeferredLength\)/);
});
