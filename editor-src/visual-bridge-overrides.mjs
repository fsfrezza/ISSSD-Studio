const BUILD='git-visual-bridge-v5-auto-project-hydration';
window.__ISSSD_GIT_VISUAL_BRIDGE__={build:BUILD,loadedAt:new Date().toISOString()};

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const cleanTitle=v=>String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
let rawSelectedProject=null;
let confirmedProject=null;
let lifecycleConfirmed=false;
let hydrateGeneration=0;

function installBadge(){
 if(document.getElementById('isssdGitBridgeBadge'))return;
 const status=document.querySelector('.statusbar');
 if(!status)return;
 const badge=document.createElement('span');
 badge.id='isssdGitBridgeBadge';badge.className='badge ok';badge.textContent='Git Visual Bridge v5';
 badge.title='Interface gerada automaticamente por npm run editor.';status.appendChild(badge);
}
function setValue(selector,value){for(const node of document.querySelectorAll(selector))if('value' in node)node.value=String(value??'')}
function firstValue(selector){const n=document.querySelector(selector);return n&&'value' in n?String(n.value??''):'<campo ausente>'}
function sem(project){return project?.state?.semantic||{}}
function sections(project){return sem(project).textWorkspaceV2?.sections||{}}
function plusProfile(project){const by=sections(project).direct?.byProfile||{};return by['iss-deluxe-plus']||Object.values(by)[0]||{}}

function hydrateDom(project){
 const s=sem(project),sec=sections(project),profile=plusProfile(project),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [id,v] of Object.entries(profile))setValue(`[data-profile-text="${CSS.escape(id)}"]`,v);
 for(const [id,v] of Object.entries(pre))setValue(`[data-pk-id="${CSS.escape(id)}"]`,v);
 for(const [id,v] of Object.entries(menu))setValue(`[data-mm-real="${CSS.escape(id)}"]`,v);
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
  try{window.__ISSSD_PREKICK_TEXTS__?.restore?.(clone(sec.preKickoff?.values||{}))}catch(_){}
  try{window.ISSSDTextIntentions?.restore?.(clone(sec.graphicIntents?.values||{}))}catch(_){}
  try{
   const menu=clone(sec.mainMenu?.values||{});
   window.mainMenuCommittedDraft=clone(menu);
   window.mainMenuFb96Draft=window.mainMenuCanonicalizeDraft?window.mainMenuCanonicalizeDraft(clone(menu)):clone(menu);
   window.mainMenuProjectSaved=true;
  }catch(_){}
 }
 try{window.renderProfileTextEditor?.()}catch(_){}
 try{window.renderPreKickoffTextEditor?.()}catch(_){}
 try{window.renderMainMenuFb96Fields?.()}catch(_){}
 try{window.ISSSDTextWorkspace?.render?.()}catch(_){}
 try{window.ISSSDTextIntentions?.render?.()}catch(_){}
 try{window.ISSSDNativeTexts590?.install?.()}catch(_){}
 hydrateDom(project);
}

function scheduleHydration(project,reason){
 if(!project?.state?.semantic)return;
 confirmedProject=project;lifecycleConfirmed=true;
 const gen=++hydrateGeneration;
 for(const ms of [0,80,220,500,1000,1800,3000])setTimeout(()=>{
  if(gen!==hydrateGeneration)return;
  hydrateState(project);renderDiagnostic(reason);
 },ms);
}

function diagRow(label,fileValue,stateValue,domValue){
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const ok=String(fileValue??'')===String(domValue??'');
 return `<tr><td>${esc(label)}</td><td><code>${esc(fileValue)}</code></td><td><code>${esc(stateValue)}</code></td><td><code>${esc(domValue)}</code></td><td>${ok?'OK':'DIVERGE'}</td></tr>`;
}
function ensureDiagnostic(){
 let p=document.getElementById('isssdProjectHydrationDiagnostic');if(p)return p;
 p=document.createElement('section');p.id='isssdProjectHydrationDiagnostic';p.className='card';p.style='margin:12px;position:relative;z-index:5';
 const host=document.querySelector('#page-dashboard .rom-content')||document.querySelector('main')||document.body;host.prepend(p);return p;
}
function renderDiagnostic(reason='aguardando'){
 const p=ensureDiagnostic(),project=confirmedProject||rawSelectedProject;
 if(!project){p.innerHTML='<h3>Diagnóstico do projeto</h3><div class="note info">Nenhum .issdproj capturado nesta sessão.</div>';return}
 const sec=sections(project),fileProfile=plusProfile(project),filePre=sec.preKickoff?.values||{},fileMenu=sec.mainMenu?.values||{},fileGfx=sec.graphicIntents?.values||{};
 let snap={};try{snap=window.ISSSDTextWorkspace?.snapshot?.()?.sections||{}}catch(_){}
 const stateProfile=snap.direct?.byProfile?.['iss-deluxe-plus']||{},statePre=snap.preKickoff?.values||{},stateMenu=snap.mainMenu?.values||{},stateGfx=snap.graphicIntents?.values||{};
 const rows=[
  diagRow('Título interno',sem(project).romInternalTitle||'',window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__||'',firstValue('#romMetaTitle')),
  diagRow('Modo/JOGATINA',fileProfile.friendly||'',stateProfile.friendly||'',firstValue('[data-profile-text="friendly"]')),
  diagRow('Pré-kickoff/Formação',filePre.formation||'',statePre.formation||'',firstValue('[data-pk-id="formation"]')),
  diagRow('Menu/JOGATINA',fileMenu.openGame||'',stateMenu.openGame||'',firstValue('[data-mm-real="openGame"]')),
  diagRow('Estratégia/Todos ao ataque',fileGfx['strategy.screen.v614.alloutatk']||'',stateGfx['strategy.screen.v614.alloutatk']||'',firstValue('#st612_alloutatk'))
 ].join('');
 p.innerHTML=`<div class="sectionbar"><div><h3>Diagnóstico do projeto</h3><div class="subtle">Lifecycle confirmado: <strong>${lifecycleConfirmed?'SIM':'NÃO'}</strong> · ${reason} · ${BUILD}</div></div><button class="btn primary" id="isssdForceHydrate">Aplicar dados do projeto aos campos</button></div><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>Campo</th><th>Arquivo .issdproj</th><th>Estado interno</th><th>Campo visível</th><th>Resultado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
 p.querySelector('#isssdForceHydrate').onclick=()=>{hydrateState(project);renderDiagnostic('aplicação manual solicitada')};
}

async function captureProjectFile(file){
 try{rawSelectedProject=JSON.parse(await file.text());renderDiagnostic('arquivo selecionado')}catch(e){console.error('Git Bridge: leitura do projeto',e)}
}
function installProjectCapture(){
 if(document.documentElement.dataset.gitProjectCapture==='1')return;
 document.documentElement.dataset.gitProjectCapture='1';
 document.addEventListener('change',e=>{if(e.target?.id==='projectFile'){const f=e.target.files?.[0];if(f)captureProjectFile(f)}},true);
}

// Reliable lifecycle hook: projectFile's own handler awaits studioImportProject().
// Wrapping that exact function means hydration begins only after the real import,
// base validation and studioApplyProjectWithBase have all completed.
function hookProjectImport(){
 const current=window.studioImportProject;
 if(typeof current!=='function')return false;
 if(current.__gitAutoHydration)return true;
 const wrapped=async function(file,...rest){
  let project=rawSelectedProject;
  if(!project&&file){try{project=JSON.parse(await file.text())}catch(_){}}
  const result=await current.call(this,file,...rest);
  if(project)scheduleHydration(project,'studioImportProject concluído');
  return result;
 };
 wrapped.__gitAutoHydration=true;
 window.studioImportProject=wrapped;
 return true;
}
function ensureProjectImportHook(){
 if(hookProjectImport())return;
 let n=0;const t=setInterval(()=>{if(hookProjectImport()||++n>120)clearInterval(t)},100);
}

function boot(){installBadge();installProjectCapture();ensureProjectImportHook();setTimeout(()=>renderDiagnostic(),300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('load',()=>{installBadge();ensureProjectImportHook();renderDiagnostic()}, {once:true});
