// Optional validated improvements; keep the existing project key.
(()=>{
 const KEY='goalkeeperBackpassNoHands';
 const SCHEMA='isssd-special-rules-v1';
 let selected=false;
 const getState=()=>({schema:SCHEMA,[KEY]:selected});
 function setState(semantic){
   const rule=semantic?.specialRulesV1;
   selected=rule?.schema===SCHEMA && rule[KEY]===true;
   const box=document.getElementById('isssdBackpassRule');if(box)box.checked=selected;
 }
 function mount(){
   if(document.getElementById('isssdSpecialRulesNav'))return;
   const ref=document.querySelector('.navbtn[data-page="dashboard"]')||document.querySelector('.navbtn[data-page]');
   const existingPage=document.querySelector('.page');if(!ref||!existingPage)return;
   const btn=ref.cloneNode(false);btn.id='isssdSpecialRulesNav';btn.type='button';btn.dataset.page='game-improvements';
   btn.innerHTML='<span class="navico" aria-hidden="true">✦</span><span>Melhorias de Jogo</span>';
   btn.classList.remove('active');ref.after(btn);
   const page=document.createElement('section');page.id='page-game-improvements';page.className='page';
   page.innerHTML=`<h2>Melhorias de Jogo</h2><p>Escolha as correções que deseja aplicar à ROM Plus. As opções são salvas no projeto. Desmarcadas, preservam o comportamento original do jogo.</p>
    <div class="card"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="isssdBackpassRule" aria-describedby="isssdBackpassDescription"> <strong>Impedir que usuário burle recuo ao goleiro.</strong></label>
    <p id="isssdBackpassDescription">Não deixa que o usuário com goleiro semiautomático segure a bola com as mãos após recuo de outro jogador de sua equipe.</p>
    <p>Ao agarrar um recuo proibido, o goleiro levanta e segura a bola por cerca de meio segundo antes da marcação de pênalti para o adversário. Dominar com os pés continua permitido.</p>
    <p>Ao salvar a ROM, inclua a fase <strong>12 · Melhorias de Jogo</strong>.</p></div>
    <div class="card"><h3>Próximas melhorias</h3><p>Ainda não disponíveis para aplicação:</p><ul>
    <li>Impedir o bug do pênalti que permite pegar a bola no replay após não defendê-la na cobrança.</li>
    <li>Permitir que o goleiro bata tiro de meta rasteiro com B.</li></ul></div>`;
   existingPage.parentElement.appendChild(page);
   page.querySelector('input').checked=selected;
   page.querySelector('input').addEventListener('change',e=>{selected=e.target.checked;window.studioUpdateBadge?.();});
   btn.addEventListener('click',e=>{
     e.preventDefault();e.stopImmediatePropagation();
     for(const p of document.querySelectorAll('.page')){p.classList.toggle('active',p===page);p.style.removeProperty('display');}
     for(const b of document.querySelectorAll('.navbtn[data-page]'))b.classList.toggle('active',b===btn);
     window.scrollTo?.({top:0,left:0,behavior:'instant'});
     const content=document.querySelector('.content');if(content)content.scrollTop=0;
   },true);
 }
 const previousFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){
   const out=(typeof previousFinalize==='function'?previousFinalize(project):project)||project;
   if(out?.state?.semantic)out.state.semantic.specialRulesV1=getState();return out;
 };
 const previousRestore=window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__;
 window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__=function(project){
   const result=typeof previousRestore==='function'?previousRestore(project):true;
   setState(project?.state?.semantic);return result;
 };
 const priorApply=window.studioApplyProjectWithBase;
 if(typeof priorApply==='function')window.studioApplyProjectWithBase=async function(project,...args){
   const previous=getState();try{const result=await priorApply.call(this,project,...args);setState(project?.state?.semantic);return result;}
   catch(error){setState({specialRulesV1:previous});throw error;}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.ISSSDSpecialRules={getState,restore:setState};
})();
