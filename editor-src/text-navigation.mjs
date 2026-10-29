// Keep the existing screen editors and navigation handlers alive. Only their
// sidebar entries are replaced, so changing areas cannot discard a draft.
(()=>{
 const areas=[
  ['main-menu','Menu principal'],['game-modes','Modos de jogo'],
  ['match-options','Opções da partida'],['controls','Controles'],
  ['strategies','Estratégias'],['texts-cursor','Cursor'],
  ...ADDITIONAL_TEXT_SECTIONS.filter(s=>s.createPage).map(s=>[s.page,s.title.replace(/^Textos\s+/,'')]),
  ['texts','Índice e diagnóstico']
 ].filter(([id],i,all)=>all.findIndex(a=>a[0]===id)===i);
 const ids=new Set(areas.map(a=>a[0]));
 let selected='main-menu',queued=false;
 const node=id=>document.getElementById(id);
 function open(id){
  const button=document.querySelector('.navbtn[data-page="'+id+'"]');
  if(!button)return;
  selected=id;button.click();refresh();
 }
 function refresh(){
  queued=false;
  let nav=node('nav-game-texts');
  const anchor=node('nav-texts');if(!anchor)return;
  if(!nav){
   nav=document.createElement('button');nav.type='button';nav.id='nav-game-texts';nav.className='navbtn';
   nav.innerHTML='<span class="navico">▤</span><span>Textos do jogo</span>';
   nav.onclick=()=>open(selected);anchor.before(nav);
  }
  const available=areas.filter(([id])=>node('page-'+id)&&document.querySelector('.navbtn[data-page="'+id+'"]'));
  const active=available.find(([id])=>node('page-'+id).classList.contains('active'));
  if(active)selected=active[0];
  nav.classList.toggle('active',!!active);
  for(const [id] of available){
   const button=document.querySelector('.navbtn[data-page="'+id+'"]');
   if(!button.classList.contains('text-area-nav-hidden'))button.classList.add('text-area-nav-hidden');
   const page=node('page-'+id);
   let bar=page.querySelector('.text-area-picker');
   if(!bar){
    bar=document.createElement('div');bar.className='text-area-picker';
    const label=document.createElement('label');label.textContent='Área de textos';
    const select=document.createElement('select');select.id='text-area-select-'+id;label.htmlFor=select.id;
    select.setAttribute('aria-label','Área de textos');select.onchange=()=>open(select.value);
    bar.append(label,select);
    const heading=page.querySelector('.pagehead');if(heading)heading.after(bar);else page.prepend(bar);
   }
   const select=bar.querySelector('select');
   const signature=available.map(a=>a[0]).join('|');
   if(select.dataset.areas!==signature){
    select.replaceChildren(...available.map(([value,title])=>{const option=document.createElement('option');option.value=value;option.textContent=title;return option}));
    select.dataset.areas=signature;
   }
   if(select.value!==id)select.value=id;
  }
  const group=node('tx615NavGroup');if(group&&!group.classList.contains('text-area-nav-hidden'))group.classList.add('text-area-nav-hidden');
 }
 function schedule(){if(queued)return;queued=true;setTimeout(refresh,0)}
 function install(){
  const style=document.createElement('style');style.textContent='.text-area-nav-hidden{display:none!important}.text-area-picker{display:flex;align-items:center;gap:14px;padding:12px 16px;margin-bottom:16px;border:1px solid #293b50;border-radius:10px;background:#101c29}.text-area-picker label{font-weight:600;white-space:nowrap}.text-area-picker select{width:min(100%,540px);min-width:0;flex:1}';document.head.appendChild(style);
  refresh();
  // Several legacy editors install their pages after DOMContentLoaded.
  new MutationObserver(schedule).observe(document.querySelector('main.content')||document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('.navbtn,[data-page]'))schedule()});
  window.__ISSSD_TEXT_NAVIGATION__={refresh,open,areas:()=>areas.filter(([id])=>node('page-'+id)).map(a=>a.slice())};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
