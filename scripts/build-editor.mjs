import {SOUND_SLOTS} from '../src/core/sound-slots.mjs';
import {TEAM_NAME_LANGUAGE_PRESETS} from '../src/core/team-name-presets.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'editor');
const outHtml=path.join(outDir,'ISSSD-Studio.html');
const vendorDir=path.join(root,'.editor-vendor','legacy-ui');
const cachedHtml=path.join(vendorDir,'ISSSD-Studio.html');
const cssFile=path.join(root,'editor-src','visual-bridge-overrides.css');
const jsFile=path.join(root,'editor-src','visual-bridge-overrides.mjs');
const v11File=path.join(root,'editor-src','project-import-v11.mjs');

// The imported ISSSD-Studio-Visual-Bridge baseline is explicit and protected.
const source=cachedHtml;
if(!fs.existsSync(source))throw new Error('Baseline local ausente: '+source+'. Nenhuma pasta foi removida.');
const generatedMarkers=['ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE','isssd-git-controller-v17','git-controller-ui-v17-native-font','git-controller-ui-v18-stable-no-observer'];
if(generatedMarkers.some(m=>fs.readFileSync(source,'utf8').includes(m)))throw new Error('Baseline contém build gerado; .editor-vendor foi preservado.');

let html=fs.readFileSync(source,'utf8');
// Replace only the generated appearance UI; the private baseline stays immutable.
const appearanceCore=fs.readFileSync(path.join(root,'src/core/player-hair-manual.mjs'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/core/player-appearance.mjs'),'utf8').replace("import {CUSTOM_HAIR_MANUAL_FRAMES} from './player-hair-manual.mjs';",'');
const appearanceExports=[...appearanceCore.matchAll(/^export (?:const|function) (\w+)/gm)].map(m=>m[1]);
const appearanceEngine='window.ISSSDPlayerAppearanceCore=(()=>{\n'+appearanceCore.replace(/^export /gm,'')+'\nreturn {'+appearanceExports.join(',')+'};})();\n';
const appearanceRuntime=appearanceEngine+fs.readFileSync(path.join(root,'editor-src/player-appearance.mjs'),'utf8');
const appearanceStart=html.indexOf('const HAIR_NAMES=['),appearanceEnd=html.indexOf('renderEmbeddedAssetManifest();',appearanceStart);
if(appearanceStart<0||appearanceEnd<0)throw Error('Aparência: bloco original não encontrado.');
html=html.slice(0,appearanceStart)+appearanceRuntime+'\n'+html.slice(appearanceEnd);
const appearanceDialog=/<dialog id="appearanceDialog">[\s\S]*?<\/dialog>/;
if(!appearanceDialog.test(html))throw Error('Aparência: janela original não encontrada.');
html=html.replace(appearanceDialog,()=>fs.readFileSync(path.join(root,'editor-src/player-appearance-dialog.html'),'utf8'));
html=html.replace('</head>',()=>'<style id="isssd-native-player-appearance">'+fs.readFileSync(path.join(root,'editor-src/player-appearance.css'),'utf8')+'</style>\n</head>');

// Keep the protected visual baseline immutable; replace its legacy Portuguese
// proposals in the generated editor, including an intentionally empty second line.
html=html.replaceAll('"pc":248272,"original":"DISPLAYS","pilot":"MOSTRA "','"pc":248272,"original":"DISPLAYS","pilot":"SO MOSTRA"').replaceAll('"pc":248272,"original":"DISPLAYS","pilot":"SO MOSTRA","capacity":8','"pc":248272,"original":"DISPLAYS","pilot":"SO MOSTRA","capacity":9').replaceAll('"pc":248283,"original":"ONLY","pilot":"SO"','"pc":248283,"original":"ONLY","pilot":""');
// Expose audio in the existing selective open/save categories without editing the baseline.
html=html.replaceAll("'rom.title':'Título interno'","'sounds':'Sons · amostras e narração','rom.title':'Título interno'")
 .replaceAll("'rom.title':sem.romInternalTitle", "'sounds':sem.soundsV1||null,'rom.title':sem.romInternalTitle")
 .replaceAll("if(id==='teams.names'&&sem", "if(id==='sounds')delete sem.soundsV1;else if(id==='teams.names'&&sem")
 .replaceAll("if(id==='teams.names'&&ss", "if(id==='sounds')ds.soundsV1=clone(ss.soundsV1);else if(id==='teams.names'&&ss")
 .replace(" add('groups','Organização e nomes dos grupos'", " add('sounds','Sons · amostras e narração',studioProjectChangeHasValues(sem.soundsV1?.values),x=>delete x.soundsV1);\n add('groups','Organização e nomes dos grupos'");
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

// Selective save/open must classify and filter the same complete control
// inscriptions that the screen-owned snapshot and native writer consume.
const graphicsCategory="'texts.graphics':tw.graphicIntents||null";
if(!html.includes(graphicsCategory))throw new Error('Build interrompido: categoria gráfica de salvamento não encontrada.');
html=html.replaceAll(graphicsCategory,"'texts.graphics':((sem.additionalScreenTextsV1||sem.screenTextsV1?.values?.controls||sem.screenTextsV1?.values?.strategies||sem.screenTextsV1?.values?.['strategy-aux'])?{additional:sem.additionalScreenTextsV1||null,workspace:tw.graphicIntents||null,controls:sem.screenTextsV1?.values?.controls,strategies:sem.screenTextsV1?.values?.strategies,aux:sem.screenTextsV1?.values?.['strategy-aux']}:tw.graphicIntents||null)");
const removeGraphics="else if(id==='texts.graphics'&&tw)tw.graphicIntents={};";
if(!html.includes(removeGraphics))throw new Error('Build interrompido: filtro gráfico de salvamento não encontrado.');
html=html.replaceAll(removeGraphics,"else if(id==='texts.graphics'){if(tw)tw.graphicIntents={};delete sem.additionalScreenTextsV1;if(sem.screenTextsV1?.values)for(const owner of ['controls','strategies','strategy-aux'])delete sem.screenTextsV1.values[owner];}");

// Full auxiliary inscriptions use the verified native rows, including padding.
const oldAuxStage="function stage(g,text){const vals=split(g,text);g.parts.forEach(([pc],i)=>window.ISSSDTextIntentions?.setDraft?.(P+pc,vals[i]));return vals}";
if(!html.includes(oldAuxStage))throw new Error('Build interrompido: staging de textos auxiliares não encontrado.');
html=html.replace(oldAuxStage,"function stage(g,text){const q=String(text??'').toUpperCase().replace(/\\s+/g,' ').trim();window.ISSSDTextIntentions?.setDraft?.('strategy.aux.v1.'+g.id,q);return [q]}");

// Keep rebuilt legacy strategy buttons on the audited preset path as well.
html=html.replace('function fillPtBr(){for(const g of GROUPS)',"function fillPtBr(){if(window.__ISSSD_TEXT_LANGUAGE_PRESETS__){window.__ISSSD_TEXT_LANGUAGE_PRESETS__.fill('strategies','portuguese');return}for(const g of GROUPS)");
html=html.replace('function restore(){for(const g of GROUPS)',"function restore(){if(window.__ISSSD_TEXT_LANGUAGE_PRESETS__){window.__ISSSD_TEXT_LANGUAGE_PRESETS__.fill('strategies','english');return}for(const g of GROUPS)");
html=html.replace("$('tx622AuxPt').onclick=()=>{AUX.forEach", "$('tx622AuxPt').onclick=()=>{if(window.__ISSSD_TEXT_LANGUAGE_PRESETS__){window.__ISSSD_TEXT_LANGUAGE_PRESETS__.fill('strategy-aux','portuguese');return}AUX.forEach");

// Project confirmation is semantic. Native size/region checks still run in
// Verify, Apply and Build Pipeline; saving text must not require rasterization.
const semanticMenuCommit="function commit(){try{const texts=uiTexts(),style=styleNow(),payload=JSON.stringify({schema:'isssd-main-menu-text-v5',version:5,texts,style});if(!window.ISSSDTextIntentions?.setDraft)throw Error('Gerenciador de projeto indisponível.');window.ISSSDTextIntentions.setDraft(KEY,payload);window.ISSSDTextIntentions.commitAll?.();window.__ISSSD_MAIN_MENU_PENDING__=null;status('Textos e estilo confirmados no projeto. Use Salvar Projeto. Verificar gravação valida separadamente o orçamento binário antes da ROM.');renderPreview()}catch(e){status('Não implementado: '+(e.message||e),true)}}";
const menuCommitRx=/function commit\(\)\{try\{const b=verify\(\),payload=JSON.stringify\(\{schema:'isssd-main-menu-text-v5'[^\n]+/;
if(!menuCommitRx.test(html))throw new Error('Build interrompido: confirmação do menu não encontrada.');
html=html.replace(menuCommitRx,semanticMenuCommit);

const css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):'';
const js=fs.existsSync(jsFile)?fs.readFileSync(jsFile,'utf8'):'';
const languagePresets=JSON.parse(fs.readFileSync(path.join(root,'project-data','text-language-presets-v1.json'),'utf8'));
const additionalSections=JSON.parse(fs.readFileSync(path.join(root,'project-data','additional-screen-text-fields.json'),'utf8'));
const additionalRuntime='const ADDITIONAL_TEXT_SECTIONS='+JSON.stringify(additionalSections)+';\n'+fs.readFileSync(path.join(root,'editor-src','additional-screen-texts.mjs'),'utf8');
const teamNameRuntime='const TEAM_NAME_LANGUAGE_PRESETS='+JSON.stringify(TEAM_NAME_LANGUAGE_PRESETS)+';\n'+fs.readFileSync(path.join(root,'editor-src','team-name-language-presets.mjs'),'utf8');
const soundsRuntime='const SOUND_SLOTS='+JSON.stringify(SOUND_SLOTS)+';\nconst FB96_SOUND_REFERENCES='+fs.readFileSync(path.join(root,'project-data','fb96-sound-references.json'),'utf8')+';\n'+fs.readFileSync(path.join(root,'editor-src','sounds-editor.mjs'),'utf8');
const v11='const TEXT_LANGUAGE_PRESETS='+JSON.stringify(languagePresets)+';\n'+(fs.existsSync(v11File)?fs.readFileSync(v11File,'utf8'):'')+'\n'+additionalRuntime+'\n'+teamNameRuntime+'\n'+soundsRuntime;
try{new Function(js);new Function(v11)}catch(e){throw new Error('Build interrompido: JavaScript Git inválido: '+e.message)}
const patch=`\n<!-- ${marker} -->\n<style id="isssd-git-visual-bridge-overrides">\n${css}\n</style>\n<script type="module" id="isssd-git-visual-bridge-runtime">\n${js}\n</script>\n<script type="module" id="isssd-git-project-import-v11">\n${v11}\n</script>\n`;
if(html.includes('</body>'))html=html.replace('</body>',()=>patch+'\n</body>');else html+=patch;
const markerCount=(html.match(/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/g)||[]).length,runtimeCount=(html.match(/id=["']isssd-git-visual-bridge-runtime["']/g)||[]).length,styleCount=(html.match(/id=["']isssd-git-visual-bridge-overrides["']/g)||[]).length,v11Count=(html.match(/id=["']isssd-git-project-import-v11["']/g)||[]).length;
if(markerCount!==1||runtimeCount!==1||styleCount!==1||v11Count!==1)throw new Error(`Build interrompido: injeção Git duplicada/incompleta (marker=${markerCount}, runtime=${runtimeCount}, style=${styleCount}, v11=${v11Count}).`);
if(!html.includes('git-visual-bridge-v10-deterministic-project-import')||!html.includes('git-project-import-v11'))throw new Error('Build interrompido: runtimes de importação não foram injetados.');
if(!html.includes('__ISSSD_GIT_REAPPLY_PROJECT_STATE__'))throw new Error('Build interrompido: ponte de restauração integral não foi instalada.');
if(!html.includes('__ISSSD_FIXED_PLUS_ROM_PATH__')||!html.includes('/__isssd/default-plus-rom'))throw new Error('Build interrompido: resolvedor automático da ROM-base Plus não foi instalado.');
if(!html.includes('profileTextDraft=directPid?JSON.parse(JSON.stringify(directBy[directPid]||{})):{}'))throw new Error('Build interrompido: rascunho textual direto ainda não é restaurado da baseline do projeto.');
if(html.includes('isssdProjectHydrationDiagnostic')||html.includes('Aplicar dados do projeto aos campos'))throw new Error('Build interrompido: painel manual de diagnóstico ainda está presente.');
if(html.includes('isssd-git-controller-v17')||html.includes('git-controller-ui-v18-stable-no-observer'))throw new Error('Build interrompido: runtime antigo de Controles ainda contaminou a fonte/cache.');

fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(outHtml,html,'utf8');for(const name of ['assets','docs','schemas']){const from=path.join(vendorDir,name),to=path.join(outDir,name);if(fs.existsSync(from)){fs.rmSync(to,{recursive:true,force:true});fs.cpSync(from,to,{recursive:true})}}
console.log('ISSSD Studio editor build concluído.');console.log('Fonte visual em cache: '+source);console.log('Saída: '+outHtml);console.log('ROM-base Plus fixa: '+fixedPlusPath);console.log('Cache visual higienizado; Git Bridge v11/v16 sem runtime v17/v18 de Controles.');