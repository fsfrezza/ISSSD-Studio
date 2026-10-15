import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(file))throw new Error('Editor gerado não encontrado: '+file);
let html=fs.readFileSync(file,'utf8');

for(const id of ['ISSSD_BRAZIL_FINAL_ROM_MIRROR_V3','ISSSD_BRAZIL_FINAL_ROM_MIRROR_V4','ISSSD_BRAZIL_FINAL_ROM_MIRROR_V5']){
 html=html.replace(new RegExp(`<script\\s+id=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');
}
html=html.replaceAll('new globalThis.__ISSSD_FINAL_BLOB_V4__(', 'new Blob(');
html=html.replace(/\s*output=globalThis\.__ISSSD_FINALIZE_BRAZIL_ROM_V5__\(output\);[^\n]*\n?/g,'\n');

const start=html.indexOf('function studioDownloadFile(bytes,name,type="application/octet-stream"){');
if(start<0)throw new Error('Export final: studioDownloadFile não encontrado.');
const end=html.indexOf('\n}',start);
if(end<0)throw new Error('Export final: fim de studioDownloadFile não encontrado.');
const newBlock=`async function studioDownloadFile(bytes,name,type="application/octet-stream"){
  let payload=bytes,downloadName=name,downloadType=type;
  const isRom=/\\.(?:smc|sfc)$/i.test(String(name||''));
  const isPlus=(activeRomProfile?.id==='iss-deluxe-plus')||/PLUS/i.test(String(name||''));
  if(isRom&&isPlus){
    const project=await studioProjectObject();
    window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(project);
    const response=await fetch('/__isssd/build-plus-project',{
      method:'POST',
      headers:{'Content-Type':'application/json; charset=utf-8'},
      body:JSON.stringify({project,cumulative:true,diagnostic:window.__ISSSD_DIAGNOSTIC_CHECKPOINTS__===true})
    });
    if(!response.ok){
      let detail='';
      try{detail=(await response.json())?.error||''}catch(_){detail=await response.text().catch(()=> '')}
      throw new Error('Build canônico da ROM falhou'+(detail?': '+detail:''));
    }
    if(response.headers.get('X-ISSSD-Builder')!=='plus-build-pipeline-v1'||response.headers.get('X-ISSSD-Mirrors')!=='ok'){
      throw new Error('Servidor não confirmou o pipeline canônico da ROM Plus.');
    }
    payload=new Uint8Array(await response.arrayBuffer());
    if(response.headers.get('X-ISSSD-Archive')!=='cumulative-v1')throw new Error('Servidor não retornou o ZIP cumulativo.');
    if(payload[0]!==0x50||payload[1]!==0x4B)throw new Error('ZIP cumulativo inválido.');
    downloadName='ISSSD-Plus-ROMs-cumulativas.zip';downloadType='application/zip';
    window.ISSSDLog?.add?.('ROM / Build','info','ROM construída pelo pipeline canônico por estágios',{
      size:payload.length,
      builder:response.headers.get('X-ISSSD-Builder'),
      stages:response.headers.get('X-ISSSD-Stages'),
      lastStage:decodeURIComponent(response.headers.get('X-ISSSD-Last-Stage')||''),
      diagnostics:decodeURIComponent(response.headers.get('X-ISSSD-Diagnostics')||'off')
    });
  }
  const blob=new Blob([payload],{type:downloadType});
  const a=document.createElement("a");
  const url=URL.createObjectURL(blob);
  a.href=url;
  a.download=downloadName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}`;
html=html.slice(0,start)+newBlock+html.slice(end+2);

const callNeedle='studioDownloadFile(output,`ISSSD-STUDIO-BUILD-${profile}.smc`);';
const callCount=html.split(callNeedle).length-1;
if(callCount!==1)throw new Error(`Export final: esperado 1 download da ROM final; encontrados ${callCount}.`);
html=html.replace(callNeedle,'await studioDownloadFile(output,`ISSSD-STUDIO-BUILD-${profile}.smc`);');
html=html.replaceAll("'ROM final auditada antes do download'","'Estado do Editor auditado antes do build canônico por estágios'");

if(/__ISSSD_FINALIZE_BRAZIL_ROM_V[345]__|__ISSSD_FINAL_BLOB_V4__|globalThis\.Blob=FinalBlob/.test(html))throw new Error('Export final: restou runtime experimental de mirror/Blob.');
if(!html.includes("fetch('/__isssd/build-plus-project'"))throw new Error('Export final: endpoint do pipeline não foi instalado.');
if(!html.includes('await studioProjectObject()'))throw new Error('Export final: pipeline não recebe o projeto semântico atual.');
if(!html.includes('await studioDownloadFile(output,`ISSSD-STUDIO-BUILD-${profile}.smc`);'))throw new Error('Export final: download da ROM não aguarda o pipeline.');

// Provisional direct export: intercept Plus Save ROM before legacy physical writers.
const capture=String.raw`<script id="isssd-cumulative-save-capture-v1">
(()=>{
 let busy=false;
 document.addEventListener('click',async event=>{
  const button=event.target?.closest?.('#saveBtn');
  if(!button||window.activeRomProfile?.id!=='iss-deluxe-plus')return;
  event.preventDefault();event.stopImmediatePropagation();
  if(busy)return;busy=true;button.disabled=true;const label=button.textContent;
  button.textContent='Gerando ZIP cumulativo…';
  try{await studioDownloadFile(new Uint8Array(),'ISSSD-Plus.sfc')}
  catch(e){console.error('Exportação cumulativa',e);alert('Falha ao gerar ZIP cumulativo: '+(e.message||e))}
  finally{busy=false;button.disabled=false;button.textContent=label}
 },true);
})();
</script>`;
html=html.replace('</body>',()=>capture+'\n</body>');
fs.writeFileSync(file,html,'utf8');
console.log('ISSSD Studio: exportação Plus centralizada no Build Pipeline v1 do servidor local.');
console.log('  Salvar ROM -> projeto atual -> etapas cumulativas de 4 MiB -> ZIP com índice -> download');
console.log('  o buffer ROM monolítico do browser deixa de ser a fonte da ROM final Plus.');
