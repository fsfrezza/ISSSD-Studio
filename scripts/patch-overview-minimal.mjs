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
 function keepOnlyTitleBranch(body,title){
  if(!body||!title)return;
  body.classList.remove('hidden','doc-only');
  body.hidden=false;
  body.style.display='';
  let branch=title;
  while(branch&&branch.parentElement&&branch.parentElement!==body)branch=branch.parentElement;
  for(const child of Array.from(body.children)){
   if(child!==branch)child.remove();
  }
 }
 function normalizeOverview(){
  const page=document.getElementById('page-dashboard');
  if(!page)return false;
  document.getElementById('dashboardEmpty')?.remove();
  const body=document.getElementById('dashboardBody');
  const title=document.getElementById('dashboardInternalTitleCard');
  keepOnlyTitleBranch(body,title);
  // Fora do corpo técnico, a Visão Geral deve conservar somente o cabeçalho,
  // o Fluxo de trabalho e o ramo que contém o Título interno.
  const flow=document.getElementById('operationalDashboard');
  for(const child of Array.from(page.children)){
   const isHead=child.classList?.contains('pagehead');
   const hasFlow=child===flow||child.contains?.(flow);
   const hasBody=child===body||child.contains?.(body);
   if(!isHead&&!hasFlow&&!hasBody)child.remove();
  }
  if(title){title.hidden=false;title.style.display='';}
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
console.log('ISSSD Studio: Visão Geral reduzida a cabeçalho, Fluxo de trabalho e Título interno.');
