const BUILD='git-visual-bridge-v6-canonical-text-sync';
window.__ISSSD_GIT_VISUAL_BRIDGE__={build:BUILD,loadedAt:new Date().toISOString()};

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cleanTitle=v=>String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
let rawSelectedProject=null;
let confirmedProject=null;
let lifecycleConfirmed=false;
let hydrateGeneration=0;

function installBadge(){
 if(document.getElementById('isssdGitBridgeBadge'))return;
 const status=document.querySelector('.statusbar');if(!status)return;
 const badge=document.createElement('span');badge.id='isssdGitBridgeBadge';badge.className='badge ok';badge.textContent='Git Visual Bridge v6';badge.title='Interface gerada automaticamente por npm run editor.';status.appendChild(badge);
}
function setValue(selector,value){for(const node of document.querySelectorAll(selector))if('value' in node)node.value=String(value??'')}
function firstValue(selector){const n=document.querySelector(selector);return n&&'value' in n?String(n.value??''):'<campo ausente>'}
function sem(project){return project?.state?.semantic||{}}
function sections(project){return sem(project).textWorkspaceV2?.sections||{}}
function plusProfile(project){const by=sections(project).direct?.byProfile||{};return by['iss-deluxe-plus']||Object.values(by)[0]||{}}
function fieldRecord(selector,keyFn){const out={};for(const n of document.querySelectorAll(selector)){const k=keyFn(n);if(k)out[k]=String(n.value??'')}return out}

function hydrateDom(project){
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
  try{window.__ISSSD_ROM_META_WRITE_TITLE__?.(title,'Título interno do projeto')}catch(_){}
 }
}

function hydrateState(project){
 const sec=sections(project),ws=sem(project).textWorkspaceV2;
 if(ws?.sections){
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
 }
 try{window.renderProfileTextEditor?.()}catch(_){}
 try{window.renderPreKickoffTextEditor?.()}catch(_){}
 try{window.renderMainMenuFb96Fields?.()}catch(_){}
 try{window.renderAll?.()}catch(_){}
 try{window.ISSSDTextWorkspace?.render?.()}catch(_){}
 try{window.ISSSDTextIntentions?.render?.()}catch(_){}
 try{window.ISSSDNativeTexts590?.install?.()}catch(_){}
 hydrateDom(project);
}

function syncLiveTextStateBeforeSave(){
 const api=window.ISSSDTextWorkspace;if(!api?.snapshot||!api?.restore)return;
 const ws=clone(api.snapshot());const sec=ws.sections||(ws.sections={});
 sec.direct=sec.direct||{byProfile:{}};sec.direct.byProfile=sec.direct.byProfile||{};
 sec.preKickoff=sec.preKickoff||{values:{}};sec.preKickoff.values=sec.preKickoff.values||{};
 sec.mainMenu=sec.mainMenu||{values:{}};sec.mainMenu.values=sec.mainMenu.values||{};
 sec.graphicIntents=sec.graphicIntents||{values:{}};sec.graphicIntents.values=sec.graphicIntents.values||{};
 sec.title=sec.title||{values:{}};sec.title.values=sec.title.values||{};

 const profileId=window.activeRomProfile?.id||'iss-deluxe-plus';
 const direct=fieldRecord('[data-profile-text]',n=>n.dataset.profileText);
 if(Object.keys(direct).length)sec.direct.byProfile[profileId]={...(sec.direct.byProfile[profileId]||{}),...direct};

 const pre=fieldRecord('[data-pk-id]',n=>n.dataset.pkId);
 if(Object.keys(pre).length)sec.preKickoff.values={...sec.preKickoff.values,...pre};

 let menu=clone(window.mainMenuFb96Draft||sec.mainMenu.values||{});
 const real=fieldRecord('[data-mm-real]',n=>n.dataset.mmReal);
 const legacy=fieldRecord('[data-mainmenu-fb96]',n=>n.dataset.mainmenuFb96);
 if(Object.keys(real).length)menu={...menu,...real};else if(Object.keys(legacy).length)menu={...menu,...legacy};
 menu=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(menu):menu;
 sec.mainMenu.values=clone(menu);window.mainMenuFb96Draft=clone(menu);window.mainMenuCommittedDraft=clone(menu);window.mainMenuProjectSaved=true;

 let gfx=clone(window.ISSSDTextIntentions?.draftSnapshot?.()||window.ISSSDTextIntentions?.snapshot?.()||sec.graphicIntents.values||{});
 Object.assign(gfx,fieldRecord('[data-gfx-intent]',n=>n.dataset.gfxIntent));
 for(const n of document.querySelectorAll('[id^="st612_"]')){if(n.tagName==='INPUT')gfx['strategy.screen.v614.'+n.id.slice('st612_'.length)]=String(n.value??'')}
 for(const n of document.querySelectorAll('[id^="pk590_"]')){if(n.tagName==='INPUT')gfx['__pk590.native.'+n.id.slice('pk590_'.length)]=String(n.value??'')}
 sec.graphicIntents.values=gfx;

 window.studioTextProjectDrafts=clone(sec.direct.byProfile);
 try{window.__ISSSD_PREKICK_TEXTS__?.restore?.(clone(sec.preKickoff.values))}catch(_){}
 try{window.ISSSDTextIntentions?.restore?.(clone(gfx));window.ISSSDTextIntentions?.commitAll?.()}catch(_){}
 api.restore(ws);

 const titleInput=document.getElementById('romMetaTitle');if(titleInput){const t=cleanTitle(titleInput.value);window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=t;window.__ISSSD_INTERNAL_TITLE_DESIRED__=String(document.getElementById('romMetaTitleDesired')?.value||t)}
}
window.__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__=syncLiveTextStateBeforeSave;

function scheduleHydration(project,reason){
 if(!project?.state?.semantic)return;confirmedProject=project;lifecycleConfirmed=true;const gen=++hydrateGeneration;
 for(const ms of [0,80,220,500,1000,1800,3000])setTimeout(()=>{if(gen!==hydrateGeneration)return;hydrateState(project);renderDiagnostic(reason)},ms);
}
window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){
 let project=rawSelectedProject;if(!project&&file){try{project=JSON.parse(await file.text())}catch(_){}}
 if(project)scheduleHydration(project,'abertura concluída');
};

function diagRow(label,fileValue,stateValue,domValue){const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const ok=String(fileValue??'')===String(domValue??'');return `<tr><td>${esc(label)}</td><td><code>${esc(fileValue)}</code></td><td><code>${esc(stateValue)}</code></td><td><code>${esc(domValue)}</code></td><td>${ok?'OK':'DIVERGE'}</td></tr>`}
function ensureDiagnostic(){let p=document.getElementById('isssdProjectHydrationDiagnostic');if(p)return p;p=document.createElement('section');p.id='isssdProjectHydrationDiagnostic';p.className='card';p.style='margin:12px;position:relative;z-index:5';const host=document.querySelector('#page-dashboard .rom-content')||document.querySelector('main')||document.body;host.prepend(p);return p}
function renderDiagnostic(reason='aguardando'){
 const p=ensureDiagnostic(),project=confirmedProject||rawSelectedProject;if(!project){p.innerHTML='<h3>Diagnóstico do projeto</h3><div class="note info">Nenhum .issdproj capturado nesta sessão.</div>';return}
 const sec=sections(project),fileProfile=plusProfile(project),filePre=sec.preKickoff?.values||{},fileMenu=sec.mainMenu?.values||{},fileGfx=sec.graphicIntents?.values||{};let snap={};try{snap=window.ISSSDTextWorkspace?.snapshot?.()?.sections||{}}catch(_){}
 const stateProfile=snap.direct?.byProfile?.['iss-deluxe-plus']||{},statePre=snap.preKickoff?.values||{},stateMenu=snap.mainMenu?.values||{},stateGfx=snap.graphicIntents?.values||{};
 const rows=[diagRow('Título interno',sem(project).romInternalTitle||'',window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__||'',firstValue('#romMetaTitle')),diagRow('Modo/JOGATINA',fileProfile.friendly||'',stateProfile.friendly||'',firstValue('[data-profile-text="friendly"]')),diagRow('Pré-kickoff/Formação',filePre.formation||'',statePre.formation||'',firstValue('[data-pk-id="formation"]')),diagRow('Menu/JOGATINA',fileMenu.openGame||'',stateMenu.openGame||'',firstValue('[data-mm-real="openGame"]')),diagRow('Estratégia/Todos ao ataque',fileGfx['strategy.screen.v614.alloutatk']||'',stateGfx['strategy.screen.v614.alloutatk']||'',firstValue('#st612_alloutatk'))].join('');
 p.innerHTML=`<div class="sectionbar"><div><h3>Diagnóstico do projeto</h3><div class="subtle">Lifecycle confirmado: <strong>${lifecycleConfirmed?'SIM':'NÃO'}</strong> · ${reason} · ${BUILD}</div></div><button class="btn primary" id="isssdForceHydrate">Aplicar dados do projeto aos campos</button></div><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Campo</th><th>Arquivo .issdproj</th><th>Estado interno</th><th>Campo visível</th><th>Resultado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
 p.querySelector('#isssdForceHydrate').onclick=()=>{hydrateState(project);renderDiagnostic('aplicação manual solicitada')};
}
async function captureProjectFile(file){try{rawSelectedProject=JSON.parse(await file.text());renderDiagnostic('arquivo selecionado')}catch(e){console.error('Git Bridge: leitura do projeto',e)}}
function installProjectCapture(){if(document.documentElement.dataset.gitProjectCapture==='1')return;document.documentElement.dataset.gitProjectCapture='1';document.addEventListener('change',e=>{if(e.target?.id==='projectFile'){const f=e.target.files?.[0];if(f)captureProjectFile(f)}},true)}
function boot(){installBadge();installProjectCapture();setTimeout(()=>renderDiagnostic(),300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('load',()=>{installBadge();renderDiagnostic()},{once:true});
