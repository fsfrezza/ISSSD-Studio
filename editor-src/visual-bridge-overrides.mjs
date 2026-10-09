const BUILD='git-visual-bridge-v8-safe-project-save';
window.__ISSSD_GIT_VISUAL_BRIDGE__={build:BUILD,loadedAt:new Date().toISOString()};

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cleanTitle=v=>String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
let loadedProject=null;
let userEditedSinceOpen=false;
let safeWorkspaceForSave=null;
const touched={direct:new Set(),preKickoff:new Set(),mainMenu:new Set(),graphicIntents:new Set(),titleScreen:false};

function resetTouched(){
 for(const k of ['direct','preKickoff','mainMenu','graphicIntents'])touched[k].clear();
 touched.titleScreen=false;safeWorkspaceForSave=null;userEditedSinceOpen=false;
}
function installBadge(){
 if(document.getElementById('isssdGitBridgeBadge'))return;
 const status=document.querySelector('.statusbar');if(!status)return;
 const badge=document.createElement('span');badge.id='isssdGitBridgeBadge';badge.className='badge ok';badge.textContent='Git Visual Bridge v8';badge.title='Projeto restaurado e salvo com baseline protegida.';status.appendChild(badge);
}
function setValue(selector,value){for(const node of document.querySelectorAll(selector))if('value' in node)node.value=String(value??'')}
function fieldRecord(selector,keyFn){const out={};for(const n of document.querySelectorAll(selector)){const k=keyFn(n);if(k)out[k]=String(n.value??'')}return out}
function firstFieldValue(selectors){for(const sel of selectors){const n=document.querySelector(sel);if(n&&'value' in n)return String(n.value??'')}return null}
function sem(project){return project?.state?.semantic||{}}
function sections(project){return sem(project).textWorkspaceV2?.sections||{}}
function plusProfile(project){const by=sections(project).direct?.byProfile||{};return by['iss-deluxe-plus']||Object.values(by)[0]||{}}

function hydrateVisibleTextFields(project){
 const s=sem(project),sec=sections(project),profile=plusProfile(project),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [id,v] of Object.entries(profile))setValue(`[data-profile-text="${CSS.escape(id)}"]`,v);
 for(const [id,v] of Object.entries(pre))setValue(`[data-pk-id="${CSS.escape(id)}"]`,v);
 for(const [id,v] of Object.entries(menu)){
  setValue(`[data-mm-real="${CSS.escape(id)}"]`,v);
  setValue(`[data-mainmenu-fb96="${CSS.escape(id)}"]`,v);
 }
 for(const [id,v] of Object.entries(gfx)){
  setValue(`[data-gfx-intent="${CSS.escape(id)}"]`,v);
  if(id.startsWith('strategy.screen.v614.')){const n=document.getElementById('st612_'+id.slice('strategy.screen.v614.'.length));if(n)n.value=String(v??'')}
  if(id.startsWith('__pk590.native.')){const n=document.getElementById('pk590_'+id.slice('__pk590.native.'.length));if(n)n.value=String(v??'')}
 }
 const raw=s.romInternalTitle||s.romInternalTitleDesired||'',title=cleanTitle(raw);
 if(title){
  const input=document.getElementById('romMetaTitle');if(input)input.value=title;
  const count=document.getElementById('romMetaTitleCount');if(count)count.textContent=String(title.length);
  const desired=document.getElementById('romMetaTitleDesired');if(desired)desired.value=String(s.romInternalTitleDesired||raw);
  window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=title;
  window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(s.romInternalTitleDesired||raw);
 }
}

function restoreCanonicalTextState(project){
 const sec=sections(project),ws=sem(project).textWorkspaceV2;
 if(!ws?.sections)return;
 try{window.ISSSDTextWorkspace?.restore?.(clone(ws))}catch(e){console.warn('Git Bridge: textWorkspace restore',e)}
 try{window.studioTextProjectDrafts=clone(sec.direct?.byProfile||{})}catch(_){}
 try{window.__ISSSD_PREKICK_TEXTS__?.restore?.(clone(sec.preKickoff?.values||{}))}catch(_){}
 try{window.ISSSDTextIntentions?.restore?.(clone(sec.graphicIntents?.values||{}))}catch(_){}
 try{
  const menu=clone(sec.mainMenu?.values||{});
  window.mainMenuCommittedDraft=clone(menu);
  window.mainMenuFb96Draft=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(clone(menu)):clone(menu);
  window.mainMenuProjectSaved=true;
 }catch(e){console.warn('Git Bridge: main menu restore',e)}
 try{window.renderProfileTextEditor?.()}catch(_){}
 try{window.renderPreKickoffTextEditor?.()}catch(_){}
 try{window.renderMainMenuFb96Fields?.()}catch(_){}
 try{window.renderAll?.()}catch(_){}
 try{window.ISSSDTextWorkspace?.render?.()}catch(_){}
 try{window.ISSSDTextIntentions?.render?.()}catch(_){}
 try{window.ISSSDNativeTexts590?.install?.()}catch(_){}
 hydrateVisibleTextFields(project);
}

function restoreTitleScreenState(project){
 const s=sem(project),native=s.titleScreen,composer=project?.state?.titleComposerV2||s.titleComposerV2||null;
 try{if(native&&typeof window.studioTitleScreenRestore==='function')window.studioTitleScreenRestore(clone(native))}catch(e){console.warn('Git Bridge: titleScreen restore',e)}
 try{
  if(composer){const api=window.__ISSSD_TITLE_COMPOSER__;if(api?.restore)api.restore(clone(composer));else window.titleComposerV2Restore?.(clone(composer));}
 }catch(e){console.warn('Git Bridge: title composer restore',e)}
 const tint=String(native?.stripeTint||'').toUpperCase();
 if(tint){window.__ISSSD_TITLE_STRIPE_TINT__=tint;const a=document.getElementById('titleStripeTintColor');if(a)a.value=tint;const b=document.getElementById('titleStripeTintHex');if(b)b.value=tint;}
 try{window.renderTitleScreenPage?.()}catch(_){}
}

function restoreFullProject(project){
 if(!project?.state?.semantic)return;
 loadedProject=project;
 restoreCanonicalTextState(project);
 restoreTitleScreenState(project);
 const s=sem(project),raw=s.romInternalTitle||s.romInternalTitleDesired||'',title=cleanTitle(raw);
 if(title){window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=title;window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(s.romInternalTitleDesired||raw);try{window.__ISSSD_ROM_META_WRITE_TITLE__?.(title,'Título interno do projeto')}catch(_){}}
 hydrateVisibleTextFields(project);
}

window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){
 let project=null;
 try{project=JSON.parse(await file.text())}catch(e){console.error('Git Bridge: leitura do projeto',e);return}
 resetTouched();
 restoreFullProject(project);
 setTimeout(()=>{if(!userEditedSinceOpen&&loadedProject===project)restoreFullProject(project)},100);
 setTimeout(()=>{if(!userEditedSinceOpen&&loadedProject===project)restoreFullProject(project)},400);
};

function ensureWorkspaceShape(ws){
 const sec=ws.sections||(ws.sections={});
 sec.direct=sec.direct||{byProfile:{}};sec.direct.byProfile=sec.direct.byProfile||{};
 sec.preKickoff=sec.preKickoff||{values:{}};sec.preKickoff.values=sec.preKickoff.values||{};
 sec.mainMenu=sec.mainMenu||{values:{}};sec.mainMenu.values=sec.mainMenu.values||{};
 sec.graphicIntents=sec.graphicIntents||{values:{}};sec.graphicIntents.values=sec.graphicIntents.values||{};
 sec.title=sec.title||{values:{}};sec.title.values=sec.title.values||{};
 return sec;
}
function liveWorkspaceFallback(){try{return clone(window.ISSSDTextWorkspace?.snapshot?.())}catch(_){return null}}
function touchedFieldValue(section,key,liveSec,profileId){
 if(section==='direct')return firstFieldValue([`[data-profile-text="${CSS.escape(key)}"]`]) ?? liveSec?.direct?.byProfile?.[profileId]?.[key] ?? null;
 if(section==='preKickoff')return firstFieldValue([`[data-pk-id="${CSS.escape(key)}"]`]) ?? liveSec?.preKickoff?.values?.[key] ?? null;
 if(section==='mainMenu')return firstFieldValue([`[data-mainmenu-fb96="${CSS.escape(key)}"]`,`[data-mm-real="${CSS.escape(key)}"]`]) ?? liveSec?.mainMenu?.values?.[key] ?? null;
 if(section==='graphicIntents'){
  let v=firstFieldValue([`[data-gfx-intent="${CSS.escape(key)}"]`]);
  if(v==null&&key.startsWith('strategy.screen.v614.'))v=document.getElementById('st612_'+key.slice('strategy.screen.v614.'.length))?.value??null;
  if(v==null&&key.startsWith('__pk590.native.'))v=document.getElementById('pk590_'+key.slice('__pk590.native.'.length))?.value??null;
  return v ?? liveSec?.graphicIntents?.values?.[key] ?? null;
 }
 return null;
}

function syncLiveTextStateBeforeSave(){
 const api=window.ISSSDTextWorkspace;if(!api?.snapshot||!api?.restore)return;
 const baseline=clone(sem(loadedProject).textWorkspaceV2||null),live=liveWorkspaceFallback();
 const ws=baseline?.sections?baseline:(live||{schema:'text-workspace-v2',version:2,sections:{}});
 const sec=ensureWorkspaceShape(ws),liveSec=live?.sections||{};
 const profileId=window.activeRomProfile?.id||'iss-deluxe-plus';
 sec.direct.byProfile[profileId]=sec.direct.byProfile[profileId]||{};
 for(const key of touched.direct){const v=touchedFieldValue('direct',key,liveSec,profileId);if(v!=null)sec.direct.byProfile[profileId][key]=String(v)}
 for(const key of touched.preKickoff){const v=touchedFieldValue('preKickoff',key,liveSec,profileId);if(v!=null)sec.preKickoff.values[key]=String(v)}
 for(const key of touched.mainMenu){const v=touchedFieldValue('mainMenu',key,liveSec,profileId);if(v!=null)sec.mainMenu.values[key]=String(v)}
 for(const key of touched.graphicIntents){const v=touchedFieldValue('graphicIntents',key,liveSec,profileId);if(v!=null)sec.graphicIntents.values[key]=String(v)}
 window.studioTextProjectDrafts=clone(sec.direct.byProfile);
 try{window.__ISSSD_PREKICK_TEXTS__?.restore?.(clone(sec.preKickoff.values))}catch(_){}
 try{window.ISSSDTextIntentions?.restore?.(clone(sec.graphicIntents.values));window.ISSSDTextIntentions?.commitAll?.()}catch(_){}
 try{window.mainMenuCommittedDraft=clone(sec.mainMenu.values);window.mainMenuFb96Draft=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(clone(sec.mainMenu.values)):clone(sec.mainMenu.values);window.mainMenuProjectSaved=true}catch(_){}
 api.restore(ws);safeWorkspaceForSave=clone(ws);
 const titleInput=document.getElementById('romMetaTitle');if(titleInput){const t=cleanTitle(titleInput.value);window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=t;window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(document.getElementById('romMetaTitleDesired')?.value||t)}
 if(loadedProject&&!touched.titleScreen)restoreTitleScreenState(loadedProject);
 const tint=String(window.__ISSSD_TITLE_STRIPE_TINT__||'').toUpperCase();if(tint&&window.titleScreenState?.dirtyPalettes?.add)window.titleScreenState.dirtyPalettes.add('Faixa vermelha');
}
window.__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__=syncLiveTextStateBeforeSave;

window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){
 if(!obj?.state?.semantic)return obj;
 if(safeWorkspaceForSave?.sections)obj.state.semantic.textWorkspaceV2=clone(safeWorkspaceForSave);
 if(loadedProject&&!touched.titleScreen){
  const baseComposer=loadedProject?.state?.titleComposerV2||null,baseTitle=sem(loadedProject).titleScreen||null;
  if(baseComposer)obj.state.titleComposerV2=clone(baseComposer);
  if(baseTitle)obj.state.semantic.titleScreen=clone(baseTitle);
  if(baseComposer)obj.state.semantic.titleComposerV2={storedIn:'state.titleComposerV2',embeddedAssets:!!baseComposer};
 }
 const baseWs=sem(loadedProject).textWorkspaceV2;
 if(baseWs?.sections&&safeWorkspaceForSave?.sections){
  const a=JSON.stringify(obj.state.semantic.textWorkspaceV2),b=JSON.stringify(safeWorkspaceForSave);
  if(a!==b)throw new Error('Proteção de projeto: a Central de Textos divergiu da baseline segura; salvamento cancelado.');
 }
 if(loadedProject&&!touched.titleScreen){
  const beforeAssets=Object.keys(loadedProject?.state?.titleComposerV2?.assets||{}).length;
  const afterAssets=Object.keys(obj?.state?.titleComposerV2?.assets||{}).length;
  if(afterAssets<beforeAssets)throw new Error(`Proteção de projeto: assets da Tela Inicial cairiam de ${beforeAssets} para ${afterAssets}; salvamento cancelado.`);
 }
 return obj;
};

function markTouchedTarget(target){
 if(!target)return;
 let key=null;
 if(target.matches?.('[data-profile-text]')){key=target.dataset.profileText;if(key)touched.direct.add(key)}
 if(target.matches?.('[data-pk-id]')){key=target.dataset.pkId;if(key)touched.preKickoff.add(key)}
 if(target.matches?.('[data-mm-real]')){key=target.dataset.mmReal;if(key)touched.mainMenu.add(key)}
 if(target.matches?.('[data-mainmenu-fb96]')){key=target.dataset.mainmenuFb96;if(key)touched.mainMenu.add(key)}
 if(target.matches?.('[data-gfx-intent]')){key=target.dataset.gfxIntent;if(key)touched.graphicIntents.add(key)}
 if(target.id?.startsWith('st612_'))touched.graphicIntents.add('strategy.screen.v614.'+target.id.slice('st612_'.length));
 if(target.id?.startsWith('pk590_'))touched.graphicIntents.add('__pk590.native.'+target.id.slice('pk590_'.length));
 if(target.id!=='romMetaTitle'&&target.id!=='romMetaTitleDesired'&&target.closest?.('#page-title-screen'))touched.titleScreen=true;
 userEditedSinceOpen=true;
}
function boot(){
 installBadge();
 document.addEventListener('input',e=>markTouchedTarget(e.target),true);
 document.addEventListener('change',e=>{if(e.target?.id!=='projectFile')markTouchedTarget(e.target)},true);
 document.addEventListener('pointerup',e=>{if(e.target?.closest?.('#page-title-screen canvas')){touched.titleScreen=true;userEditedSinceOpen=true}},true);
 document.addEventListener('click',e=>{
  if(!loadedProject||userEditedSinceOpen)return;
  if(e.target?.closest?.('.navbtn[data-page]'))setTimeout(()=>{if(!userEditedSinceOpen)hydrateVisibleTextFields(loadedProject)},60);
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('load',installBadge,{once:true});
