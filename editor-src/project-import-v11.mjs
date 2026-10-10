const V11='git-project-import-v11';
let currentProject=null;
let anyUserEdit=false;
const touched={direct:new Set(),pre:new Set(),menu:new Set(),gfx:new Set(),internalTitle:false,titleScreen:false};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const sem=p=>p?.state?.semantic||{};
const sections=p=>sem(p).textWorkspaceV2?.sections||{};
const esc=v=>window.CSS?.escape?CSS.escape(String(v)):String(v).replace(/[^A-Za-z0-9_-]/g,'\\$&');
const setValue=(selector,value)=>{for(const n of document.querySelectorAll(selector)){if('value'in n)n.value=String(value??'')}};
const setId=(id,value)=>{const n=document.getElementById(id);if(n&&'value'in n)n.value=String(value??'');return n};
function directProfile(p){const by=sections(p).direct?.byProfile||{};return by['iss-deluxe-plus']||Object.values(by)[0]||{}}
function hydrateDom(p){
 if(!p)return;
 const s=sem(p),sec=sections(p),direct=directProfile(p),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [k,v] of Object.entries(direct))if(!touched.direct.has(k)){
   setValue(`[data-profile-text="${esc(k)}"]`,v);const n=setId('gm610_'+k,v),c=document.getElementById('gm610c_'+k);if(n&&c)c.textContent=String(v??'').length+'/'+(n.maxLength||String(v??'').length);
 }
 for(const [k,v] of Object.entries(pre))if(!touched.pre.has(k)){
   setValue(`[data-pk-id="${esc(k)}"]`,v);const n=setId('pk_'+k,v),c=document.getElementById('pkc_'+k);if(n&&c)c.textContent=String(v??'').length+'/'+(n.maxLength||String(v??'').length);
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
   if(title){setId('romMetaTitle',title);setId('romMetaTitleDesired',String(s.romInternalTitleDesired||title));const c=document.getElementById('romMetaTitleCount');if(c)c.textContent=String(title.length);const st=document.getElementById('romMetaTitleImplementStatus');if(st){st.textContent='Implementado';st.className='badge ok'}}
 }
}
function applyFull(p){
 if(!p)return;
 try{window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(p)}catch(e){console.error('V11 reapply',e)}
 hydrateDom(p);
 try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(_){}
}
function scheduleHydration(){if(!currentProject)return;queueMicrotask(()=>hydrateDom(currentProject));setTimeout(()=>hydrateDom(currentProject),40)}
function markTouched(t){
 if(!t)return;
 let k;
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
const previousAfterOpen=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){
 try{await previousAfterOpen?.(file)}catch(e){console.warn('V11 previous import hook',e)}
 try{currentProject=JSON.parse(await file.text())}catch(e){console.error('V11 project parse',e);return}
 anyUserEdit=false;for(const s of [touched.direct,touched.pre,touched.menu,touched.gfx])s.clear();touched.internalTitle=false;touched.titleScreen=false;
 applyFull(currentProject);
 for(const ms of [80,220,560,1100])setTimeout(()=>{if(!anyUserEdit)applyFull(currentProject);else hydrateDom(currentProject)},ms);
 window.ISSSDLog?.add?.('Projetos','info','V11: projeto reaplicado e campos visíveis sincronizados',{build:V11});
};
document.addEventListener('input',e=>markTouched(e.target),true);
document.addEventListener('change',e=>{if(e.target?.id!=='projectFile')markTouched(e.target)},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('.navbtn[data-page], [data-page]'))setTimeout(scheduleHydration,0)},true);
const mo=new MutationObserver(()=>scheduleHydration());
if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
const badge=document.getElementById('isssdGitBridgeBadge');if(badge){badge.textContent='Git Visual Bridge v11';badge.title='Importação determinística com reidratação de campos após renderização.'}
window.__ISSSD_GIT_PROJECT_IMPORT_V11__={build:V11,getProject:()=>clone(currentProject),hydrate:()=>currentProject&&hydrateDom(currentProject)};
