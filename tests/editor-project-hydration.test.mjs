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

  assert.ok(build.includes("const openHook='await window.__ISSSD_GIT_AFTER_PROJECT_OPEN__?.(f);'"),
    'build must define the automatic post-import hydration hook');
  assert.ok(build.includes("const finalImportNeedle=\"await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'\""),
    'build must target the final project lifecycle handler, not the earlier conditional handler');
  assert.ok(build.includes('html=html.replaceAll(openHook,\'\')'),
    'build must repair stale/broken hook injection from cached HTML before reinserting');
  assert.ok(build.includes('html=html.replace(finalImportNeedle,finalImportPatched)'),
    'build must inject hydration only at the final lifecycle handler');
  assert.ok(build.includes('hook pós-importação foi inserido entre if/else legado'),
    'build must reject syntax-breaking injection between legacy if and else');
  assert.ok(!src.includes('isssdForceHydrate'),'manual hydration button must not be part of normal UI');
});
