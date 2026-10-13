import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(file))throw new Error('Editor gerado não encontrado: '+file);
let html=fs.readFileSync(file,'utf8');

// Remove every experimental Brazil/export runtime from previous attempts.
for(const id of [
 'ISSSD_BRAZIL_FINAL_ROM_MIRROR_V3',
 'ISSSD_BRAZIL_FINAL_ROM_MIRROR_V4',
 'ISSSD_BRAZIL_FINAL_ROM_MIRROR_V5'
]){
 html=html.replace(new RegExp(`<script\\s+id=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');
}
html=html.replaceAll('new globalThis.__ISSSD_FINAL_BLOB_V4__(', 'new Blob(');
html=html.replace(/\s*output=globalThis\.__ISSSD_FINALIZE_BRAZIL_ROM_V5__\(output\);[^\n]*\n?/g,'\n');

const start=html.indexOf('function studioDownloadFile(bytes,name,type="application/octet-stream"){');
if(start<0)throw new Error('Export final: studioDownloadFile não encontrado.');
const end=html.indexOf('\n}',start);
if(end<0)throw new Error('Export final: fim de studioDownloadFile não encontrado.');
const oldBlock=html.slice(start,end+2);
const newBlock=`async function studioDownloadFile(bytes,name,type="application/octet-stream"){
  let payload=bytes;
  const isRom=/\\.(?:smc|sfc)$/i.test(String(name||''));
  if(isRom){
    if(!(bytes instanceof Uint8Array))throw new TypeError('ROM final precisa ser Uint8Array.');
    const response=await fetch('/__isssd/finalize-plus-rom',{
      method:'POST',
      headers:{'Content-Type':'application/octet-stream'},
      body:bytes
    });
    if(!response.ok){
      let detail='';
      try{detail=(await response.json())?.error||''}catch(_){detail=await response.text().catch(()=> '')}
      throw new Error('Finalização canônica da ROM falhou'+(detail?': '+detail:''));
    }
    if(response.headers.get('X-ISSSD-Finalizer')!=='plus-export-v1'||response.headers.get('X-ISSSD-Mirrors')!=='ok'){
      throw new Error('Servidor não confirmou a integridade final da ROM.');
    }
    payload=new Uint8Array(await response.arrayBuffer());
    window.ISSSDLog?.add?.('ROM / Build','info','ROM finalizada e validada pelo núcleo local',{
      size:payload.length,
      finalizer:response.headers.get('X-ISSSD-Finalizer'),
      mirrors:response.headers.get('X-ISSSD-Mirrors'),
      checksum:response.headers.get('X-ISSSD-Checksum')
    });
  }
  const blob=new Blob([payload],{type});
  const a=document.createElement("a");
  const url=URL.createObjectURL(blob);
  a.href=url;
  a.download=name;
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

// The file hash/audit happens before server finalization, so make that explicit in
// naming and never claim it is the downloaded-file SHA. The server is the final
// authority for mirrors/checksum; the browser audit remains a pre-finalization audit.
html=html.replaceAll("'ROM final auditada antes do download'","'ROM montada e auditada antes da finalização canônica'");

if(/__ISSSD_FINALIZE_BRAZIL_ROM_V[345]__|__ISSSD_FINAL_BLOB_V4__|globalThis\.Blob=FinalBlob/.test(html)){
 throw new Error('Export final: restou runtime experimental de mirror/Blob.');
}
if(!html.includes("fetch('/__isssd/finalize-plus-rom'"))throw new Error('Export final: endpoint canônico não foi instalado.');
if(!html.includes('await studioDownloadFile(output,`ISSSD-STUDIO-BUILD-${profile}.smc`);'))throw new Error('Export final: download da ROM não aguarda o finalizador.');

fs.writeFileSync(file,html,'utf8');
console.log('ISSSD Studio: exportação de ROM centralizada no finalizador canônico do servidor local.');
console.log('  browser monta output -> POST /__isssd/finalize-plus-rom -> núcleo valida mirrors/checksum -> download');
console.log('  runtimes experimentais V3/V4/V5 e interceptação global de Blob removidos.');
