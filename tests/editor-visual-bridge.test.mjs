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

test('build requires exact post-import and pre-save lifecycle hooks',()=>{
 const src=build();assert.match(src,/__ISSSD_GIT_AFTER_PROJECT_OPEN__/);assert.match(src,/studioImportProject/);assert.match(src,/Build interrompido: hook pós-importação não foi instalado/);assert.match(src,/__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__/);assert.match(src,/Build interrompido: hook pré-salvamento não foi instalado/);
});

test('project open restores every canonical textual family automatically',()=>{
 const src=runtime();
 for(const token of ['ISSSDTextWorkspace','studioTextProjectDrafts','__ISSSD_PREKICK_TEXTS__','ISSSDTextIntentions','data-profile-text','data-pk-id','data-mm-real','data-mainmenu-fb96','st612_','pk590_','mainMenuFb96Draft','mainMenuCommittedDraft'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('project open restores title native state and embedded composer assets',()=>{
 const src=runtime();assert.match(src,/studioTitleScreenRestore/);assert.match(src,/__ISSSD_TITLE_COMPOSER__/);assert.match(src,/titleComposerV2Restore/);assert.match(src,/state\?\.titleComposerV2/);assert.match(src,/stripeTint/);
});

test('manual hydration diagnostic is removed from production UI',()=>{
 const src=runtime();assert.doesNotMatch(src,/isssdProjectHydrationDiagnostic/);assert.doesNotMatch(src,/Aplicar dados do projeto aos campos/);assert.match(build(),/painel manual de diagnóstico ainda está presente/);
});

test('project save synchronizes text families and stripe tint state before serialization',()=>{
 const src=runtime();for(const token of ['data-profile-text','data-pk-id','data-mm-real','data-mainmenu-fb96','data-gfx-intent','st612_','pk590_','mainMenuCommittedDraft','studioTextProjectDrafts','ISSSDTextIntentions','__ISSSD_TITLE_STRIPE_TINT__','dirtyPalettes'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('editor build protects legacy deferred patch length during project save',()=>{
 const src=build();assert.match(src,/unsafeDeferredLength/);assert.match(src,/studioDeferredPlayerPatches\|\|\[\]/);assert.match(src,/replaceAll\(unsafeDeferredLength,safeDeferredLength\)/);
});
