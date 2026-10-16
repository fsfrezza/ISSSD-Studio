// Loaded after the normal importer. Draft controls deliberately use their own
// attributes: the normal screenTextsV1 capture must not confirm them on Save.
(function(){
 const sections=ADDITIONAL_TEXT_SECTIONS;
 const clone=value=>JSON.parse(JSON.stringify(value));
 let saved={schema:'isssd-additional-screen-texts-v1',values:{},drafts:{}};
 const dirty=new Set();
 const id=(owner,field)=>'additionalText_'+owner+'_'+field;
 function setStatus(owner,message){const n=document.getElementById('additionalStatus_'+owner);if(n&&n.textContent!==message)n.textContent=message;}
 function original(section,field){return section.fields.find(f=>f[0]===field)?.[1]??'';}
 function value(section,field){return saved.drafts[section.id]?.[field]??saved.values[section.id]?.[field]??original(section,field);}
 function edit(section,field,text){saved.drafts[section.id]||(saved.drafts[section.id]={});saved.drafts[section.id][field]=String(text);dirty.add(section.id);setStatus(section.id,'Rascunho editável. Implementar no projeto confirma estes textos.');}
 function fill(owner,language){const section=sections.find(s=>s.id===owner);if(!section)throw Error('Seção desconhecida');
  for(const [field,en,pt] of section.fields){const text=language==='english'?en:pt;edit(section,field,text);const n=document.getElementById(id(owner,field));if(n)n.value=text;}
  setStatus(owner,'Textos preenchidos como rascunho. Você pode editar antes de implementar no projeto.');
 }
 function commit(owner){const section=sections.find(s=>s.id===owner);if(!section)throw Error('Seção desconhecida');
  const values={};for(const [field] of section.fields){const n=document.getElementById(id(owner,field));values[field]=String(n?.value??value(section,field));}
  saved.values[owner]=values;saved.drafts[owner]={...values};dirty.delete(owner);
  setStatus(owner,'Textos implementados no projeto. Use Salvar Projeto para gravar o arquivo. A gravação destes novos campos na ROM ainda não está disponível.');
 }
 function install(){
  for(const section of sections){
   const page=document.getElementById('page-'+section.page);if(!page)continue;
   let card=document.getElementById('additionalCard_'+section.id);
   if(!card){
    card=document.createElement('div');card.id='additionalCard_'+section.id;card.className='card operational-first';
    const heading=document.createElement('h3');heading.textContent=section.title;card.appendChild(heading);
    const note=document.createElement('p');note.className='subtle';note.textContent='Edite a inscrição completa. Os acentos são preservados no projeto; a exportação usa C no lugar de Ç quando necessário.';card.appendChild(note);
    const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px';card.appendChild(grid);
    for(const [field,en] of section.fields){
     const label=document.createElement('label');label.style.cssText='display:grid;gap:6px';
     const text=document.createElement('strong');text.textContent=en;label.appendChild(text);
     const input=document.createElement('input');input.id=id(section.id,field);input.dataset.additionalTextOwner=section.id;input.dataset.additionalTextField=field;input.style.cssText='width:100%;box-sizing:border-box';input.autocomplete='off';input.value=value(section,field);input.addEventListener('input',()=>edit(section,field,input.value));label.appendChild(input);grid.appendChild(label);
    }
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:14px';
    for(const [action,label] of [['english','Restaurar originais (inglês)'],['portuguese','Usar em português'],['commit','Implementar no projeto']]){
     const button=document.createElement('button');button.id='additional_'+section.id+'_'+action;button.type='button';button.className=action==='commit'?'btn primary':'btn';button.textContent=label;button.onclick=()=>action==='commit'?commit(section.id):fill(section.id,action);actions.appendChild(button);
    }
    card.appendChild(actions);const status=document.createElement('div');status.className='note info';status.id='additionalStatus_'+section.id;status.style.marginTop='10px';status.textContent='Edite ou escolha um idioma e implemente no projeto. Estes novos campos são preservados no projeto; a gravação na ROM ainda não está disponível.';card.appendChild(status);
    const host=page.querySelector('.rom-content')||page;host.appendChild(card);
   }
   for(const [field] of section.fields){const node=document.getElementById(id(section.id,field));const next=value(section,field);if(node&&document.activeElement!==node&&node.value!==next)node.value=next;}
  }
 }
 function hydrate(project){
  const prior=project?.state?.semantic?.additionalScreenTextsV1;
  saved=prior?.schema==='isssd-additional-screen-texts-v1'?clone(prior):{schema:'isssd-additional-screen-texts-v1',values:{},drafts:{}};
  saved.values||(saved.values={});saved.drafts||(saved.drafts={});dirty.clear();install();
 }
 function finalize(project){if(!project?.state)return project;project.state.semantic||(project.state.semantic={});
  if(Object.keys(saved.values).length||Object.keys(saved.drafts).length)project.state.semantic.additionalScreenTextsV1=clone(saved);
  return project;
 }
 const previousFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){previousFinalize?.(project);return finalize(project);};
 const previousOpen=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
 window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){await previousOpen?.(file);hydrate(JSON.parse(await file.text()));};
 const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(install,80);});let timer;
 if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 window.__ISSSD_ADDITIONAL_SCREEN_TEXTS__={install,fill,commit,hydrate,finalize,snapshot:()=>clone(saved),sections};
})();
