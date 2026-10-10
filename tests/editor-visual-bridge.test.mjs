import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const build=()=>fs.readFileSync(path.join(root,'scripts/build-editor.mjs'),'utf8');
const runtime=()=>fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.mjs'),'utf8');
const v11=()=>fs.readFileSync(path.join(root,'editor-src/project-import-v11.mjs'),'utf8');
const server=()=>fs.readFileSync(path.join(root,'scripts/serve-editor.mjs'),'utf8');

test('editor automation sources are versioned',()=>{for(const rel of ['scripts/build-editor.mjs','scripts/serve-editor.mjs','editor-src/visual-bridge-overrides.css','editor-src/visual-bridge-overrides.mjs','editor-src/project-import-v11.mjs'])assert.equal(fs.existsSync(path.join(root,rel)),true,rel+' missing')});
test('build uses Visual Bridge as source and does not silently fall back to skeleton',()=>{const src=build();assert.match(src,/ISSSD-Studio-Visual-Bridge/);assert.match(src,/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/);assert.doesNotMatch(src,/editor\/index\.html/)});
test('layout keeps requested compact modes and four-column strategies',()=>{const css=fs.readFileSync(path.join(root,'editor-src/visual-bridge-overrides.css'),'utf8');assert.match(css,/gm610Fields/);assert.match(css,/repeat\(4,minmax\(205px,1fr\)\)/)});
test('build restores project inside studioApplyProjectWithBase lifecycle',()=>{const src=build();assert.match(src,/applyNext/);assert.match(src,/applyBadge/);assert.doesNotMatch(src,/const applyEndNeedle=/);assert.match(src,/__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);assert.match(src,/profileTextDraft=directPid/);assert.doesNotMatch(src,/profileTextLoadDraftFromRom\(true\).*window\.__ISSSD_PREKICK_TEXTS__/);assert.match(src,/studioTitleScreenRestore/);assert.match(src,/studioTitleComposerRestore/);assert.match(src,/window\.__ISSSD_GIT_REAPPLY_PROJECT_STATE__\?\.\(d\)/);assert.match(src,/__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__/);assert.match(src,/__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__/)});
test('build removes stale Git runtimes and injects v10 plus v11 once',()=>{const src=build();assert.match(src,/isssd-git-visual-bridge-overrides/);assert.match(src,/isssd-git-visual-bridge-runtime/);assert.match(src,/isssd-git-project-import-v11/);assert.match(src,/v11Count/);assert.match(src,/git-visual-bridge-v10-deterministic-project-import/);assert.match(src,/git-project-import-v11/)});
test('runtime restores all visible text families including game modes',()=>{const src=runtime()+v11();for(const token of ['ISSSDTextWorkspace','studioTextProjectDrafts','profileTextDraft','gm610_','__ISSSD_PREKICK_TEXTS__','ISSSDTextIntentions','data-profile-text','data-pk-id','data-mm-real','data-mainmenu-fb96','st612_','pk590_','romMetaTitle','MutationObserver'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});
test('project save starts from loaded baseline and overlays only touched text fields',()=>{const src=runtime();for(const token of ['sem(loadedProject).textWorkspaceV2','touched.direct','touched.preKickoff','touched.mainMenu','touched.graphicIntents','safeWorkspaceForSave','touchedFieldValue'])assert.match(src,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))});
test('untouched title screen and embedded assets are preserved from loaded project',()=>{const src=runtime();assert.match(src,/!touched\.titleScreen/);assert.match(src,/beforeAssets/);assert.match(src,/afterAssets/);assert.match(src,/salvamento cancelado/)});
test('manual hydration diagnostic is absent',()=>{const src=runtime()+v11();assert.doesNotMatch(src,/isssdProjectHydrationDiagnostic/);assert.doesNotMatch(src,/Aplicar dados do projeto aos campos/)});
test('editor build protects legacy deferred patch length during project save',()=>{const src=build();assert.match(src,/unsafeDeferredLength/);assert.match(src,/studioDeferredPlayerPatches\|\|\[\]/)});
test('local server exposes the canonical Plus ROM from the fixed Windows path',()=>{const src=server();assert.match(src,/C:\\\\Users\\\\fsfre\\\\Downloads\\\\ISSSD-Studio\\\\roms\\\\International Superstar Soccer Deluxe Plus\.sfc/);assert.match(src,/\/__isssd\/default-plus-rom/);assert.match(src,/serveDefaultPlusRom/)});
test('Plus project base resolver uses the fixed local ROM and never opens a picker for Plus fallback',()=>{const src=build();assert.match(src,/__ISSSD_FIXED_PLUS_ROM_PATH__/);assert.match(src,/__ISSSD_FIXED_PLUS_ROM_ENDPOINT__/);assert.match(src,/\/__isssd\/default-plus-rom/);assert.match(src,/d\.base\?\.profile==='iss-deluxe-plus'/);assert.match(src,/ROM-base Plus não encontrada no caminho fixo/)});
