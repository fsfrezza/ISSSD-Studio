import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

// Remove integralmente o helper legado que materializa o segundo campo visual.
html=html.replace(/<script id=["']isssd-v328-internal-title-helper["'][^>]*>[\s\S]*?<\/script>\s*/g,'');
// Remove qualquer versão anterior do patch que recriava controles para o campo descartado.
html=html.replace(/<script id=["']isssd-desired-internal-title-button["'][^>]*>[\s\S]*?<\/script>\s*/g,'');

const marker='isssd-single-internal-title-v1';
html=html.replace(new RegExp(`<script id=["']${marker}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');

const runtime=String.raw`<script id="${marker}">
(function(){
 'use strict';
 const clean=v=>String(v??'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);
 function migrateLegacyProject(project){
  const sem=project?.state?.semantic;
  if(!sem)return project;
  if((typeof sem.romInternalTitle!=='string'||!sem.romInternalTitle.length)&&typeof sem.romInternalTitleDesired==='string'&&sem.romInternalTitleDesired.length){
   sem.romInternalTitle=clean(sem.romInternalTitleDesired);
  }
  delete sem.romInternalTitleDesired;
  return project;
 }
 function removeLegacyUi(){
  document.getElementById('romMetaTitleDesired')?.closest('.rommeta-field')?.remove();
  document.getElementById('romMetaTitleDesiredImplementRow')?.remove();
 }
 function installProjectWrapper(){
  const prev=window.studioProjectObject;
  if(typeof prev!=='function'||prev.__isssdSingleInternalTitleV1)return;
  const wrapped=async function(...args){
   const obj=await prev.apply(this,args);
   return migrateLegacyProject(obj);
  };
  wrapped.__isssdSingleInternalTitleV1=true;
  wrapped.__isssdPrevious=prev;
  window.studioProjectObject=wrapped;
 }
 function installOpenWrapper(){
  const prev=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
  if(typeof prev!=='function'||prev.__isssdSingleInternalTitleV1)return;
  const wrapped=async function(file){
   let migratedFile=file;
   try{
    const d=JSON.parse(await file.text());
    migrateLegacyProject(d);
    migratedFile=new File([JSON.stringify(d)],file.name,{type:file.type||'application/octet-stream'});
   }catch(_){}
   const r=await prev.call(this,migratedFile);
   removeLegacyUi();
   return r;
  };
  wrapped.__isssdSingleInternalTitleV1=true;
  wrapped.__isssdPrevious=prev;
  window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=wrapped;
 }
 function install(){removeLegacyUi();installProjectWrapper();installOpenWrapper()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,50);setTimeout(install,250)},{once:true});
 else{install();setTimeout(install,50);setTimeout(install,250)}
 window.addEventListener('load',install,{once:true});
 window.__ISSSD_SINGLE_INTERNAL_TITLE_V1__={migrateLegacyProject,removeLegacyUi,install};
})();
</script>`;

if(!html.includes('</body>'))throw new Error('Não encontrei </body> para instalar o modo de título interno único.');
html=html.replace('</body>',runtime+'\n</body>');
if(/id=["']romMetaTitleDesired["']/.test(html))throw new Error('O campo visual romMetaTitleDesired permaneceu no HTML final.');
if(!html.includes('delete sem.romInternalTitleDesired'))throw new Error('Migração/limpeza do campo legado romInternalTitleDesired não foi instalada.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: Título interno é o único campo de nome interno; campo desejado removido e legado migrado somente para compatibilidade de abertura.');
