import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const src=await readFile(join(here,'..','editor-src','visual-bridge-overrides.mjs'),'utf8');
const build=await readFile(join(here,'..','scripts','build-editor.mjs'),'utf8');

test('Visual Bridge restores the complete canonical project automatically after import',()=>{
  for(const token of [
    'textWorkspaceV2',
    'ISSSDTextWorkspace?.restore',
    '__ISSSD_PREKICK_TEXTS__?.restore',
    'ISSSDTextIntentions?.restore',
    'data-profile-text',
    'data-pk-id',
    'data-mm-real',
    'data-mainmenu-fb96',
    'st612_',
    'romInternalTitle',
    '__ISSSD_ROM_META_WRITE_TITLE__',
    '__ISSSD_GIT_AFTER_PROJECT_OPEN__',
    'restoreFullProject',
    'restoreTitleScreenState',
    '__ISSSD_TITLE_COMPOSER__',
    'titleComposerV2Restore',
    'stripeTint'
  ]) assert.ok(src.includes(token),`missing project hydration token: ${token}`);

  assert.ok(build.includes("await studioImportProject(f);await window.__ISSSD_GIT_AFTER_PROJECT_OPEN__?.(f)"),
    'generated editor must invoke automatic hydration immediately after studioImportProject');
  assert.ok(!src.includes('isssdForceHydrate'),'manual hydration button must not be part of normal UI');
});
