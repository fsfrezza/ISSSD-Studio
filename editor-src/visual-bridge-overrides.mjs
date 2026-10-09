const BUILD='git-visual-bridge-v7-full-project-restore';
window.__ISSSD_GIT_VISUAL_BRIDGE__={build:BUILD,loadedAt:new Date().toISOString()};

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cleanTitle=v=>String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
let loadedProject=null;
let userEditedSinceOpen=false;

function installBadge(){
 if(document.getElementById('isssdGitBridgeBadge'))return;
 const status=document.querySelector('.statusbar');if(!status)return;
 const badge=document.createElement('span');badge.id='isssdGitBridgeBadge';badge.className='badge ok';badge.textContent='Git Visual Bridge v7';badge.title='Projeto restaurado automaticamente pelo fluxo Git.';status.appendChild(badge);
}
function setValue(selector,value){for(const node of document.querySelectorAll(selector))if('value' in node)node.value=String(value??'')}
function fieldRecord(selector,keyFn){const out={};for(const n of document.querySelectorAll(selector)){const k=keyFn(n);if(k)out[k]=String(n.value??'')}return out}
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
 const s=sem(project);
 const native= s.titleScreen;
 const composer=project?.state?.titleComposerV2||s.titleComposerV2||null;
 try{
  if(native&&typeof window.studioTitleScreenRestore==='function')window.studioTitleScreenRestore(clone(native));
 }catch(e){console.warn('Git Bridge: titleScreen restore',e)}
 try{
  if(composer){
   const api=window.__ISSSD_TITLE_COMPOSER__;
   if(api?.restore)api.restore(clone(composer));
   else window.titleComposerV2Restore?.(clone(composer));
  }
 }catch(e){console.warn('Git Bridge: title composer restore',e)}
 const tint=String(native?.stripeTint||'').toUpperCase();
 if(tint){
  window.__ISSSD_TITLE_STRIPE_TINT__=tint;
  const a=document.getElementById('titleStripeTintColor');if(a)a.value=tint;
  const b=document.getElementById('titleStripeTintHex');if(b)b.value=tint;
 }
 try{window.renderTitleScreenPage?.()}catch(_){}
}

function restoreFullProject(project){
 if(!project?.state?.semantic)return;
 loadedProject=project;
 restoreCanonicalTextState(project);
 restoreTitleScreenState(project);
 const s=sem(project),raw=s.romInternalTitle||s.romInternalTitleDesired||'',title=cleanTitle(raw);
 if(title){
  window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=title;
  window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(s.romInternalTitleDesired||raw);
  try{window.__ISSSD_ROM_META_WRITE_TITLE__?.(title,'Título interno do projeto')}catch(_){}
 }
 hydrateVisibleTextFields(project);
}

window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){
 let project=null;
 try{project=JSON.parse(await file.text())}catch(e){console.error('Git Bridge: leitura do projeto',e);return}
 userEditedSinceOpen=false;
 restoreFullProject(project);
 // Alguns painéis são montados logo após a importação. Uma segunda passagem curta
 // cobre apenas esse bootstrap; depois disso nunca sobrescrevemos edição do usuário.
 setTimeout(()=>{if(!userEditedSinceOpen&&loadedProject===project)restoreFullProject(project)},100);
 setTimeout(()=>{if(!userEditedSinceOpen&&loadedProject===project)restoreFullProject(project)},400);
};

function syncLiveTextStateBeforeSave(){
 const api=window.ISSSDTextWorkspace;if(!api?.snapshot||!api?.restore)return;
 const ws=clone(api.snapshot());const sec=ws.sections||(ws.sections={});
 sec.direct=sec.direct||{byProfile:{}};sec.direct.byProfile=sec.direct.byProfile||{};
 sec.preKickoff=sec.preKickoff||{values:{}};sec.preKickoff.values=sec.preKickoff.values||{};
 sec.mainMenu=sec.mainMenu||{values:{}};sec.mainMenu.values=sec.mainMenu.values||{};
 sec.graphicIntents=sec.graphicIntents||{values:{}};sec.graphicIntents.values=sec.graphicIntents.values||{};
 sec.title=sec.title||{values:{}};sec.title.values=sec.title.values||{};
 const profileId=window.activeRomProfile?.id||'iss-deluxe-plus';
 const direct=fieldRecord('[data-profile-text]',n=>n.dataset.profileText);if(Object.keys(direct).length)sec.direct.byProfile[profileId]={...(sec.direct.byProfile[profileId]||{}),...direct};
 const pre=fieldRecord('[data-pk-id]',n=>n.dataset.pkId);if(Object.keys(pre).length)sec.preKickoff.values={...sec.preKickoff.values,...pre};
 let menu=clone(window.mainMenuFb96Draft||sec.mainMenu.values||{});
 Object.assign(menu,fieldRecord('[data-mainmenu-fb96]',n=>n.dataset.mainmenuFb96),fieldRecord('[data-mm-real]',n=>n.dataset.mmReal));
 menu=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(menu):menu;
 sec.mainMenu.values=clone(menu);window.mainMenuFb96Draft=clone(menu);window.mainMenuCommittedDraft=clone(menu);window.mainMenuProjectSaved=true;
 let gfx=clone(window.ISSSDTextIntentions?.draftSnapshot?.()||window.ISSSDTextIntentions?.snapshot?.()||sec.graphicIntents.values||{});
 Object.assign(gfx,fieldRecord('[data-gfx-intent]',n=>n.dataset.gfxIntent));
 for(const n of document.querySelectorAll('[id^="st612_"]'))if(n.tagName==='INPUT')gfx['strategy.screen.v614.'+n.id.slice('st612_'.length)]=String(n.value??'');
 for(const n of document.querySelectorAll('[id^="pk590_"]'))if(n.tagName==='INPUT')gfx['__pk590.native.'+n.id.slice('pk590_'.length)]=String(n.value??'');
 sec.graphicIntents.values=gfx;
 window.studioTextProjectDrafts=clone(sec.direct.byProfile);
 try{window.__ISSSD_PREKICK_TEXTS__?.restore?.(clone(sec.preKickoff.values))}catch(_){}
 try{window.ISSSDTextIntentions?.restore?.(clone(gfx));window.ISSSDTextIntentions?.commitAll?.()}catch(_){}
 api.restore(ws);
 const titleInput=document.getElementById('romMetaTitle');if(titleInput){const t=cleanTitle(titleInput.value);window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=t;window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(document.getElementById('romMetaTitleDesired')?.value||t)}
 // A cor da faixa é estado de projeto, não apenas preview. Se houve recoloração,
 // garantir que o snapshot nativo a reconheça como paleta alterada.
 const tint=String(window.__ISSSD_TITLE_STRIPE_TINT__||'').toUpperCase();
 if(tint&&window.titleScreenState?.dirtyPalettes?.add)window.titleScreenState.dirtyPalettes.add('Faixa vermelha');
}
window.__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__=syncLiveTextStateBeforeSave;

function boot(){
 installBadge();
 document.addEventListener('input',()=>{userEditedSinceOpen=true},true);
 document.addEventListener('change',e=>{if(e.target?.id!=='projectFile')userEditedSinceOpen=true},true);
 document.addEventListener('click',e=>{
  if(!loadedProject||userEditedSinceOpen)return;
  if(e.target?.closest?.('.navbtn[data-page]'))setTimeout(()=>{if(!userEditedSinceOpen)hydrateVisibleTextFields(loadedProject)},60);
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('load',installBadge,{once:true});
