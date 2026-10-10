import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const src=await readFile(join(here,'..','editor-src','visual-bridge-overrides.mjs'),'utf8');
const build=await readFile(join(here,'..','scripts','build-editor.mjs'),'utf8');

test('Visual Bridge restores canonical project and protects it on save',()=>{
  for(const token of [
    'textWorkspaceV2','ISSSDTextWorkspace?.restore','__ISSSD_PREKICK_TEXTS__?.restore','ISSSDTextIntentions?.restore',
    'data-profile-text','data-pk-id','data-mm-real','data-mainmenu-fb96','st612_','romInternalTitle',
    '__ISSSD_ROM_META_WRITE_TITLE__','__ISSSD_GIT_AFTER_PROJECT_OPEN__','restoreFullProject','restoreTitleScreenState',
    '__ISSSD_TITLE_COMPOSER__','titleComposerV2Restore','stripeTint','safeWorkspaceForSave','touched.direct','touched.preKickoff',
    'touched.mainMenu','touched.graphicIntents','__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__','assets da Tela Inicial cairiam'
  ]) assert.ok(src.includes(token),`missing project safety token: ${token}`);

  for(const token of [
    '__ISSSD_GIT_REAPPLY_PROJECT_STATE__','studioRestoreTeamsV1','restorePlusGroupsProjectState',
    'restoreGospelGolProjectState','ISSSDMenuScreen','mainMenuColors','preKickoffGraphicAssets',
    '__ISSSD_TEAM_STATE_API__','JSON.parse(await f.text())'
  ]) assert.ok(build.includes(token),`missing full project import token: ${token}`);

  assert.ok(build.includes("const finalImportNeedle=\"await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'\""),
    'build must target the final project lifecycle handler');
  assert.ok(build.includes("const finalizeHook='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(obj);'"),
    'build must finalize the project object against the protected baseline');
  assert.ok(build.includes('const obj=await studioProjectObject();'),
    'build must finalize immediately after project object creation');
  assert.ok(!src.includes('isssdForceHydrate'),'manual hydration button must not be part of normal UI');
});
