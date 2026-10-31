import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
let html=fs.readFileSync(file,'utf8');
const marker='isssd-expand-dedup-v1';
html=html.replace(new RegExp('<script id="'+marker+'">[\\s\\S]*?<\\/script>\\s*','g'),'');
const runtime=String.raw`<script id="isssd-expand-dedup-v1">
(function(){
 'use strict';
 const normalize=s=>String(s||'').trim().replace(/\\s+/g,' ').toLocaleLowerCase('pt-BR');
 const generic=/^(?:expandir|recolher) todos(?:\\s*[.!])?$/;
 const top=document.getElementById('studioAllExpandTop');
 if(!top)return;
 const actions=['button','[role="button"]','input[type="button"]'].join(',');
 const displayText=el=>normalize(el.matches('input')?el.value:el.textContent||el.getAttribute('aria-label'));
 const visible=el=>!!(el.getClientRects().length)&&getComputedStyle(el).visibility!=='hidden';
 function activePage(){
  const pages=Array.from(document.querySelectorAll('[id^="page-"]'));
  return pages.find(p=>visible(p)&&!p.hidden&&!p.classList.contains('hidden'))||null;
 }
 function sync(){
  const page=activePage();
  // Never hide a section-specific command or a control in an inactive page.
  if(!page||!visible(top))return;
  const topActions=Array.from(top.querySelectorAll(actions));
  if(top.matches('button,[role="button"]'))topActions.push(top);
  const names=new Set(topActions.filter(visible).map(displayText).filter(s=>generic.test(s)));
  // A single global toggle may not have an equivalent local action: leave controls alone.
  if(!names.size)return;
  page.querySelectorAll(actions).forEach(el=>{
   if(top.contains(el)||el===top)return;
   const name=displayText(el);
   if(!generic.test(name)||!names.has(name))return;
   // Avoid removing actions scoped to a subgroup or a separately labeled accordion.
   if(el.closest('[data-expand-scope],[data-accordion-group]'))return;
   // Hide just the redundant control, not its container or event handler.
   el.hidden=true;
   el.style.display='none';
   el.dataset.isssdRedundantExpand='true';
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
 else sync();
 document.addEventListener('click',e=>{
  if(e.target.closest('[role="tab"],.tab,[data-tab],.nav-item'))queueMicrotask(sync);
 },true);
 window.__ISSSD_EXPAND_DEDUP__={sync};
})();
</script>`;
if(!html.includes('</body>'))throw Error('HTML sem </body>');
html=html.replace('</body>',runtime+'\n</body>');
fs.writeFileSync(file,html);
console.log('ISSSD Studio: controles de expansão redundantes ocultados conservadoramente.');
