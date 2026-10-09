const BUILD='git-visual-bridge-v3-project-hydration-after-apply';
window.__ISSSD_GIT_VISUAL_BRIDGE__={build:BUILD,loadedAt:new Date().toISOString()};

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cleanTitle=v=>String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
let lastAppliedProject=null;
let hydrateGeneration=0;

function installBadge(){
 if(document.getElementById('isssdGitBridgeBadge'))return;
 const status=document.querySelector('.statusbar');
 if(!status)return;
 const badge=document.createElement('span');
 badge.id='isssdGitBridgeBadge';
 badge.className='badge ok';
 badge.textContent='Git Visual Bridge';
 badge.title='Interface gerada automaticamente a partir do Visual Bridge por npm run editor.';
 status.appendChild(badge);
}

function setValue(selector,value){
 for(const node of document.querySelectorAll(selector))if('value' in node)node.value=String(value??'');
}

function hydrateDomFromProject(project){
 const sem=project?.state?.semantic||{};
 const sections=sem.textWorkspaceV2?.sections||{};
 const direct=sections.direct?.byProfile||{};
 const profile=direct['iss-deluxe-plus']||Object.values(direct)[0]||{};
 const pre=sections.preKickoff?.values||{};
 const menu=sections.mainMenu?.values||{};
 const gfx=sections.graphicIntents?.values||{};

 for(const [id,value] of Object.entries(profile))setValue(`[data-profile-text="${CSS.escape(id)}"]`,value);
 for(const [id,value] of Object.entries(pre))setValue(`[data-pk-id="${CSS.escape(id)}"]`,value);
 for(const [id,value] of Object.entries(menu))setValue(`[data-mm-real="${CSS.escape(id)}"]`,value);
 for(const [id,value] of Object.entries(gfx)){
  setValue(`[data-gfx-intent="${CSS.escape(id)}"]`,value);
  if(id.startsWith('strategy.screen.v614.')){
   const suffix=id.slice('strategy.screen.v614.'.length);
   const node=document.getElementById('st612_'+suffix);if(node)node.value=String(value??'');
  }
  if(id.startsWith('__pk590.native.')){
   const pc=id.slice('__pk590.native.'.length);
   const node=document.getElementById('pk590_'+pc);if(node)node.value=String(value??'');
  }
 }

 const rawTitle=sem.romInternalTitle||sem.romInternalTitleDesired||'';
 const title=cleanTitle(rawTitle);
 if(title){
  const input=document.getElementById('romMetaTitle');if(input)input.value=title;
  const count=document.getElementById('romMetaTitleCount');if(count)count.textContent=String(title.length);
  const desired=document.getElementById('romMetaTitleDesired');if(desired)desired.value=String(sem.romInternalTitleDesired||rawTitle);
  window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=title;
  window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(sem.romInternalTitleDesired||rawTitle);
  try{window.__ISSSD_ROM_META_WRITE_TITLE__?.(title,'Título interno do projeto')}catch(_){}
 }
}

function hydrateProjectState(project){
 const sem=project?.state?.semantic||{};
 const ws=sem.textWorkspaceV2;
 if(ws?.sections){
  try{window.ISSSDTextWorkspace?.restore?.(clone(ws))}catch(e){console.warn('Git Bridge: restore textWorkspaceV2',e)}
  try{window.__ISSSD_PREKICK_TEXTS__?.restore?.(clone(ws.sections.preKickoff?.values||{}))}catch(e){console.warn('Git Bridge: restore pre-kickoff',e)}
  try{
   const direct=clone(ws.sections.direct?.byProfile||{});
   if(typeof window.studioTextProjectDrafts!=='undefined')window.studioTextProjectDrafts=direct;
  }catch(e){console.warn('Git Bridge: restore direct texts',e)}
  try{
   const pre=clone(ws.sections.preKickoff?.values||{});
   if(typeof window.preKickoffTextCommitted!=='undefined')window.preKickoffTextCommitted=clone(pre);
   if(typeof window.preKickoffTextDraft!=='undefined')window.preKickoffTextDraft=clone(pre);
  }catch(e){console.warn('Git Bridge: restore pre-kickoff mirrors',e)}
  try{
   const menu=clone(ws.sections.mainMenu?.values||{});
   if(Object.keys(menu).length){
    window.mainMenuCommittedDraft=clone(menu);
    window.mainMenuFb96Draft=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(clone(menu)):clone(menu);
    window.mainMenuProjectSaved=true;
   }
  }catch(e){console.warn('Git Bridge: restore main menu',e)}
  try{window.ISSSDTextIntentions?.restore?.(clone(ws.sections.graphicIntents?.values||{}))}catch(e){console.warn('Git Bridge: restore graphic intents',e)}
 }

 try{window.renderProfileTextEditor?.()}catch(_){}
 try{window.renderPreKickoffTextEditor?.()}catch(_){}
 try{window.renderMainMenuFb96Fields?.()}catch(_){}
 try{window.ISSSDTextWorkspace?.render?.()}catch(_){}
 try{window.ISSSDTextIntentions?.render?.()}catch(_){}
 try{window.ISSSDNativeTexts590?.install?.()}catch(_){}
 try{window.ISSSDGraphicCatalog591?.install?.()}catch(_){}

 hydrateDomFromProject(project);
}

function scheduleHydration(project){
 if(!project?.state?.semantic)return;
 lastAppliedProject=project;
 const gen=++hydrateGeneration;
 // Estes tempos começam APÓS studioApplyProjectWithBase terminar, não no momento
 // em que o usuário apenas escolhe o arquivo. Assim a seleção de alterações e
 // a restauração da ROM-base já terminaram antes de reidratar os formulários.
 for(const ms of [0,50,160,400,850,1500,2600])setTimeout(()=>{
  if(gen!==hydrateGeneration||lastAppliedProject!==project)return;
  hydrateProjectState(project);
 },ms);
}

function installLifecycleHook(){
 if(window.__ISSSD_GIT_PROJECT_LIFECYCLE_HOOK__)return;
 const apply=window.studioApplyProjectWithBase;
 if(typeof apply!=='function')return false;
 window.studioApplyProjectWithBase=async function(project,...rest){
  const result=await apply.call(this,project,...rest);
  scheduleHydration(project);
  return result;
 };
 window.__ISSSD_GIT_PROJECT_LIFECYCLE_HOOK__=true;
 return true;
}

function ensureLifecycleHook(){
 if(installLifecycleHook())return;
 let tries=0;
 const timer=setInterval(()=>{
  if(installLifecycleHook()||++tries>50)clearInterval(timer);
 },100);
}

function boot(){installBadge();ensureLifecycleHook()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
window.addEventListener('load',boot,{once:true});
