import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Pós-build: editor/ISSSD-Studio.html não encontrado. Execute build:editor antes.');

let html=fs.readFileSync(htmlPath,'utf8');
const START='<!-- ISSSD_GIT_PROJECT_STRUCTURE_V19 -->';
const END='<!-- /ISSSD_GIT_PROJECT_STRUCTURE_V19 -->';
const old=new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*`,'g');
html=html.replace(old,'');

const runtime=String.raw`
<script id="isssd-git-project-structure-v19">
(()=>{'use strict';
 const SCHEMA='isssd-plus-preparation-v1';
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 function core(){return window.__ISSD_CORE__||null}
 function removeDuplicateGlobalControls(){document.getElementById('studioAllExpandTop')?.remove()}
 function snapshot(){
  const c=core();if(!c)return null;
  let ex=null,tx=null;try{ex=c.plusExpansionOnlyStatus?.()||null}catch(_){}try{tx=c.tacticalPreparationStatus?.()||null}catch(_){}
  const profile=ex?.profile||window.activeRomProfile?.id||null;
  if(profile!=='iss-deluxe-plus'&&tx?.isPlus!==true)return null;
  const bodyLength=Number(ex?.bodyLength)||0,expansion=Number(tx?.expansion)||0;
  return {schema:SCHEMA,version:1,expanded4MiB:bodyLength>=0x400000||expansion>=4,bodyLength,expansionMode:expansion||null,tacticsIndividualized:!!tx?.active};
 }
 function put(obj){if(!obj?.state?.semantic)return obj;const s=snapshot();if(s)obj.state.semantic.plusPreparationV1=s;return obj}
 async function restore(project){
  const saved=project?.state?.semantic?.plusPreparationV1;
  if(saved?.schema!==SCHEMA)return {ok:true,skipped:true};
  const c=core();if(!c)throw new Error('Estado estrutural Plus salvo no projeto, mas __ISSD_CORE__ não está disponível.');
  if(saved.expanded4MiB||saved.tacticsIndividualized){
   let ex=c.plusExpansionOnlyStatus?.()||{};
   let body=Number(ex.bodyLength)||0;
   if(body===0x200000){const r=c.apply4MiBExpansionOnly?.();if(!r?.ok)throw new Error(r?.error||'Falha ao restaurar expansão para 4 MiB.');body=Number(r.bodyLength)||Number(c.plusExpansionOnlyStatus?.()?.bodyLength)||0}
   if(body!==0x400000&&body!==0x800000)throw new Error('Projeto pede preparação Plus expandida, mas a ROM ficou com tamanho inesperado: '+body+' bytes.');
  }
  if(saved.tacticsIndividualized&&!c.tacticsIndividualized?.()){
   const r=await c.individualizeAllTactics?.();
   if(!r?.ok)throw new Error(r?.error||r?.reason||'Falha ao restaurar individualização das táticas.');
  }
  try{window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(project)}catch(e){console.warn('Git Structure v19: reapply semântico após preparação',e)}
  try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(_){}
  window.ISSSDLog?.add?.('Projetos','info','Estrutura Plus restaurada do projeto',{expanded4MiB:!!saved.expanded4MiB,tacticsIndividualized:!!saved.tacticsIndividualized});
  return {ok:true};
 }
 function installProjectObjectWrapper(){
  const prev=window.studioProjectObject;if(typeof prev!=='function'||prev.__isssdPlusPrepV19)return;
  const wrapped=async function(...args){const obj=await prev.apply(this,args);return put(obj)};wrapped.__isssdPlusPrepV19=true;wrapped.__isssdPrevious=prev;window.studioProjectObject=wrapped;
 }
 function installAfterOpenWrapper(){
  const prev=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;if(typeof prev!=='function'||prev.__isssdPlusPrepV19)return;
  const wrapped=async function(file){let project=null;try{project=JSON.parse(await file.text())}catch(_){}await prev.call(this,file);if(project)await restore(project);removeDuplicateGlobalControls()};wrapped.__isssdPlusPrepV19=true;wrapped.__isssdPrevious=prev;window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=wrapped;
 }
 function install(){removeDuplicateGlobalControls();installProjectObjectWrapper();installAfterOpenWrapper()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,0);setTimeout(install,150)},{once:true});else{install();setTimeout(install,0);setTimeout(install,150)}
 window.addEventListener('load',()=>{install();setTimeout(removeDuplicateGlobalControls,0)},{once:true});
 window.__ISSSD_PLUS_PREPARATION_V1__={schema:SCHEMA,snapshot,restore,put,removeDuplicateGlobalControls,install};
})();
</script>`;

const patch=`\n${START}\n${runtime}\n${END}\n`;
if(html.includes('</body>'))html=html.replace('</body>',patch+'\n</body>');else html+=patch;
fs.writeFileSync(htmlPath,html,'utf8');

const check=fs.readFileSync(htmlPath,'utf8');
if((check.match(/id="isssd-git-project-structure-v19"/g)||[]).length!==1)throw new Error('Pós-build: runtime estrutural v19 não foi injetado exatamente uma vez.');
console.log('ISSSD Studio pós-build: studioAllExpandTop será removido; expansão 4 MiB e individualização tática passam a integrar o projeto.');
