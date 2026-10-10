const V11='git-project-import-v12-screen-texts';
let currentProject=null;
let anyUserEdit=false;
let screenTextsBaseline={schema:'isssd-screen-texts-v1',values:{}};
const touched={direct:new Set(),pre:new Set(),menu:new Set(),gfx:new Set(),screen:new Set(),internalTitle:false,titleScreen:false};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const sem=p=>p?.state?.semantic||{};
const sections=p=>sem(p).textWorkspaceV2?.sections||{};
const esc=v=>window.CSS?.escape?CSS.escape(String(v)):String(v).replace(/[^A-Za-z0-9_-]/g,'\\$&');
const setValue=(selector,value)=>{const next=String(value??'');for(const n of document.querySelectorAll(selector)){if('value'in n&&n.value!==next)n.value=next}};
const setId=(id,value)=>{const n=document.getElementById(id),next=String(value??'');if(n&&'value'in n&&n.value!==next)n.value=next;return n};
const setText=(n,value)=>{if(!n)return;const next=String(value??'');if(n.textContent!==next)n.textContent=next};
function directProfile(p){const by=sections(p).direct?.byProfile||{};return by['iss-deluxe-plus']||Object.values(by)[0]||{}}
function normalizeMainMenuColorUi(){
 const grid=document.getElementById('mmColorGrid');if(!grid)return;
 const card=grid.closest('.card');if(!card)return;
 const title=card.querySelector('.sectionbar h3');setText(title,'Cores do Menu Principal');
 const sub=card.querySelector('.sectionbar .subtle');setText(sub,'Edite as paletas 1P e 2P, visualize o resultado e aplique as cores à ROM Plus. Estes valores também são preservados no projeto.');
 const old=document.querySelector('#page-main-menu .mainmenu-appearance, #page-texts .mainmenu-appearance');if(old&&old.style.display!=='none')old.style.display='none';
}

// v12 — cada texto pertence a uma tela. A interface pode mudar de aba sem perder o
// estado: o .issdproj guarda uma cópia canônica por proprietário em screenTextsV1.
function blankScreenTexts(){return {schema:'isssd-screen-texts-v1',values:{}}}
function screenKey(owner,field){return `${owner}.${field}`}
function putScreen(state,owner,field,value){
 if(!owner||!field)return;
 state.values[owner]||(state.values[owner]={});
 state.values[owner][field]=String(value??'');
}
function getScreen(state,owner,field){return state?.values?.[owner]?.[field]}
function readScreenNode(node){
 if(!node||!('value'in node))return null;
 if(node.matches?.('[data-screen-text-owner][data-screen-text-field]'))return {owner:node.dataset.screenTextOwner,field:node.dataset.screenTextField,value:node.value};
 if(node.id?.startsWith('gm610_')&&!node.id.startsWith('gm610c_'))return {owner:'game-modes',field:node.id.slice(6),value:node.value};
 if(node.matches?.('[data-pk-id]'))return {owner:'match-options',field:node.dataset.pkId,value:node.value};
 if(node.matches?.('[data-mm-real]'))return {owner:'main-menu',field:node.dataset.mmReal,value:node.value};
 if(node.id?.startsWith('st612_'))return {owner:'strategies',field:node.id.slice(6),value:node.value};
 if(node.id?.startsWith('tx621_'))return {owner:'controls',field:node.id.slice(6),value:node.value};
 if(node.id==='romMetaTitle'||node.id==='romMetaTitleDesired')return {owner:'title-screen',field:'rom-internal-title',value:node.value};
 return null;
}
function captureScreenTexts(base=screenTextsBaseline){
 const out=clone(base)||blankScreenTexts();out.schema='isssd-screen-texts-v1';out.values=out.values||{};
 document.querySelectorAll('[data-screen-text-owner][data-screen-text-field],[id^="gm610_"],[data-pk-id],[data-mm-real],[id^="st612_"],[id^="tx621_"],#romMetaTitle,#romMetaTitleDesired').forEach(node=>{
  if(node.id?.startsWith('gm610c_'))return;
  const x=readScreenNode(node);if(x)putScreen(out,x.owner,x.field,x.value);
 });
 return out;
}
function legacyScreenTexts(p){
 const out=blankScreenTexts(),sec=sections(p),direct=directProfile(p),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [k,v] of Object.entries(direct))putScreen(out,'game-modes',k,v);
 for(const [k,v] of Object.entries(pre))putScreen(out,'match-options',k,v);
 for(const [k,v] of Object.entries(menu))putScreen(out,'main-menu',k,v);
 for(const [k,v] of Object.entries(gfx)){
  if(k.startsWith('strategy.screen.v614.'))putScreen(out,'strategies',k.slice('strategy.screen.v614.'.length),v);
  if(k.startsWith('controller.'))putScreen(out,'controls',k.slice('controller.'.length),v);
 }
 const title=String(sem(p).romInternalTitle||sem(p).romInternalTitleDesired||'');if(title)putScreen(out,'title-screen','rom-internal-title',title);
 return out;
}
function projectScreenTexts(p){const x=sem(p).screenTextsV1;return x?.schema==='isssd-screen-texts-v1'?clone(x):legacyScreenTexts(p)}
function hydrateScreenTexts(p){
 const state=projectScreenTexts(p);
 for(const [owner,fields] of Object.entries(state.values||{}))for(const [field,value] of Object.entries(fields||{})){
  if(touched.screen.has(screenKey(owner,field)))continue;
  setValue(`[data-screen-text-owner="${esc(owner)}"][data-screen-text-field="${esc(field)}"]`,value);
  if(owner==='game-modes')setId('gm610_'+field,value);
  else if(owner==='match-options')setValue(`[data-pk-id="${esc(field)}"]`,value);
  else if(owner==='main-menu')setValue(`[data-mm-real="${esc(field)}"]`,value);
  else if(owner==='strategies')setId('st612_'+field,value);
  else if(owner==='controls')setId('tx621_'+field,value);
  else if(owner==='title-screen'&&field==='rom-internal-title'){setId('romMetaTitle',value);setId('romMetaTitleDesired',value)}
 }
}

function activatePage(pageId,button){
 document.querySelectorAll('section.page').forEach(p=>p.classList.toggle('active',p.id===pageId));
 document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b===button));
}
function makeNavButton(id,page,label,icon){
 let b=document.getElementById(id);if(b)return b;
 b=document.createElement('button');b.className='navbtn';b.type='button';b.id=id;b.dataset.page=page;b.innerHTML=`<span class="navico">${icon}</span><span>${label}</span><i class="navdot"></i>`;
 b.addEventListener('click',()=>activatePage('page-'+page,b));return b;
}
function ensureScreenPage(id,title,description){
 let page=document.getElementById('page-'+id);if(page)return page;
 const content=document.querySelector('.content');if(!content)return null;
 page=document.createElement('section');page.className='page';page.id='page-'+id;
 page.innerHTML=`<div class="pagehead"><div><h2>${title}</h2><p>${description}</p></div></div><div class="rom-content"><div id="${id}ScreenHost"></div></div>`;
 const before=document.getElementById('page-texts')||document.getElementById('page-main-menu');content.insertBefore(page,before||null);return page;
}
function installScreenOwnedUi(){
 const navTexts=document.getElementById('nav-texts');
 if(navTexts){
  const group=navTexts.parentElement;
  const match=makeNavButton('nav-match-options','match-options','Opções da partida','▦');
  const controls=makeNavButton('nav-controls','controls','Controles','⌨');
  if(group){if(!match.parentElement)group.insertBefore(match,navTexts);if(!controls.parentElement)group.insertBefore(controls,navTexts)}
  if(navTexts.style.display!=='none')navTexts.style.display='none';
 }
 ensureScreenPage('match-options','Opções da partida','Formação, substituições, estratégia, marcação, dados e início da partida. Textos e gráficos desta tela ficam somente aqui.');
 ensureScreenPage('controls','Controles','Configuração dos botões e inscrições gráficas da tela de controles.');
 const pk=document.getElementById('preKickoffTextPanel'),pkHost=document.getElementById('match-optionsScreenHost');if(pk&&pkHost&&pk.parentElement!==pkHost)pkHost.appendChild(pk);
 const ctrl=document.querySelector('[data-pane="controller"]'),ctrlHost=document.getElementById('controlsScreenHost');if(ctrl&&ctrlHost&&ctrl.parentElement!==ctrlHost){ctrl.classList.add('active');ctrl.style.display='block';ctrlHost.appendChild(ctrl)}
}

function hydrateDom(p){
 if(!p)return;
 const s=sem(p),sec=sections(p),direct=directProfile(p),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [k,v] of Object.entries(direct))if(!touched.direct.has(k)){
   setValue(`[data-profile-text="${esc(k)}"]`,v);const n=setId('gm610_'+k,v),c=document.getElementById('gm610c_'+k);if(n&&c)setText(c,String(v??'').length+'/'+(n.maxLength||String(v??'').length));
 }
 for(const [k,v] of Object.entries(pre))if(!touched.pre.has(k)){
   setValue(`[data-pk-id="${esc(k)}"]`,v);const n=setId('pk_'+k,v),c=document.getElementById('pkc_'+k);if(n&&c)setText(c,String(v??'').length+'/'+(n.maxLength||String(v??'').length));
 }
 for(const [k,v] of Object.entries(menu))if(!touched.menu.has(k)){
   setValue(`[data-mm-real="${esc(k)}"]`,v);setValue(`[data-mainmenu-fb96="${esc(k)}"]`,v);
 }
 for(const [k,v] of Object.entries(gfx))if(!touched.gfx.has(k)){
   setValue(`[data-gfx-intent="${esc(k)}"]`,v);
   if(k.startsWith('strategy.screen.v614.'))setId('st612_'+k.slice('strategy.screen.v614.'.length),v);
   if(k.startsWith('__pk590.native.'))setId('pk590_'+k.slice('__pk590.native.'.length),v);
 }
 if(!touched.internalTitle){
   const title=String(s.romInternalTitle||s.romInternalTitleDesired||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
   if(title){setId('romMetaTitle',title);setId('romMetaTitleDesired',String(s.romInternalTitleDesired||title));setText(document.getElementById('romMetaTitleCount'),String(title.length));const st=document.getElementById('romMetaTitleImplementStatus');if(st){setText(st,'Implementado');st.className='badge ok'}}
 }
 hydrateScreenTexts(p);installScreenOwnedUi();
}
function applyFull(p){
 if(!p)return;
 try{window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(p)}catch(e){console.error('V11 reapply',e)}
 hydrateDom(p);
 try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(_){}
}
let hydrateTimer=0,uiTimer=0;
function scheduleHydration(){if(!currentProject)return;clearTimeout(hydrateTimer);hydrateTimer=setTimeout(()=>hydrateDom(currentProject),20)}
function scheduleUi(){clearTimeout(uiTimer);uiTimer=setTimeout(installScreenOwnedUi,30)}
function markTouched(t){
 if(!t)return;
 let k;
 const sx=readScreenNode(t);if(sx)touched.screen.add(screenKey(sx.owner,sx.field));
 if(t.matches?.('[data-profile-text]')){k=t.dataset.profileText;if(k)touched.direct.add(k)}
 if(t.id?.startsWith('gm610_')&&!t.id.startsWith('gm610c_')){k=t.id.slice(6);if(k)touched.direct.add(k)}
 if(t.matches?.('[data-pk-id]')){k=t.dataset.pkId;if(k)touched.pre.add(k)}
 if(t.id?.startsWith('pk_')&&!t.id.startsWith('pkc_')){k=t.id.slice(3);if(k)touched.pre.add(k)}
 if(t.matches?.('[data-mm-real]')){k=t.dataset.mmReal;if(k)touched.menu.add(k)}
 if(t.matches?.('[data-mainmenu-fb96]')){k=t.dataset.mainmenuFb96;if(k)touched.menu.add(k)}
 if(t.matches?.('[data-gfx-intent]')){k=t.dataset.gfxIntent;if(k)touched.gfx.add(k)}
 if(t.id?.startsWith('st612_'))touched.gfx.add('strategy.screen.v614.'+t.id.slice(6));
 if(t.id?.startsWith('pk590_'))touched.gfx.add('__pk590.native.'+t.id.slice(6));
 if(t.id==='romMetaTitle'||t.id==='romMetaTitleDesired')touched.internalTitle=true;
 if(t.closest?.('#page-title-screen'))touched.titleScreen=true;
 anyUserEdit=true;
}

const priorFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){
 try{priorFinalize?.(obj)}catch(e){console.warn('V12 previous project finalizer',e)}
 if(!obj?.state)return obj;obj.state.semantic||(obj.state.semantic={});
 const baseline=currentProject?projectScreenTexts(currentProject):screenTextsBaseline;
 const captured=captureScreenTexts(baseline);obj.state.semantic.screenTextsV1=captured;screenTextsBaseline=clone(captured);
 window.ISSSDLog?.add?.('Projetos','info','Textos por tela anexados ao projeto',{screens:Object.keys(captured.values||{}).length,fields:Object.values(captured.values||{}).reduce((n,x)=>n+Object.keys(x||{}).length,0)});
 return obj;
};

const previousAfterOpen=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){
 try{await previousAfterOpen?.(file)}catch(e){console.warn('V11 previous import hook',e)}
 try{currentProject=JSON.parse(await file.text())}catch(e){console.error('V11 project parse',e);return}
 screenTextsBaseline=projectScreenTexts(currentProject);
 anyUserEdit=false;for(const s of [touched.direct,touched.pre,touched.menu,touched.gfx,touched.screen])s.clear();touched.internalTitle=false;touched.titleScreen=false;
 applyFull(currentProject);normalizeMainMenuColorUi();installScreenOwnedUi();
 for(const ms of [80,220,560,1100])setTimeout(()=>{if(!anyUserEdit)applyFull(currentProject);else hydrateDom(currentProject)},ms);
 window.ISSSDLog?.add?.('Projetos','info','V12: projeto reaplicado com textos por tela sincronizados',{build:V11,screens:Object.keys(screenTextsBaseline.values||{}).length});
};
document.addEventListener('input',e=>markTouched(e.target),true);
document.addEventListener('change',e=>{if(e.target?.id!=='projectFile')markTouched(e.target)},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('.navbtn[data-page], [data-page]'))setTimeout(()=>{scheduleHydration();scheduleUi();normalizeMainMenuColorUi()},0)},true);
const mo=new MutationObserver(()=>{scheduleHydration();scheduleUi()});
if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{normalizeMainMenuColorUi();installScreenOwnedUi()},{once:true});else{normalizeMainMenuColorUi();installScreenOwnedUi()}
setTimeout(()=>{normalizeMainMenuColorUi();installScreenOwnedUi()},250);setTimeout(()=>{normalizeMainMenuColorUi();installScreenOwnedUi()},900);
const badge=document.getElementById('isssdGitBridgeBadge');if(badge){badge.textContent='Git Visual Bridge v12';badge.title='Persistência canônica por tela, sem duplicação de campos.'}
window.__ISSSD_SCREEN_TEXTS_V1__={schema:'isssd-screen-texts-v1',capture:()=>captureScreenTexts(),hydrate:()=>currentProject&&hydrateScreenTexts(currentProject),get:()=>clone(screenTextsBaseline),installScreenOwnedUi};
window.__ISSSD_GIT_PROJECT_IMPORT_V11__={build:V11,getProject:()=>clone(currentProject),hydrate:()=>currentProject&&hydrateDom(currentProject),normalizeMainMenuColorUi,installScreenOwnedUi};
