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
 try{window.__ISSSD_MAIN_MENU_COLORS_V12__?.applyProjectColors?.(p)}catch(_){}
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

// v12 — reimplementa edição explícita das paletas do Menu Principal para Plus.
(()=>{
 const BUILD='git-main-menu-colors-v12';
 const DEFAULT={p1Bg:'#245b96',p1Button:'#2e70b8',p1Selected:'#3f86d2',p1Border:'#b9d9ff',p2Bg:'#9a416f',p2Button:'#bd5d8e',p2Selected:'#d878a9',p2Border:'#ffd0e7',text:'#ffffff'};
 const LABELS={p1Bg:'Fundo 1P',p1Button:'Botão 1P',p1Selected:'Selecionado 1P',p1Border:'Contorno 1P',p2Bg:'Fundo 2P',p2Button:'Botão 2P',p2Selected:'Selecionado 2P',p2Border:'Contorno 2P',text:'Texto dos botões'};
 let importedProject=null;
 const live=()=>({...DEFAULT,...(window.mainMenuColors||{})});
 function assign(v,dirty=true){window.mainMenuColors={...DEFAULT,...v};window.mainMenuProjectSaved=false;if(dirty)window.studioMainMenuMarkColorsDirty?.()}
 function draw(){const card=document.getElementById('gitMainMenuColorsV12');if(!card)return;const c=live();for(const k of Object.keys(LABELS)){const i=card.querySelector(`[data-mm-v12="${k}"]`),x=card.querySelector(`[data-mm-v12-hex="${k}"]`);if(i&&document.activeElement!==i)i.value=c[k];if(x)x.textContent=c[k].toUpperCase()}const h=document.getElementById('gitMmColorPreview');if(!h)return;h.innerHTML='';const labels=window.mainMenuFb96Draft||{};for(const side of ['p1','p2']){const p=document.createElement('div');p.style.cssText=`padding:12px;border:2px solid ${c[side+'Border']};border-radius:10px;background:${c[side+'Bg']};min-width:0`;const t=document.createElement('strong');t.textContent=side==='p1'?'1P':'2P';t.style.color=c.text;p.appendChild(t);for(const [idx,id] of ['openGame','scenario','championship','penalty','cup','training','password','options'].entries()){const b=document.createElement('div');b.style.cssText=`margin-top:6px;padding:7px 9px;border:1px solid ${c[side+'Border']};border-radius:6px;background:${idx===0?c[side+'Selected']:c[side+'Button']};color:${c.text};font-weight:700`;b.textContent=labels[id]||id.toUpperCase();p.appendChild(b)}h.appendChild(p)}}
 function applyProjectColors(p){const saved=p?.state?.semantic?.mainMenuColors;if(saved&&typeof saved==='object'){assign(saved,false);draw()}}
 function install(){const page=document.getElementById('page-main-menu');if(!page||document.getElementById('gitMainMenuColorsV12'))return;const card=document.createElement('div');card.id='gitMainMenuColorsV12';card.className='card operational-first';card.innerHTML=`<div class="sectionbar"><div><h3>Cores do Menu Principal</h3><div class="subtle">Edite separadamente as paletas 1P e 2P. O estado é persistido em <code>mainMenuColors</code> no .issdproj.</div></div><span class="badge ok">v12 · Plus</span></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">${Object.entries(LABELS).map(([k,l])=>`<div class="mainmenu-colorbox"><label>${l}</label><div class="mainmenu-colorline"><input type="color" data-mm-v12="${k}"><code data-mm-v12-hex="${k}"></code></div></div>`).join('')}</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px"><button class="btn success" id="gitMmColorsApply">Aplicar cores à ROM</button><button class="btn" id="gitMmColorsRestore">Restaurar originais</button><span class="badge" id="gitMmColorsStatus">pronto</span></div><div id="gitMmColorPreview" style="display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px;margin-top:14px"></div>`;const ph=page.querySelector('.pagehead');if(ph)ph.insertAdjacentElement('afterend',card);else page.prepend(card);card.querySelectorAll('[data-mm-v12]').forEach(i=>i.addEventListener('input',()=>{const c=live();c[i.dataset.mmV12]=i.value;assign(c,true);draw();const s=document.getElementById('gitMmColorsStatus');if(s){s.textContent='alteradas · salve o projeto e/ou aplique à ROM';s.className='badge warn'}}));document.getElementById('gitMmColorsRestore')?.addEventListener('click',()=>{assign(DEFAULT,true);draw()});document.getElementById('gitMmColorsApply')?.addEventListener('click',()=>{try{if(typeof window.studioMainMenuCommitColors!=='function')throw new Error('Writer das paletas não está disponível.');const r=window.studioMainMenuCommitColors(false),s=document.getElementById('gitMmColorsStatus');if(s){s.textContent='aplicadas à ROM'+(r&&Number.isFinite(r.changed)?` · ${r.changed} bytes`:'' );s.className='badge ok'}}catch(e){alert('Não foi possível aplicar as cores: '+(e?.message||e))}});draw()}
 const prev=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
 window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){await prev?.(file);try{importedProject=JSON.parse(await file.text());applyProjectColors(importedProject)}catch(e){console.warn('Menu colors v12',e)}setTimeout(()=>{install();applyProjectColors(importedProject)},120)};
 document.addEventListener('click',e=>{if(e.target?.closest?.('#nav-main-menu,[data-page="main-menu"]'))setTimeout(()=>{install();if(importedProject)applyProjectColors(importedProject);else draw()},0)},true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();setTimeout(install,250);
 window.__ISSSD_MAIN_MENU_COLORS_V12__={build:BUILD,render:draw,applyProjectColors,get:live};
})();
