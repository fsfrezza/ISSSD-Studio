import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

// Não remova fisicamente scripts do HTML legado: isso pode romper a estrutura do
// documento quando os builds históricos contêm blocos/injeções adjacentes.
// Em vez disso, neutralizamos somente a função install() do helper v328.
const helperId='isssd-v328-internal-title-helper';
const helperStart=html.indexOf(`<script id="${helperId}">`);
if(helperStart>=0){
 const helperEnd=html.indexOf('</script>',helperStart);
 if(helperEnd<0)throw new Error('Helper v328 encontrado sem fechamento </script>.');
 const block=html.slice(helperStart,helperEnd+9);
 if(!block.includes("function install(){"))throw new Error('Helper v328 não possui função install() reconhecível.');
 if(!block.includes('romMetaTitleDesired'))throw new Error('Helper v328 encontrado, mas não contém romMetaTitleDesired.');
 const neutralized=block.replace("function install(){","function install(){return;/* campo desejado aposentado */");
 if(neutralized===block)throw new Error('Falha ao neutralizar helper v328.');
 html=html.slice(0,helperStart)+neutralized+html.slice(helperEnd+9);
 // Auditoria localizada: o próprio bloco continua delimitado como script e contém o marcador.
 const checkStart=html.indexOf(`<script id="${helperId}">`);
 const checkEnd=checkStart>=0?html.indexOf('</script>',checkStart):-1;
 if(checkStart<0||checkEnd<0)throw new Error('Helper v328 perdeu seus delimitadores <script> após neutralização.');
 const checkBlock=html.slice(checkStart,checkEnd+9);
 if(!checkBlock.includes('campo desejado aposentado'))throw new Error('Helper v328 não ficou neutralizado dentro do próprio bloco script.');
}

const marker='isssd-single-internal-title-v2';
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
  const desired=document.getElementById('romMetaTitleDesired');
  if(desired){
   const host=desired.closest('.rommeta-field');
   if(host)host.remove(); else desired.remove();
  }
  document.getElementById('romMetaTitleDesiredImplementRow')?.remove();
  document.getElementById('romMetaTitleDesiredImplementBtn')?.remove();
  document.getElementById('romMetaTitleDesiredImplementStatus')?.remove();
 }
 function installProjectWrapper(){
  const prev=window.studioProjectObject;
  if(typeof prev!=='function'||prev.__isssdSingleInternalTitleV2)return;
  const wrapped=async function(...args){
   const obj=await prev.apply(this,args);
   return migrateLegacyProject(obj);
  };
  wrapped.__isssdSingleInternalTitleV2=true;
  wrapped.__isssdPrevious=prev;
  window.studioProjectObject=wrapped;
 }
 function installOpenWrapper(){
  const prev=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
  if(typeof prev!=='function'||prev.__isssdSingleInternalTitleV2)return;
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
  wrapped.__isssdSingleInternalTitleV2=true;
  wrapped.__isssdPrevious=prev;
  window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=wrapped;
 }
 function install(){removeLegacyUi();installProjectWrapper();installOpenWrapper()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,50);setTimeout(install,250)},{once:true});
 else{install();setTimeout(install,50);setTimeout(install,250)}
 window.addEventListener('load',install,{once:true});
 const observer=new MutationObserver(()=>removeLegacyUi());
 if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
 window.__ISSSD_SINGLE_INTERNAL_TITLE_V2__={migrateLegacyProject,removeLegacyUi,install};
})();
</script>`;

if(!html.includes('</body>'))throw new Error('Não encontrei </body> para instalar o modo de título interno único.');
html=html.replace('</body>',runtime+'\n</body>');
if(!html.includes(`id="${marker}"`))throw new Error('Runtime de título interno único não foi inserido.');
if(!html.includes('delete sem.romInternalTitleDesired'))throw new Error('Migração/limpeza do campo legado romInternalTitleDesired não foi instalada.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: Título interno único v2 instalado; helper desejado neutralizado sem cortar scripts do HTML.');
