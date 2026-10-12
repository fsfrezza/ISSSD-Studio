import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const marker='isssd-desired-internal-title-button';
html=html.replace(new RegExp(`<script id=["']${marker}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');

// Substitui o helper inteiro que cria o campo. Assim campo, botão e status nascem juntos.
const helperRe=/<script\b(?=[^>]*\bid=["']isssd-v328-internal-title-helper["'])[^>]*>[\s\S]*?<\/script>/i;
if(!helperRe.test(html))throw new Error('Não encontrei o helper #isssd-v328-internal-title-helper no HTML final.');
const helper=String.raw`<script id="isssd-v328-internal-title-helper">
(()=>{
 function install(){
  const card=document.getElementById('dashboardInternalTitleCard');
  if(!card)return false;
  let wrap=document.getElementById('romMetaTitleDesiredWrap');
  if(!wrap){
   wrap=document.createElement('div');
   wrap.id='romMetaTitleDesiredWrap';
   wrap.className='rommeta-field';
   wrap.style='grid-column:span 2;margin-top:10px';
   wrap.innerHTML='<label>Nome interno desejado no projeto</label><input autocomplete="off" id="romMetaTitleDesired" type="text" value="INTERNATIONAL SUPERSTARSUCKER DELUXO"><div id="romMetaTitleDesiredImplementRow" style="display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn" id="romMetaTitleDesiredImplementBtn">Implementar nome desejado</button><span class="badge" id="romMetaTitleDesiredImplementStatus">Não implementado</span></div><div class="subtle" style="margin-top:8px">O cabeçalho SNES possui 21 bytes fixos. Este campo preserva o nome completo no projeto; o campo “Título interno” acima é o valor realmente gravável no cabeçalho da ROM.</div>';
   card.querySelector('.rommeta-grid')?.appendChild(wrap);
  }
  const i=document.getElementById('romMetaTitleDesired');
  if(!i)return false;
  window.__ISSSD_INTERNAL_TITLE_DESIRED__=window.__ISSSD_INTERNAL_TITLE_DESIRED__||i.value;
  i.value=window.__ISSSD_INTERNAL_TITLE_DESIRED__;
  i.oninput=()=>window.__ISSSD_INTERNAL_TITLE_DESIRED__=i.value;
  return true;
 }
 function boot(){if(install())return;let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(t)},100)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.addEventListener('load',boot,{once:true});
})();
</script>`;
html=html.replace(helperRe,helper);

const runtime=String.raw`<script id="${marker}">
(function(){
 'use strict';
 function cleanRomTitle(v){return String(v||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21)}
 function install(){
  const desired=document.getElementById('romMetaTitleDesired');
  const button=document.getElementById('romMetaTitleDesiredImplementBtn');
  const status=document.getElementById('romMetaTitleDesiredImplementStatus');
  if(!desired||!button||!status)return false;
  if(button.dataset.isssdDesiredBound==='1')return true;
  button.dataset.isssdDesiredBound='1';
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
 function boot(){if(install())return;let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(timer)},100)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.addEventListener('load',boot,{once:true});
})();
</script>`;

if(!html.includes('</body>'))throw new Error('Não encontrei </body> para instalar handler do nome interno desejado.');
html=html.replace('</body>',runtime+'\n</body>');
if(!html.includes('id="romMetaTitleDesiredImplementBtn"'))throw new Error('Botão do nome interno desejado não ficou dentro do helper final.');
if(!html.includes('id="romMetaTitleDesiredImplementStatus"'))throw new Error('Status do nome interno desejado não ficou dentro do helper final.');
if(!html.includes("__ISSSD_ROM_META_WRITE_TITLE__?.(romTitle,'Nome interno desejado do projeto')"))throw new Error('Botão do nome desejado não usa o gravador canônico de título interno.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: campo “Nome interno desejado” recriado com botão “Implementar nome desejado” e status no próprio helper visual.');
