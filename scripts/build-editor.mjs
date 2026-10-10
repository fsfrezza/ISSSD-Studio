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
const v11File=path.join(root,'editor-src','project-import-v11.mjs');
const v17File=path.join(root,'editor-src','controller-ui-v17.mjs');

const legacyContainer=path.join(parent,'ISSSD-Studio-OLD');
const legacyRoots=[path.join(parent,'ISSSD-Studio-Visual-Bridge'),path.join(legacyContainer,'ISSSD-Studio-Visual-Bridge'),path.join(legacyContainer,'ISSSD-Studio-Preview'),path.join(legacyContainer,'ISSSD-Studio-ANTIGO'),path.join(legacyContainer,'ISSSD-Studio-OLD'),path.join(parent,'ISSSD-Studio-ANTIGO'),path.join(root,'legacy-ui'),root];
const candidates=[cachedHtml];for(const legacyRoot of legacyRoots)candidates.push(path.join(legacyRoot,'legacy-ui','ISSSD-Studio.html'),path.join(legacyRoot,'ISSSD-Studio.html'));
let source=candidates.find(p=>fs.existsSync(p));
if(!source){console.error('ISSSD Studio: não encontrei a interface legada/Visual Bridge.');console.error('Locais verificados:\n- '+candidates.join('\n- '));process.exit(2)}
if(source!==cachedHtml){const sourceDir=path.dirname(source);fs.rmSync(path.join(root,'.editor-vendor'),{recursive:true,force:true});fs.mkdirSync(vendorDir,{recursive:true});fs.copyFileSync(source,cachedHtml);for(const name of ['assets','docs','schemas']){const from=path.join(sourceDir,name),to=path.join(vendorDir,name);if(fs.existsSync(from))fs.cpSync(from,to,{recursive:true})}source=cachedHtml;console.log('Interface legada importada para cache local: '+cachedHtml)}

let html=fs.readFileSync(source,'utf8');
const marker='ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE';
html=html.replace(/<!--\s*ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE\s*-->\s*/g,'')
 .replace(/<style\s+id=["']isssd-git-visual-bridge-overrides["'][^>]*>[\s\S]*?<\/style>\s*/g,'')
 .replace(/<script\s+type=["']module["']\s+id=["']isssd-git-visual-bridge-runtime["'][^>]*>[\s\S]*?<\/script>\s*/g,'')
 .replace(/<script\s+type=["']module["']\s+id=["']isssd-git-project-import-v11["'][^>]*>[\s\S]*?<\/script>\s*/g,'')
 .replace(/<script\s+type=["']module["']\s+id=["']isssd-git-controller-v17["'][^>]*>[\s\S]*?<\/script>\s*/g,'');

const unsafeDeferredLength='(studioDeferredPlayerPatches.length-deferredNative.length)',safeDeferredLength='((studioDeferredPlayerPatches||[]).length-deferredNative.length)';if(html.includes(unsafeDeferredLength))html=html.replaceAll(unsafeDeferredLength,safeDeferredLength);

// O servidor local conhece a ROM-base canônica Plus e a expõe somente ao Editor em
// /__isssd/default-plus-rom. Assim, abrir um projeto Plus nunca depende do file picker.
const fixedPlusPath='C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms\\International Superstar Soccer Deluxe Plus.sfc';
const fixedBaseMarker='__ISSSD_FIXED_PLUS_ROM_PATH__';
if(!html.includes(fixedBaseMarker)){
 const baseResolverBoundary='function studioB64(bytes){';
 if(!html.includes(baseResolverBoundary))throw new Error('Build interrompido: não encontrei o final do resolvedor de ROM-base legado.');
 const fixedBaseBridge=`const __ISSSD_FIXED_PLUS_ROM_PATH__=${JSON.stringify(fixedPlusPath)};\nconst __ISSSD_FIXED_PLUS_ROM_NAME__='International Superstar Soccer Deluxe Plus.sfc';\nconst __ISSSD_FIXED_PLUS_ROM_ENDPOINT__='/__isssd/default-plus-rom';\nconst __ISSSD_PRE_FIXED_BASE_RESOLVER__=studioGetCachedBase;\nstudioGetCachedBase=async function(sha){\n const cached=await __ISSSD_PRE_FIXED_BASE_RESOLVER__(sha);if(cached?.bytes)return cached;\n try{\n  const r=await fetch(__ISSSD_FIXED_PLUS_ROM_ENDPOINT__,{cache:'no-store'});if(!r.ok)return null;\n  const bytes=new Uint8Array(await r.arrayBuffer()),got=await studioSha256(bytes);\n  if(sha&&got!==sha){console.error('ISSSD Studio: ROM-base fixa não corresponde ao SHA exigido pelo projeto',{path:__ISSSD_FIXED_PLUS_ROM_PATH__,expected:sha,actual:got});return null}\n  await studioCacheBase(bytes,__ISSSD_FIXED_PLUS_ROM_NAME__,'iss-deluxe-plus');\n  window.ISSSDLog?.add?.('ROM / Build','info','ROM-base Plus carregada automaticamente do caminho fixo',{path:__ISSSD_FIXED_PLUS_ROM_PATH__,sha256:got});\n  return {sha256:got,name:__ISSSD_FIXED_PLUS_ROM_NAME__,bytes};\n }catch(e){console.error('ISSSD Studio: falha ao carregar ROM-base fixa',e);return null}\n};\n`;
 html=html.replace(baseResolverBoundary,fixedBaseBridge+baseResolverBoundary);
}

// Para projetos Plus, nunca abrir o seletor manual: se o caminho fixo falhar, mostre erro.
const manualBasePrompt='studioPendingProject=d;\n  alert("A ROM-base deste projeto ainda não está disponível neste navegador. Selecione a ROM-base correspondente; o Studio validará o SHA-256 antes de aplicar qualquer alteração.");\n  document.getElementById("romFile")?.click();';
if(html.includes(manualBasePrompt))html=html.replace(manualBasePrompt,`if(d.base?.profile==='iss-deluxe-plus'){throw new Error('ROM-base Plus não encontrada no caminho fixo: ${fixedPlusPath.replace(/\\/g,'\\\\')}')}\n  studioPendingProject=d;\n  alert("A ROM-base deste projeto ainda não está disponível neste navegador. Selecione a ROM-base correspondente; o Studio validará o SHA-256 antes de aplicar qualquer alteração.");\n  document.getElementById("romFile")?.click();`);

const saveHook='window.__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__?.();';
if(!html.includes(saveHook)){const needle='async function studioProjectObject(){';if(!html.includes(needle))throw new Error('Build interrompido: não encontrei studioProjectObject para instalar sincronização pré-salvamento.');html=html.replace(needle,needle+'\n '+saveHook)}

const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
const restoreBridge=`\n window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__=function(project){\n  const sem=project?.state?.semantic||{},ws=sem.textWorkspaceV2,sec=ws?.sections||{};\n  try{if(sem.teamsV1?.schema==='isssd-teams-v1')studioRestoreTeamsV1(sem.teamsV1)}catch(e){console.warn('Git Bridge: equipes/jogadores',e)}\n  try{if(studioCore()?.restorePlusGroupsProjectState)studioCore().restorePlusGroupsProjectState(sem.plusGroups||null)}catch(e){console.warn('Git Bridge: grupos',e)}\n  try{if(studioCore()?.restoreGospelGolProjectState)studioCore().restoreGospelGolProjectState(sem.plusGospelGol||null)}catch(e){console.warn('Git Bridge: Gospel-Gol',e)}\n  try{if(typeof studioVariantState!=='undefined'&&sem.studioVariant)studioVariantState=JSON.parse(JSON.stringify(sem.studioVariant));studioVariantRender?.()}catch(e){console.warn('Git Bridge: variante',e)}\n  try{window.ISSSDMenuScreen?.restore?.(sem.menuScreenV1||null)}catch(e){console.warn('Git Bridge: menu visual',e)}\n  try{if(typeof mainMenuColors!=='undefined'&&sem.mainMenuColors){mainMenuColors={...window.MAIN_MENU_ORIGINAL_COLORS,...JSON.parse(JSON.stringify(sem.mainMenuColors))};const rs=sem.mainMenuColorsRomState;studioMainMenuColorsAppliedToRom=!!rs?.applied;studioMainMenuColorsAppliedSnapshot=rs?.colors?JSON.parse(JSON.stringify(rs.colors)):null}}catch(e){console.warn('Git Bridge: cores do menu',e)}\n  try{if(ws?.sections){const directBy=JSON.parse(JSON.stringify(sec.direct?.byProfile||{}));const directPid=(activeRomProfile?.id&&directBy[activeRomProfile.id])?activeRomProfile.id:(directBy['iss-deluxe-plus']?'iss-deluxe-plus':(Object.keys(directBy)[0]||null));studioTextProjectDrafts=directBy;profileTextDraft=directPid?JSON.parse(JSON.stringify(directBy[directPid]||{})):{};profileTextDraftProfile=directPid;window.__ISSSD_PREKICK_TEXTS__?.restore?.(JSON.parse(JSON.stringify(sec.preKickoff?.values||{})));const mm=JSON.parse(JSON.stringify(sec.mainMenu?.values||{}));mainMenuCommittedDraft=Object.keys(mm).length?mm:null;mainMenuFb96Draft=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(mm):mm;mainMenuProjectSaved=!!mainMenuCommittedDraft;window.ISSSDTextIntentions?.restore?.(JSON.parse(JSON.stringify(sec.graphicIntents?.values||{})))}}catch(e){console.error('Git Bridge: estado textual canônico',e)}\n  try{if(sem.preKickoffGraphicAssets)window.ISSSDPrekickNative?.restoreCommitted?.(sem.preKickoffGraphicAssets)}catch(e){console.warn('Git Bridge: gráficos pré-kickoff',e)}\n  try{studioTitleScreenRestore(sem.titleScreen||null)}catch(e){console.warn('Git Bridge: Tela Inicial nativa',e)}\n  try{studioTitleComposerRestore(project?.state?.titleComposerV2||sem.titleComposerV2||project?.state?.ui?.titleComposerV2||null)}catch(e){console.warn('Git Bridge: compositor da Tela Inicial',e)}\n  try{const title=String(sem.romInternalTitle||sem.romInternalTitleDesired||'').replace(/[^\\x20-\\x7E]/g,' ').slice(0,21);if(title){window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=title;window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(sem.romInternalTitleDesired||title);window.__ISSSD_ROM_META_WRITE_TITLE__?.(title,'Título interno do projeto')}}catch(e){console.warn('Git Bridge: título interno',e)}\n  try{renderProfileTextEditor?.();renderPreKickoffTextEditor?.();renderMainMenuFb96Fields?.();renderEverything?.();renderRomMetadata?.();renderPlusGroupOrganizer?.();window.ISSSDNativeTexts590?.install?.();window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(e){console.warn('Git Bridge: render final',e)}\n  return true;\n };\n`;
if(!html.includes('__ISSSD_GIT_REAPPLY_PROJECT_STATE__')){if(!html.includes(applyNeedle))throw new Error('Build interrompido: não encontrei studioApplyProjectWithBase para expor restauração integral do projeto.');html=html.replace(applyNeedle,applyNeedle+restoreBridge)}

html=html.replaceAll('window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d);','');
const applyStart=html.indexOf(applyNeedle);
const applyNext=html.indexOf('function studioProjectChangeHasValues(',applyStart);
if(applyStart<0||applyNext<0)throw new Error('Build interrompido: não consegui delimitar studioApplyProjectWithBase.');
const applyBadge=html.lastIndexOf('studioUpdateBadge();',applyNext);
if(applyBadge<applyStart)throw new Error('Build interrompido: não encontrei studioUpdateBadge dentro de studioApplyProjectWithBase.');
html=html.slice(0,applyBadge)+'window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d);\n  '+html.slice(applyBadge);
if((html.match(/__ISSSD_GIT_REAPPLY_PROJECT_STATE__\?\.\(d\)/g)||[]).length!==1)throw new Error('Build interrompido: restauração determinística dentro de studioApplyProjectWithBase não foi instalada exatamente uma vez.');

const openHook='await window.__ISSSD_GIT_AFTER_PROJECT_OPEN__?.(f);';
html=html.replace(/await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\);try\{window\.__ISSSD_GIT_REAPPLY_PROJECT_STATE__[\s\S]*?\}\s*/g,'');html=html.replaceAll(openHook,'');
const finalImportNeedle="await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'",finalImportPatched="await studioImportProject(f);"+openHook+"window.ISSSDLog?.add('Projetos','info','Projeto aberto'";
if(!html.includes(finalImportNeedle))throw new Error('Build interrompido: não encontrei o handler final de Abrir Projeto.');html=html.replace(finalImportNeedle,finalImportPatched);
if((html.match(/await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\);/g)||[]).length!==1)throw new Error('Build interrompido: hook pós-importação inválido.');

const finalizeHook='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(obj);';html=html.replaceAll(finalizeHook,'');const projectObjectNeedle='const obj=await studioProjectObject();';if(!html.includes(projectObjectNeedle))throw new Error('Build interrompido: não encontrei a montagem final do .issdproj.');html=html.replace(projectObjectNeedle,projectObjectNeedle+finalizeHook);

const css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):'';
const js=fs.existsSync(jsFile)?fs.readFileSync(jsFile,'utf8'):'';
const v11=fs.existsSync(v11File)?fs.readFileSync(v11File,'utf8'):'';
const v17=fs.existsSync(v17File)?fs.readFileSync(v17File,'utf8'):'';
try{new Function(js);new Function(v11);new Function(v17)}catch(e){throw new Error('Build interrompido: JavaScript Git inválido: '+e.message)}
const patch=`\n<!-- ${marker} -->\n<style id="isssd-git-visual-bridge-overrides">\n${css}\n</style>\n<script type="module" id="isssd-git-visual-bridge-runtime">\n${js}\n</script>\n<script type="module" id="isssd-git-project-import-v11">\n${v11}\n</script>\n<script type="module" id="isssd-git-controller-v17">\n${v17}\n</script>\n`;
if(html.includes('</body>'))html=html.replace('</body>',patch+'\n</body>');else html+=patch;
const markerCount=(html.match(/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/g)||[]).length,runtimeCount=(html.match(/id=["']isssd-git-visual-bridge-runtime["']/g)||[]).length,styleCount=(html.match(/id=["']isssd-git-visual-bridge-overrides["']/g)||[]).length,v11Count=(html.match(/id=["']isssd-git-project-import-v11["']/g)||[]).length,v17Count=(html.match(/id=["']isssd-git-controller-v17["']/g)||[]).length;
if(markerCount!==1||runtimeCount!==1||styleCount!==1||v11Count!==1||v17Count!==1)throw new Error(`Build interrompido: injeção Git duplicada/incompleta (marker=${markerCount}, runtime=${runtimeCount}, style=${styleCount}, v11=${v11Count}, v17=${v17Count}).`);
if(!html.includes('git-visual-bridge-v10-deterministic-project-import')||!html.includes('git-project-import-v11')||!html.includes('git-controller-ui-v17-native-font'))throw new Error('Build interrompido: runtimes de importação/controles não foram injetados.');
if(!html.includes('__ISSSD_GIT_REAPPLY_PROJECT_STATE__'))throw new Error('Build interrompido: ponte de restauração integral não foi instalada.');
if(!html.includes('__ISSSD_FIXED_PLUS_ROM_PATH__')||!html.includes('/__isssd/default-plus-rom'))throw new Error('Build interrompido: resolvedor automático da ROM-base Plus não foi instalado.');
if(!html.includes('profileTextDraft=directPid?JSON.parse(JSON.stringify(directBy[directPid]||{})):{}'))throw new Error('Build interrompido: rascunho textual direto ainda não é restaurado da baseline do projeto.');
if(html.includes('isssdProjectHydrationDiagnostic')||html.includes('Aplicar dados do projeto aos campos'))throw new Error('Build interrompido: painel manual de diagnóstico ainda está presente.');

fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(outHtml,html,'utf8');for(const name of ['assets','docs','schemas']){const from=path.join(vendorDir,name),to=path.join(outDir,name);if(fs.existsSync(from)){fs.rmSync(to,{recursive:true,force:true});fs.cpSync(from,to,{recursive:true})}}
console.log('ISSSD Studio editor build concluído.');console.log('Fonte visual em cache: '+source);console.log('Saída: '+outHtml);console.log('ROM-base Plus fixa: '+fixedPlusPath);console.log('Git Bridge v17: projeto reidratado + controles exatos com fonte nativa.');