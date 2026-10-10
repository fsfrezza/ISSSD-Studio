import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const src=await readFile(join(here,'..','editor-src','visual-bridge-overrides.mjs'),'utf8');
const build=await readFile(join(here,'..','scripts','build-editor.mjs'),'utf8');

test('Visual Bridge makes opened project authoritative and protects it on save',()=>{
  for(const token of [
    'git-visual-bridge-v10-project-authority','textWorkspaceV2','ISSSDTextWorkspace?.restore',
    '__ISSSD_PREKICK_TEXTS__?.restore','ISSSDTextIntentions?.restore','data-profile-text','data-pk-id',
    'data-mm-real','data-mainmenu-fb96','st612_','romInternalTitle','__ISSSD_ROM_META_WRITE_TITLE__',
    '__ISSSD_GIT_AFTER_PROJECT_OPEN__','restoreFullProject','restoreCanonicalTextState','restoreTitleScreenState',
    'profileTextDraft={}','profileTextDraftProfile=null','profileTextLoadDraftFromRom?.(true)',
    'ISSSDMaterializeProjectTextsV674','MutationObserver','queueHydration','touched.titleInternal',
    'safeWorkspaceForSave','__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__','assets da Tela Inicial cairiam'
  ]) assert.ok(src.includes(token),`missing project authority token: ${token}`);

  for(const token of [
    '__ISSSD_GIT_REAPPLY_PROJECT_STATE__','studioRestoreTeamsV1','restorePlusGroupsProjectState',
    'restoreGospelGolProjectState','ISSSDMenuScreen','mainMenuColors','preKickoffGraphicAssets','__ISSSD_TEAM_STATE_API__'
  ]) assert.ok(build.includes(token),`missing full project import token: ${token}`);

  assert.ok(build.includes("const finalImportNeedle=\"await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'\""));
  assert.ok(build.includes("const openHook='await window.__ISSSD_GIT_AFTER_PROJECT_OPEN__?.(f);'"));
  assert.ok(build.includes("const finalizeHook='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(obj);'"));
  assert.ok(!src.includes('isssdForceHydrate'),'manual hydration button must not be part of normal UI');
});
