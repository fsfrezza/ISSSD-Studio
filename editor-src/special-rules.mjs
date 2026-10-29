// Optional validated improvements; keep the existing project key.
(()=>{
 const KEY='goalkeeperBackpassNoHands';
 const SCHEMA='isssd-special-rules-v1';
 const PLUS_INCLUDED=Object.freeze({shortGoalKickB:true,lastAttackProtection:true,matchTimeSelection:true,oneMinuteMatch:true,penaltyInputFix:true,batterySave:true,playerOneSecretCodes:true});
 const includedLabels={shortGoalKickB:'Tiro de meta rasteiro com B',lastAttackProtection:'Aguardar o último ataque dentro da área adversária',matchTimeSelection:'Escolha do horário da partida',oneMinuteMatch:'Duração de 1 minuto',penaltyInputFix:'Correção de interferência na cobrança de pênalti',batterySave:'Salvar progresso por bateria',playerOneSecretCodes:'Códigos secretos pelo controle 1'};
 let selected=false;
 const getState=()=>({schema:SCHEMA,baseProfile:'iss-deluxe-plus',includedPlus:{...PLUS_INCLUDED},future:{penaltyReplayFix:false,deluxeBase:false},[KEY]:selected});
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
   page.innerHTML=`<h2>Melhorias de Jogo</h2><p>A Plus continua como ROM-base. As melhorias que ela já contém estão marcadas e bloqueadas. O recuo é opcional. Todas as escolhas ficam no projeto.</p>
    <div class="card"><div class="sectionbar"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="isssdBackpassRule" aria-describedby="isssdBackpassDescription"> <strong>Impedir que usuário burle recuo ao goleiro.</strong></label></div>
    <p id="isssdBackpassDescription">Não deixa que o usuário com goleiro semiautomático segure a bola com as mãos após recuo de outro jogador de sua equipe.</p>
    <p>Ao agarrar um recuo proibido, o goleiro levanta e segura a bola por cerca de meio segundo antes da marcação de pênalti para o adversário. Dominar com os pés continua permitido.</p>
    <p>Ao salvar a ROM, inclua a fase <strong>12 · Melhorias de Jogo</strong>.</p></div>
    <div class="card"><div class="sectionbar"><h3>Incluídas na Plus · separação futura</h3></div><p>Presentes na base Plus. Serão opções independentes quando houver suporte à base Deluxe.</p>
    ${Object.entries(includedLabels).map(([id,label])=>`<label style="display:flex;gap:10px;margin:12px 0"><input type="checkbox" checked disabled data-plus-included="${id}"><span>${label}</span></label>`).join('')}</div>
    <div class="card"><div class="sectionbar"><h3>Planejadas · indisponíveis</h3></div>
    <label style="display:flex;gap:10px;margin:12px 0"><input type="checkbox" disabled><span>Impedir defesa da bola durante o replay do pênalti</span></label>
    <label style="display:flex;gap:10px;margin:12px 0"><input type="checkbox" disabled><span>Usar Deluxe original como base e aplicar somente as opções escolhidas</span></label></div>`;
   existingPage.parentElement.appendChild(page);
   page.querySelector('#isssdBackpassRule').checked=selected;
   page.querySelector('#isssdBackpassRule').addEventListener('change',e=>{selected=e.target.checked;window.studioUpdateBadge?.();});
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
