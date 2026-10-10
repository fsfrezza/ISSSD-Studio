const BUILD='git-main-menu-colors-v12';
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const DEFAULT={p1Bg:'#245b96',p1Button:'#2e70b8',p1Selected:'#3f86d2',p1Border:'#b9d9ff',p2Bg:'#9a416f',p2Button:'#bd5d8e',p2Selected:'#d878a9',p2Border:'#ffd0e7',text:'#ffffff'};
const LABELS={p1Bg:'Fundo 1P',p1Button:'Botão 1P',p1Selected:'Selecionado 1P',p1Border:'Contorno 1P',p2Bg:'Fundo 2P',p2Button:'Botão 2P',p2Selected:'Selecionado 2P',p2Border:'Contorno 2P',text:'Texto dos botões'};
let currentProject=null;
function state(){return {...DEFAULT,...(window.mainMenuColors||{})}}
function setState(next){window.mainMenuColors={...DEFAULT,...next};window.mainMenuProjectSaved=false;window.studioMainMenuMarkColorsDirty?.();}
function host(){return document.getElementById('page-main-menu')}
function preview(){
 const h=document.getElementById('gitMmColorPreview');if(!h)return;const c=state(),labels=window.mainMenuFb96Draft||{};
 h.innerHTML='';for(const side of ['p1','p2']){const p=document.createElement('div');p.className='git-mm-v12-panel';p.style.background=c[side+'Bg'];p.style.borderColor=c[side+'Border'];const t=document.createElement('strong');t.textContent=side==='p1'?'1P':'2P';t.style.color=c.text;p.appendChild(t);const ids=['openGame','scenario','championship','penalty','cup','training','password','options'];for(const [i,id] of ids.entries()){const b=document.createElement('div');b.className='git-mm-v12-button';b.style.background=i===0?c[side+'Selected']:c[side+'Button'];b.style.borderColor=c[side+'Border'];b.style.color=c.text;b.textContent=labels[id]||id.toUpperCase();p.appendChild(b)}h.appendChild(p)}
}
function render(){
 const card=document.getElementById('gitMainMenuColorsV12');if(!card)return;const c=state();
 for(const k of Object.keys(LABELS)){const i=card.querySelector(`[data-mm-v12="${k}"]`),x=card.querySelector(`[data-mm-v12-hex="${k}"]`);if(i&&document.activeElement!==i)i.value=c[k]||DEFAULT[k];if(x)x.textContent=(c[k]||DEFAULT[k]).toUpperCase()}
 preview();
}
function applyProjectColors(p){const saved=p?.state?.semantic?.mainMenuColors;if(saved&&typeof saved==='object'){window.mainMenuColors={...DEFAULT,...clone(saved)};render()}}
function install(){
 const h=host();if(!h||document.getElementById('gitMainMenuColorsV12'))return false;
 const card=document.createElement('div');card.id='gitMainMenuColorsV12';card.className='card operational-first';card.setAttribute('data-studio-collapse-default','open');
 card.innerHTML=`<div class="sectionbar"><div><h3>Cores do Menu Principal</h3><div class="subtle">Paletas 1P e 2P. As cores ficam no .issdproj e podem ser aplicadas à ROM Plus.</div></div><span class="badge ok">v12 · Plus</span></div><div class="git-mm-v12-grid">${Object.entries(LABELS).map(([k,l])=>`<div class="mainmenu-colorbox"><label>${l}</label><div class="mainmenu-colorline"><input type="color" data-mm-v12="${k}"><code data-mm-v12-hex="${k}"></code></div></div>`).join('')}</div><div class="git-mm-v12-actions"><button class="btn success" id="gitMmColorsApply">Aplicar cores à ROM</button><button class="btn" id="gitMmColorsRestore">Restaurar cores originais</button><span class="badge" id="gitMmColorsStatus">pronto</span></div><div class="git-mm-v12-preview" id="gitMmColorPreview"></div>`;
 const anchor=h.querySelector('.pagehead');if(anchor)anchor.insertAdjacentElement('afterend',card);else h.prepend(card);
 card.querySelectorAll('[data-mm-v12]').forEach(i=>i.addEventListener('input',()=>{const n=state();n[i.dataset.mmV12]=i.value;setState(n);const x=card.querySelector(`[data-mm-v12-hex="${i.dataset.mmV12}"]`);if(x)x.textContent=i.value.toUpperCase();preview();const st=document.getElementById('gitMmColorsStatus');if(st){st.textContent='alteradas · salve o projeto e/ou aplique à ROM';st.className='badge warn'}}));
 document.getElementById('gitMmColorsRestore')?.addEventListener('click',()=>{setState(DEFAULT);render();const st=document.getElementById('gitMmColorsStatus');if(st){st.textContent='cores originais restauradas no editor';st.className='badge warn'}});
 document.getElementById('gitMmColorsApply')?.addEventListener('click',()=>{try{if(typeof window.studioMainMenuCommitColors!=='function')throw new Error('Writer de paletas do Menu Principal não está disponível.');const r=window.studioMainMenuCommitColors(false);const st=document.getElementById('gitMmColorsStatus');if(st){st.textContent='aplicadas à ROM'+(r&&Number.isFinite(r.changed)?` · ${r.changed} bytes alterados`:'');st.className='badge ok'}}catch(e){alert('Não foi possível aplicar as cores: '+(e?.message||e))}});
 render();return true;
}
const oldOpen=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){await oldOpen?.(file);try{currentProject=JSON.parse(await file.text());applyProjectColors(currentProject)}catch(e){console.warn('Menu colors v12: projeto',e)}setTimeout(()=>{install();applyProjectColors(currentProject)},120)};
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-page="main-menu"],#nav-main-menu'))setTimeout(()=>{install();if(currentProject)applyProjectColors(currentProject);else render()},0)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setTimeout(install,250);setTimeout(()=>{install();render()},900);
window.__ISSSD_MAIN_MENU_COLORS_V12__={build:BUILD,render,applyProjectColors,get:state};
