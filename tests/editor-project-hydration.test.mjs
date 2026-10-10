import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const src=await readFile(join(here,'..','editor-src','visual-bridge-overrides.mjs'),'utf8');
const build=await readFile(join(here,'..','scripts','build-editor.mjs'),'utf8');

test('Visual Bridge restores canonical project deterministically and protects it on save',()=>{
 for(const token of ['git-visual-bridge-v10-deterministic-project-import','textWorkspaceV2','studioTextProjectDrafts','profileTextLoadDraftFromRom?.(true)','gm610_','data-pk-id','data-mainmenu-fb96','st612_','romMetaTitle','auditProjectHydration','__ISSSD_GIT_AFTER_PROJECT_OPEN__','__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__'])assert.ok(src.includes(token),`missing runtime hydration token: ${token}`);
 for(const token of ['__ISSSD_GIT_REAPPLY_PROJECT_STATE__','studioRestoreTeamsV1','restorePlusGroupsProjectState','restoreGospelGolProjectState','ISSSDMenuScreen','mainMenuColors','preKickoffGraphicAssets','studioTextProjectDrafts=JSON.parse(JSON.stringify(sec.direct?.byProfile||{}))','profileTextLoadDraftFromRom(true)','window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d)'])assert.ok(build.includes(token),`missing legacy hydration token: ${token}`);
 assert.ok(build.includes("const finalImportNeedle=\"await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'\""));
 assert.ok(build.includes("const finalizeHook='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(obj);'"));
 assert.ok(build.includes("const applyNext=html.indexOf('function studioProjectChangeHasValues(',applyStart);"),'build must delimit studioApplyProjectWithBase structurally');
 assert.ok(build.includes("const applyBadge=html.lastIndexOf('studioUpdateBadge();',applyNext);"),'build must anchor deterministic restore on the real function badge');
 assert.ok(!build.includes('const applyEndNeedle='),'build must not depend on exact whitespace at the end of studioApplyProjectWithBase');
 assert.ok(!src.includes('isssdForceHydrate'));
});
