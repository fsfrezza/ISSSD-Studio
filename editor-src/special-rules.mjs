// Special Rules UI: semantic intent only. No unverified gameplay patch is applied.
(()=>{
 const KEY='goalkeeperBackpassNoHands';
 const SCHEMA='isssd-special-rules-v1';
 let selected=false;
 const getState=()=>({schema:SCHEMA,[KEY]:selected});
 function setState(semantic){
   const rule=semantic?.specialRulesV1;
   selected=rule?.schema===SCHEMA && rule[KEY]===true;
   const box=document.getElementById('isssdBackpassRule');
   if(box)box.checked=selected;
 }
 function mount(){
   if(document.getElementById('isssdSpecialRulesNav'))return;
   const ref=document.querySelector('.navbtn[data-page]');
   if(!ref)return;
   const nav=ref.parentElement;
   const btn=ref.cloneNode(false);
   btn.id='isssdSpecialRulesNav';
   btn.dataset.page='isssd-special-rules';
   btn.textContent='Regras Especiais';
   btn.classList.remove('active');
   nav.appendChild(btn);
   const page=document.createElement('section');
   page.id='isssd-special-rules';
   page.style.cssText='display:none;padding:20px;max-width:900px';
   page.innerHTML='<h2>Regras Especiais</h2><div style="padding:16px;border:1px solid var(--border,#777);border-radius:8px"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="isssdBackpassRule"> Marcar pênalti quando goleiro agarrar recuo proibido</label><p style="margin:10px 0 0;opacity:.85">Quando implementada, esta regra marcará pênalti para o adversário após a captura ilegal (regra personalizada, diferente da regra oficial). Cabeçadas lícitas não serão punidas; arremesso lateral direto do companheiro também terá restrição.</p><p style="margin:8px 0 0;color:#d7a65d"><strong>Correção pendente:</strong> selecionar a opção registra a preferência no projeto; a ROM não será gerada com esta opção enquanto a rotina não estiver validada.</p></div>';
   const existing=ref.closest('nav')?.parentElement||document.body;
   const existingPage=document.querySelector('[data-page-content]')||document.querySelector('.page');
   (existingPage?.parentElement||existing).appendChild(page);
   page.querySelector('input').addEventListener('change',e=>{selected=e.target.checked;});
   const screens=()=>Array.from(document.querySelectorAll('[data-page-content],.page')).filter(x=>x!==page);
   let previous=[];
   btn.addEventListener('click',e=>{
     e.preventDefault();e.stopImmediatePropagation();
     previous=screens().filter(x=>getComputedStyle(x).display!=='none');
     for(const s of previous)s.style.display='none';
     page.style.display='block';
     for(const b of nav.querySelectorAll('.navbtn'))b.classList.toggle('active',b===btn);
   },true);
   nav.addEventListener('click',e=>{
     if(e.target.closest('#isssdSpecialRulesNav'))return;
     if(page.style.display!=='none'){
       page.style.display='none';
       for(const s of previous)s.style.removeProperty('display');
     }
   },true);
 }
 // Wrap the canonical object finalizer and the project restore bridge.
 // These hooks already belong to the existing editor save/open flow.
 const previousFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){
   const out=typeof previousFinalize==='function'?previousFinalize(project):project;
   if(out?.state?.semantic)out.state.semantic.specialRulesV1=getState();
   return out;
 };
 const previousRestore=window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__;
 window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__=function(project){
   if(typeof previousRestore==='function')previousRestore(project);
   setState(project?.state?.semantic);
 };
 const boot=()=>mount();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.ISSSDSpecialRules={getState,restore:setState};
})();
