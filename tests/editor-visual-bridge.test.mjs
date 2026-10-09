import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('editor automation sources are versioned',()=>{
 for(const rel of [
  'scripts/build-editor.mjs',
  'scripts/serve-editor.mjs',
  'editor-src/visual-bridge-overrides.css',
  'editor-src/visual-bridge-overrides.mjs'
 ]) assert.equal(fs.existsSync(path.join(root,rel)),true,rel+' missing');
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
