// Compatibility marker for the build guard: git-controller-ui-v17-native-font
const BUILD='git-controller-ui-v18-stable-no-observer';
const SLOTS=[
 ['high','HIGH'],['ball','BALL'],['pass','PASS'],['shoot','SHOOT'],['dash','DASH'],
 ['keeper','KEEPER'],['semiauto','SEMI AUTO'],['auto','AUTO'],['manual','MANUAL']
];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const norm=s=>String(s??'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 -]/g,'').replace(/\s+/g,' ').trim();
function draft(id,orig){const v=window.ISSSDTextIntentions?.getDraft?.('controller.'+id);return typeof v==='string'?v:orig}
function stage(){const vals={};for(const [id,orig] of SLOTS){const el=$('ctrlphys_'+id),v=norm(el?.value??draft(id,orig));vals[id]=v;if(el)el.value=v;window.ISSSDTextIntentions?.setDraft?.('controller.'+id,v)}return vals}
function commit(){stage();window.ISSSDTextIntentions?.commitAll?.();const st=$('gitControlsStatus');if(st)st.textContent='Termos implementados no projeto. Use Salvar Projeto para gerar o .issdproj.'}
function renderExactControls(){
 const host=$('controlsScreenHost');if(!host)return false;
 let card=$('gitControlsWholeTerms');if(!card){card=document.createElement('div');card.id='gitControlsWholeTerms';card.className='card operational-first';host.replaceChildren(card)}
 card.innerHTML=`<div class="sectionbar"><div><h3>Controles · inscrições reais</h3><div class="subtle">Cada campo abaixo corresponde a uma inscrição física identificada no bloco gráfico original.</div></div><span class="badge ok">mapeamento real</span></div><div class="note info" style="margin:10px 0"><strong>Inscrições encontradas:</strong> HIGH · BALL · PASS · SHOOT · DASH · KEEPER · SEMI AUTO · AUTO · MANUAL. O Studio não vai inventar frases compostas até o tilemap desta tela estar confirmado.</div><div id="gitControlsExactGrid" style="display:grid;grid-template-columns:repeat(3,minmax(190px,1fr));gap:10px"></div><div class="st612-actions" style="margin-top:12px"><button class="btn" id="gitControlsRestore" type="button">Restaurar originais</button><button class="btn primary" id="gitControlsCommit" type="button">Implementar no projeto</button><button class="btn success" id="gitControlsApply" type="button" disabled>Aplicar à ROM</button></div><div class="note info" id="gitControlsStatus" style="margin-top:10px">A gravação deste bloco foi temporariamente desabilitada nesta correção de estabilidade. Primeiro mantemos o Editor responsivo; o writer será religado somente com fonte, cor e layout nativos preservados.</div>`;
 const grid=card.querySelector('#gitControlsExactGrid');
 for(const [id,orig] of SLOTS){const box=document.createElement('label');box.className='st612-item';box.style.cssText='display:grid;gap:6px;padding:10px;border:1px solid #36516b;border-radius:8px;background:#0a1420';box.innerHTML=`<strong>${esc(orig)}</strong><input id="ctrlphys_${id}" data-screen-text-owner="controls" data-screen-text-field="${id}" autocomplete="off" value="${esc(draft(id,orig))}">`;grid.appendChild(box);box.querySelector('input').addEventListener('input',e=>{e.target.value=norm(e.target.value);window.ISSSDTextIntentions?.setDraft?.('controller.'+id,e.target.value)})}
 card.querySelector('#gitControlsRestore').onclick=()=>{for(const [id,orig] of SLOTS){const n=$('ctrlphys_'+id);if(n)n.value=orig;window.ISSSDTextIntentions?.setDraft?.('controller.'+id,orig)}const st=$('gitControlsStatus');if(st)st.textContent='Originais restaurados no rascunho.'};
 card.querySelector('#gitControlsCommit').onclick=commit;return true
}
function placeGlobalButtons(){const grp=$('studioAllExpandTop'),sidebar=document.querySelector('.sidebar'),toggle=$('isssdSidebarToggle');if(!grp||!sidebar)return false;if(grp.parentElement!==sidebar)sidebar.insertBefore(grp,toggle||sidebar.firstChild);grp.classList.add('studio-all-sidebar');grp.removeAttribute('style');return true}
function sync(){placeGlobalButtons();renderExactControls();const badge=$('isssdGitBridgeBadge');if(badge){badge.textContent='Git Visual Bridge v18';badge.title='Correção de estabilidade: sem MutationObserver global.'}}
function finiteBootstrap(){sync();for(const ms of [80,250,700,1500])setTimeout(()=>{placeGlobalButtons();if($('controlsScreenHost')&&!$('ctrlphys_high'))renderExactControls()},ms)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finiteBootstrap,{once:true});else finiteBootstrap();
window.addEventListener('load',()=>{placeGlobalButtons();if($('controlsScreenHost')&&!$('ctrlphys_high'))renderExactControls()},{once:true});
document.addEventListener('click',e=>{const page=e.target?.closest?.('.navbtn[data-page]')?.dataset?.page;if(page==='controls')requestAnimationFrame(()=>{if(!$('ctrlphys_high'))renderExactControls()})},true);
window.__ISSSD_CONTROLLER_V17__={build:BUILD,render:renderExactControls,commit,placeGlobalButtons};
