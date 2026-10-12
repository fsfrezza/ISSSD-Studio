import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const marker='isssd-overview-minimal-v1';
html=html.replace(new RegExp(`<script id=["']${marker}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');

const runtime=String.raw`<script id="${marker}">
(function(){
 'use strict';
 function hide(node){
  if(!node)return;
  node.hidden=true;
  node.style.display='none';
  node.setAttribute('aria-hidden','true');
 }
 function show(node){
  if(!node)return;
  node.hidden=false;
  node.style.display='';
  node.removeAttribute('aria-hidden');
 }
 function keepOnlyTitleBranch(body,title){
  if(!body||!title)return;
  body.classList.remove('hidden','doc-only');
  show(body);
  let branch=title;
  while(branch&&branch.parentElement&&branch.parentElement!==body)branch=branch.parentElement;
  for(const child of Array.from(body.children)){
   if(child===branch)show(child);else hide(child);
  }
 }
 function normalizeOverview(){
  const page=document.getElementById('page-dashboard');
  if(!page)return false;
  // Não remover nós: updateAllStatus() e outros runtimes ainda dependem de IDs
  // como mChanges, diffCountBadge e diffOffsets mesmo quando não são exibidos.
  hide(document.getElementById('dashboardEmpty'));
  const body=document.getElementById('dashboardBody');
  const title=document.getElementById('dashboardInternalTitleCard');
  keepOnlyTitleBranch(body,title);
  const flow=document.getElementById('operationalDashboard');
  for(const child of Array.from(page.children)){
   const isHead=child.classList?.contains('pagehead');
   const hasFlow=child===flow||child.contains?.(flow);
   const hasBody=child===body||child.contains?.(body);
   if(isHead||hasFlow||hasBody)show(child);else hide(child);
  }
  show(flow);show(title);
  return true;
 }
 function boot(){
  normalizeOverview();
  let lock=false;
  const obs=new MutationObserver(()=>{
   if(lock)return;
   lock=true;
   try{normalizeOverview()}finally{lock=false}
  });
  const page=document.getElementById('page-dashboard');
  if(page)obs.observe(page,{childList:true,subtree:true});
  for(const ms of [50,200,700,1500])setTimeout(normalizeOverview,ms);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.addEventListener('load',normalizeOverview,{once:true});
 window.__ISSSD_OVERVIEW_MINIMAL_V1__={normalize:normalizeOverview};
})();
</script>`;

if(!html.includes('</body>'))throw new Error('Não encontrei </body> para instalar limpeza da Visão Geral.');
html=html.replace('</body>',runtime+'\n</body>');
if(!html.includes('isssd-overview-minimal-v1'))throw new Error('Patch da Visão Geral mínima não foi instalado.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: Visão Geral reduzida visualmente sem remover nós exigidos pelo runtime.');
