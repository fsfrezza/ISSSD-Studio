import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('editor automation sources are versioned',()=>{
 for(const rel of ['scripts/build-editor.mjs','scripts/serve-editor.mjs','editor-src/visual-bridge-overrides.css','editor-src/visual-bridge-overrides.mjs'])
  assert.equal(fs.existsSync(path.join(root,rel)),true,rel+' missing');
});

test('build uses Visual Bridge as source and does not silently fall back to skeleton',()=>{
 const src=fs.readFileSync(path.join(root,'scripts/build-editor.mjs'),'utf8');
 assert.match(src,/ISSSD-Studio-Visual-Bridge/);
 assert.match(src,/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/);
 assert.doesNotMatch(src,/editor\/index\.html/);
});

test('layout keeps requested compact modes and four-column strategies',()=>{
 const css=fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.css'),'utf8');
 assert.match(css,/gm610Fields/);
 assert.match(css,/repeat\(4,minmax\(205px,1fr\)\)/);
});

test('generated editor invokes canonical hydration immediately after project import',()=>{
 const src=fs.readFileSync(path.join(root,'scripts/build-editor.mjs'),'utf8');
 assert.match(src,/__ISSSD_GIT_AFTER_PROJECT_OPEN__/);
 assert.match(src,/await studioImportProject\(f\);await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\)/);
});

test('project save synchronizes every textual editor family before serialization',()=>{
 const build=fs.readFileSync(path.join(root,'scripts/build-editor.mjs'),'utf8');
 const runtime=fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.mjs'),'utf8');
 assert.match(build,/__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__/);
 for(const token of ['data-profile-text','data-pk-id','data-mm-real','data-mainmenu-fb96','data-gfx-intent','st612_','pk590_','mainMenuCommittedDraft','studioTextProjectDrafts','ISSSDTextIntentions'])
  assert.match(runtime,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('main menu import writes both legacy and current menu controls',()=>{
 const src=fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.mjs'),'utf8');
 assert.match(src,/data-mm-real/);
 assert.match(src,/data-mainmenu-fb96/);
 assert.match(src,/mainMenuFb96Draft/);
 assert.match(src,/mainMenuCommittedDraft/);
});

test('editor build protects legacy deferred patch length during project save',()=>{
 const src=fs.readFileSync(path.join(root,'scripts/build-editor.mjs'),'utf8');
 assert.match(src,/unsafeDeferredLength/);
 assert.match(src,/studioDeferredPlayerPatches\|\|\[\]/);
 assert.match(src,/replaceAll\(unsafeDeferredLength,safeDeferredLength\)/);
});
