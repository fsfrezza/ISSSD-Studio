import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const marker='isssd-desired-internal-title-button';
html=html.replace(new RegExp(`<script id=["']${marker}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');

const runtime=String.raw`<script id="${marker}">
(function(){
 'use strict';
 function cleanRomTitle(v){return String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21)}
 function install(){
  const desired=document.getElementById('romMetaTitleDesired');
  if(!desired)return false;
  if(document.getElementById('romMetaTitleDesiredImplementBtn'))return true;
  const upperStatus=document.getElementById('romMetaTitleImplementStatus');
  const refButton=upperStatus?.parentElement?.querySelector('button')||Array.from(document.querySelectorAll('button')).find(b=>/Implementar título interno/i.test(String(b.textContent||'')));
  const row=document.createElement('div');
  row.id='romMetaTitleDesiredImplementRow';
  row.style.display='flex';row.style.alignItems='center';row.style.gap='12px';row.style.marginTop='12px';row.style.flexWrap='wrap';
  const button=document.createElement('button');
  button.type='button';button.id='romMetaTitleDesiredImplementBtn';button.className=refButton?.className||'btn';button.textContent='Implementar nome desejado';
  const status=document.createElement('span');
  status.id='romMetaTitleDesiredImplementStatus';status.className='badge';status.textContent='Não implementado';
  row.append(button,status);
  desired.insertAdjacentElement('afterend',row);
  button.addEventListener('click',async()=>{
   const full=String(desired.value??'');
   const romTitle=cleanRomTitle(full);
   window.__ISSSD_INTERNAL_TITLE_DESIRED__=full;
   window.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=romTitle;
   const title=document.getElementById('romMetaTitle');
   if(title){title.value=romTitle;title.dispatchEvent(new Event('input',{bubbles:true}));title.dispatchEvent(new Event('change',{bubbles:true}))}
   desired.dispatchEvent(new Event('input',{bubbles:true}));desired.dispatchEvent(new Event('change',{bubbles:true}));
   const count=document.getElementById('romMetaTitleCount');if(count)count.textContent=String(romTitle.length);
   try{
    await window.__ISSSD_ROM_META_WRITE_TITLE__?.(romTitle,'Nome interno desejado do projeto');
    const st=document.getElementById('romMetaTitleImplementStatus');if(st){st.textContent='Implementado';st.className='badge ok'}
    status.textContent=full.length>21?'Implementado · ROM: 21 bytes':'Implementado';status.className='badge ok';
    window.ISSSDLog?.add?.('ROM / Build','info','Nome interno desejado implementado',{desired:full,romTitle,length:romTitle.length});
   }catch(e){
    status.textContent='Falha ao implementar';status.className='badge warn';console.error('ISSSD Studio: falha ao implementar nome interno desejado',e);
   }
  });
  return true;
 }
 function boot(){if(install())return;let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer)},100)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>`;

if(!html.includes('</body>'))throw new Error('Não encontrei </body> para instalar botão do nome interno desejado.');
html=html.replace('</body>',runtime+'\n</body>');
if(!html.includes('romMetaTitleDesiredImplementBtn'))throw new Error('Botão do nome interno desejado não foi instalado.');
if(!html.includes("__ISSSD_ROM_META_WRITE_TITLE__?.(romTitle,'Nome interno desejado do projeto')"))throw new Error('Botão do nome desejado não usa o gravador canônico de título interno.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: botão “Implementar nome desejado” instalado; nome completo fica no projeto e até 21 bytes são gravados na ROM.');
