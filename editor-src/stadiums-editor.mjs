(()=>{
 const engine=window.ISSSDStadiums,host=()=>window.__ISSSD_PREKICK_HOST__,node=id=>document.getElementById(id);
 let saved=engine.validateStadiums(null),selected=0,installed=false;
 const clone=v=>JSON.parse(JSON.stringify(v));
 const hex=c=>'#'+[c&31,(c>>5)&31,(c>>10)&31].map(v=>Math.round(v*255/31).toString(16).padStart(2,'0')).join('');
 const bgr=h=>{const c=[1,3,5].map(p=>Math.round(parseInt(h.slice(p,p+2),16)*31/255));return c[0]|c[1]<<5|c[2]<<10};
 function status(text,error=false){const n=node('stadiumStatus');if(n){n.textContent=text;n.className='note '+(error?'error':'info');}}
 function render(){
  if(!installed)return;
  const grid=node('stadiumColors');grid.replaceChildren();
  try{
   const catalog=engine.readStadiums(host()?.rom?.()),s=catalog[selected],colors=saved.stadiums[selected]?.colors||s.colors;
   node('stadiumIdentification').textContent=s.name+' · identificado na ROM · ID '+s.id;
   node('stadiumRestore').disabled=false;
   colors.forEach((c,i)=>{const label=document.createElement('label');label.style.cssText='display:grid;gap:6px';const title=document.createElement('span');title.textContent='Cor '+(i+1);const input=document.createElement('input');input.type='color';input.value=hex(c);input.setAttribute('aria-label',s.name+' · cor '+(i+1));input.onchange=()=>{const next=(saved.stadiums[selected]?.colors||s.colors).slice();next[i]=bgr(input.value);saved.stadiums[selected]={colors:next};window.studioUpdateBadge?.();status('Cores alteradas. Salve o projeto e inclua a fase 10 · Partida ao gerar a ROM.');};label.append(title,input);grid.append(label);});
   status('Paleta nativa de 16 cores identificada. Os efeitos variam com o estádio e o clima; outras paletas ainda não estão editáveis.');
  }catch(e){node('stadiumRestore').disabled=true;node('stadiumIdentification').textContent=engine.STADIUMS[selected].name;status(e.message,true);}
 }
 function mount(){
  if(installed)return;const anchor=node('nav-uniforms'),main=document.querySelector('main.content');if(!anchor||!main)return;installed=true;
  const nav=document.createElement('button');nav.id='nav-stadiums';nav.className='navbtn';nav.dataset.page='stadiums';nav.innerHTML='<span class="navico">▥</span><span>Estádios</span>';anchor.after(nav);
  const page=document.createElement('section');page.id='page-stadiums';page.className='page';page.innerHTML=`<div class="pagehead"><div><h2>Estádios</h2><p>Identificação e opções de edição dos oito estádios da ROM Plus.</p></div></div>
   <div class="card"><div class="sectionbar"><h3>Estádio</h3></div><label for="stadiumSelect">Selecione o estádio</label><select id="stadiumSelect"></select><p id="stadiumIdentification"></p></div>
   <div class="card"><div class="sectionbar"><h3>Paleta nativa · edição disponível</h3></div><p>As cores são numeradas porque ainda não foi validado qual elemento visual usa cada posição. Não há prévia do estádio nesta versão.</p><div id="stadiumColors" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:12px"></div><button type="button" class="btn" id="stadiumRestore">Restaurar cores originais deste estádio</button><p id="stadiumStatus"></p></div>
   <div class="card"><div class="sectionbar"><h3>Textos</h3></div><p>As inscrições da seleção de estádio ficam na central de textos.</p><button class="btn" type="button" id="stadiumTexts">Abrir Textos do jogo → Estádio</button></div>
   <div class="card"><div class="sectionbar"><h3>Outras opções · indisponíveis</h3></div><p>Estes recursos ainda precisam de mapeamento e validação na ROM Plus.</p><div id="stadiumFuture"></div></div>`;main.appendChild(page);
  for(const s of engine.STADIUMS){const option=document.createElement('option');option.value=s.id;option.textContent=s.name;node('stadiumSelect').appendChild(option);}
  node('stadiumSelect').onchange=()=>{selected=Number(node('stadiumSelect').value);render();};
  node('stadiumRestore').onclick=()=>{delete saved.stadiums[selected];window.studioUpdateBadge?.();render();};
  node('stadiumTexts').onclick=()=>window.__ISSSD_TEXT_NAVIGATION__?.open('texts-stadium');
  for(const text of ['Importar imagens e editar placas de publicidade','Digitar publicidade e convertê-la em gráfico','Editar desenho e faixas do gramado','Editar arquibancadas e estruturas','Editar paletas de clima e iluminação','Separar todos os gráficos compartilhados entre estádios','Alterar dimensões e limites físicos do campo']){const p=document.createElement('p'),button=document.createElement('button');button.type='button';button.disabled=true;button.className='btn';button.textContent=text;p.appendChild(button);node('stadiumFuture').appendChild(p);}
  nav.onclick=()=>{document.querySelectorAll('.page').forEach(p=>{p.classList.toggle('active',p===page);p.style.removeProperty('display');});document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b===nav));render();};
  render();
 }
 function restore(project){saved=engine.validateStadiums(project?.state?.semantic?.stadiumsV1);render();}
 const finalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){finalize?.(project);if(project?.state){project.state.semantic||={};project.state.semantic.stadiumsV1=clone(saved);}return project;};
 const apply=window.studioApplyProjectWithBase;
 if(typeof apply==='function')window.studioApplyProjectWithBase=async function(project,...args){const previous=saved;try{const next=engine.validateStadiums(project?.state?.semantic?.stadiumsV1);const result=await apply.call(this,project,...args);saved=next;render();return result;}catch(e){saved=previous;throw e;}};
 window.__ISSSD_STADIUMS_EDITOR__={mount,render,restore,snapshot:()=>clone(saved)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
