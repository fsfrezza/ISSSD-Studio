import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parent=path.dirname(root);
const outDir=path.join(root,'editor');
const outHtml=path.join(outDir,'ISSSD-Studio.html');
const vendorDir=path.join(root,'.editor-vendor','legacy-ui');
const cachedHtml=path.join(vendorDir,'ISSSD-Studio.html');
const cssFile=path.join(root,'editor-src','visual-bridge-overrides.css');
const jsFile=path.join(root,'editor-src','visual-bridge-overrides.mjs');

const legacyContainer=path.join(parent,'ISSSD-Studio-OLD');
const legacyRoots=[path.join(parent,'ISSSD-Studio-Visual-Bridge'),path.join(legacyContainer,'ISSSD-Studio-Visual-Bridge'),path.join(legacyContainer,'ISSSD-Studio-Preview'),path.join(legacyContainer,'ISSSD-Studio-ANTIGO'),path.join(legacyContainer,'ISSSD-Studio-OLD'),path.join(parent,'ISSSD-Studio-ANTIGO'),path.join(root,'legacy-ui'),root];
const candidates=[cachedHtml];for(const legacyRoot of legacyRoots)candidates.push(path.join(legacyRoot,'legacy-ui','ISSSD-Studio.html'),path.join(legacyRoot,'ISSSD-Studio.html'));
let source=candidates.find(p=>fs.existsSync(p));
if(!source){console.error('ISSSD Studio: não encontrei a interface legada/Visual Bridge.');console.error('Locais verificados:\n- '+candidates.join('\n- '));process.exit(2)}
if(source!==cachedHtml){const sourceDir=path.dirname(source);fs.rmSync(path.join(root,'.editor-vendor'),{recursive:true,force:true});fs.mkdirSync(vendorDir,{recursive:true});fs.copyFileSync(source,cachedHtml);for(const name of ['assets','docs','schemas']){const from=path.join(sourceDir,name),to=path.join(vendorDir,name);if(fs.existsSync(from))fs.cpSync(from,to,{recursive:true})}source=cachedHtml;console.log('Interface legada importada para cache local: '+cachedHtml)}

let html=fs.readFileSync(source,'utf8');
const marker='ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE';
html=html.replace(/<!--\s*ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE\s*-->\s*/g,'').replace(/<style\s+id=["']isssd-git-visual-bridge-overrides["'][^>]*>[\s\S]*?<\/style>\s*/g,'').replace(/<script\s+type=["']module["']\s+id=["']isssd-git-visual-bridge-runtime["'][^>]*>[\s\S]*?<\/script>\s*/g,'');

const unsafeDeferredLength='(studioDeferredPlayerPatches.length-deferredNative.length)',safeDeferredLength='((studioDeferredPlayerPatches||[]).length-deferredNative.length)';if(html.includes(unsafeDeferredLength))html=html.replaceAll(unsafeDeferredLength,safeDeferredLength);

const saveHook='window.__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__?.();';
if(!html.includes(saveHook)){const needle='async function studioProjectObject(){';if(!html.includes(needle))throw new Error('Build interrompido: não encontrei studioProjectObject para instalar sincronização pré-salvamento.');html=html.replace(needle,needle+'\n '+saveHook)}

// Ponte clássica executada no mesmo escopo do núcleo legado. Ela restaura as variáveis
// lexicais que alimentam os renderizadores, em vez de apenas preencher inputs do DOM.
const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
const restoreBridge=`\n window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__=function(project){\n  const sem=project?.state?.semantic||{},ws=sem.textWorkspaceV2,sec=ws?.sections||{};\n  try{if(sem.teamsV1?.schema==='isssd-teams-v1')studioRestoreTeamsV1(sem.teamsV1)}catch(e){console.warn('Git Bridge: equipes/jogadores',e)}\n  try{if(studioCore()?.restorePlusGroupsProjectState)studioCore().restorePlusGroupsProjectState(sem.plusGroups||null)}catch(e){console.warn('Git Bridge: grupos',e)}\n  try{if(studioCore()?.restoreGospelGolProjectState)studioCore().restoreGospelGolProjectState(sem.plusGospelGol||null)}catch(e){console.warn('Git Bridge: Gospel-Gol',e)}\n  try{if(typeof studioVariantState!=='undefined'&&sem.studioVariant)studioVariantState=JSON.parse(JSON.stringify(sem.studioVariant));studioVariantRender?.()}catch(e){console.warn('Git Bridge: variante',e)}\n  try{window.ISSSDMenuScreen?.restore?.(sem.menuScreenV1||null)}catch(e){console.warn('Git Bridge: menu visual',e)}\n  try{if(typeof mainMenuColors!=='undefined'&&sem.mainMenuColors){mainMenuColors={...window.MAIN_MENU_ORIGINAL_COLORS,...JSON.parse(JSON.stringify(sem.mainMenuColors))};const rs=sem.mainMenuColorsRomState;studioMainMenuColorsAppliedToRom=!!rs?.applied;studioMainMenuColorsAppliedSnapshot=rs?.colors?JSON.parse(JSON.stringify(rs.colors)):null}}catch(e){console.warn('Git Bridge: cores do menu',e)}\n  try{if(ws?.sections){studioTextProjectDrafts=JSON.parse(JSON.stringify(sec.direct?.byProfile||{}));profileTextDraft={};profileTextDraftProfile=null;profileTextLoadDraftFromRom(true);window.__ISSSD_PREKICK_TEXTS__?.restore?.(JSON.parse(JSON.stringify(sec.preKickoff?.values||{})));const mm=JSON.parse(JSON.stringify(sec.mainMenu?.values||{}));mainMenuCommittedDraft=Object.keys(mm).length?mm:null;mainMenuFb96Draft=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(mm):mm;mainMenuProjectSaved=!!mainMenuCommittedDraft;window.ISSSDTextIntentions?.restore?.(JSON.parse(JSON.stringify(sec.graphicIntents?.values||{})))}}catch(e){console.error('Git Bridge: estado textual canônico',e)}\n  try{if(sem.preKickoffGraphicAssets)window.ISSSDPrekickNative?.restoreCommitted?.(sem.preKickoffGraphicAssets)}catch(e){console.warn('Git Bridge: gráficos pré-kickoff',e)}\n  try{const title=String(sem.romInternalTitle||sem.romInternalTitleDesired||'').replace(/[^\\x20-\\x7E]/g,' ').slice(0,21);if(title){window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=title;window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(sem.romInternalTitleDesired||title);window.__ISSSD_ROM_META_WRITE_TITLE__?.(title,'Título interno do projeto')}}catch(e){console.warn('Git Bridge: título interno',e)}\n  try{renderProfileTextEditor?.();renderPreKickoffTextEditor?.();renderMainMenuFb96Fields?.();renderEverything?.();renderRomMetadata?.();renderPlusGroupOrganizer?.();window.ISSSDNativeTexts590?.install?.();window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(e){console.warn('Git Bridge: render final',e)}\n  return true;\n };\n`;
if(!html.includes('__ISSSD_GIT_REAPPLY_PROJECT_STATE__')){if(!html.includes(applyNeedle))throw new Error('Build interrompido: não encontrei studioApplyProjectWithBase para expor restauração integral do projeto.');html=html.replace(applyNeedle,applyNeedle+restoreBridge)}

// A restauração final ocorre DENTRO de studioApplyProjectWithBase, depois que o legado
// terminou seus próprios restores/repaints. Isso elimina a corrida ROM-base x projeto.
const applyEndNeedle='if(typeof studioVariantRender==="function")studioVariantRender();\n  studioUpdateBadge();\n}';
const applyEndPatched='if(typeof studioVariantRender==="function")studioVariantRender();\n  window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d);\n  studioUpdateBadge();\n}';
html=html.replaceAll('window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d);\n  studioUpdateBadge();','studioUpdateBadge();');
if(!html.includes(applyEndNeedle))throw new Error('Build interrompido: não encontrei o final de studioApplyProjectWithBase para instalar restauração determinística.');
html=html.replace(applyEndNeedle,applyEndPatched);
if((html.match(/__ISSSD_GIT_REAPPLY_PROJECT_STATE__\?\.\(d\)/g)||[]).length!==1)throw new Error('Build interrompido: restauração determinística dentro de studioApplyProjectWithBase não foi instalada exatamente uma vez.');

const openHook='await window.__ISSSD_GIT_AFTER_PROJECT_OPEN__?.(f);';
html=html.replace(/await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\);try\{window\.__ISSSD_GIT_REAPPLY_PROJECT_STATE__[\s\S]*?\}\s*/g,'');html=html.replaceAll(openHook,'');
const finalImportNeedle="await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'",finalImportPatched="await studioImportProject(f);"+openHook+"window.ISSSDLog?.add('Projetos','info','Projeto aberto'";
if(!html.includes(finalImportNeedle))throw new Error('Build interrompido: não encontrei o handler final de Abrir Projeto.');html=html.replace(finalImportNeedle,finalImportPatched);
if((html.match(/await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\);/g)||[]).length!==1)throw new Error('Build interrompido: hook pós-importação inválido.');

const finalizeHook='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(obj);';html=html.replaceAll(finalizeHook,'');const projectObjectNeedle='const obj=await studioProjectObject();';if(!html.includes(projectObjectNeedle))throw new Error('Build interrompido: não encontrei a montagem final do .issdproj.');html=html.replace(projectObjectNeedle,projectObjectNeedle+finalizeHook);

const css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):'',js=fs.existsSync(jsFile)?fs.readFileSync(jsFile,'utf8'):'';const patch=`\n<!-- ${marker} -->\n<style id="isssd-git-visual-bridge-overrides">\n${css}\n</style>\n<script type="module" id="isssd-git-visual-bridge-runtime">\n${js}\n</script>\n`;if(html.includes('</body>'))html=html.replace('</body>',patch+'\n</body>');else html+=patch;
const markerCount=(html.match(/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/g)||[]).length,runtimeCount=(html.match(/id=["']isssd-git-visual-bridge-runtime["']/g)||[]).length,styleCount=(html.match(/id=["']isssd-git-visual-bridge-overrides["']/g)||[]).length;
if(markerCount!==1||runtimeCount!==1||styleCount!==1)throw new Error(`Build interrompido: injeção Git duplicada/incompleta (marker=${markerCount}, runtime=${runtimeCount}, style=${styleCount}).`);
if(!html.includes('git-visual-bridge-v10-deterministic-project-import'))throw new Error('Build interrompido: runtime v10 não foi injetado.');
if(!html.includes('__ISSSD_GIT_REAPPLY_PROJECT_STATE__'))throw new Error('Build interrompido: ponte de restauração integral não foi instalada.');
if(!html.includes("studioTextProjectDrafts=JSON.parse(JSON.stringify(sec.direct?.byProfile||{}))"))throw new Error('Build interrompido: estado textual direto não está sendo restaurado no núcleo legado.');
if(html.includes('isssdProjectHydrationDiagnostic')||html.includes('Aplicar dados do projeto aos campos'))throw new Error('Build interrompido: painel manual de diagnóstico ainda está presente.');

fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(outHtml,html,'utf8');for(const name of ['assets','docs','schemas']){const from=path.join(vendorDir,name),to=path.join(outDir,name);if(fs.existsSync(from)){fs.rmSync(to,{recursive:true,force:true});fs.cpSync(from,to,{recursive:true})}}
console.log('ISSSD Studio editor build concluído.');console.log('Fonte visual em cache: '+source);console.log('Saída: '+outHtml);console.log('Git Bridge v10: projeto restaura o estado canônico dentro do lifecycle legado.');
