// Canonical team-name state is semantic. Opening/filling this editor never writes ROM bytes.
(()=>{
 const entries=TEAM_NAME_LANGUAGE_PRESETS,clone=v=>JSON.parse(JSON.stringify(v));
 let saved={schema:'isssd-team-names-v1',values:{}},shown=-1;
 const preset=(team,language='portuguese',compact=false)=>{
  const row=entries.find(e=>e.teamId===Number(team));return row?(language==='english'?row.english:compact?row.compact:row.portuguese):null;
 };
 const node=id=>document.getElementById(id),current=()=>Number(window.currentTeam),isPlus=()=>window.activeRomProfile?.id==='iss-deluxe-plus';
 function status(text){const n=node('teamNameLanguageStatus');if(n&&n.textContent!==text)n.textContent=text;}
 function syncLabels(){
  if(!isPlus()||!Array.isArray(window.TEAM_NAMES))return;
  for(const [id,row]of Object.entries(saved.values))window.TEAM_NAMES[Number(id)]=row.full;
 }
 function edited(){const team=current(),full=node('teamNameFull')?.value,short=node('teamNameShort')?.value,big=node('teamNameBig')?.value;if(!Number.isInteger(team)||team<0||team>55||full===undefined||short===undefined)return;
  saved.values[String(team)]={full,big:big??full,short};syncLabels();status('Nomes guardados no projeto. A exportação da fase Seleção de equipes grava nomes pequenos, grandes e placar.');
 }
 function fill(language){
  const row=entries.find(e=>e.teamId===current());if(!row)return;
  const full=preset(current(),language),short=language==='portuguese'?row.compact:row.englishShort??row.english;
  if(node('teamNameFull'))node('teamNameFull').value=full;if(node('teamNameShort'))node('teamNameShort').value=short;if(node('teamNameBig'))node('teamNameBig').value=language==='portuguese'?row.big:row.english;edited();
 }
 function fillAll(){for(const row of entries)saved.values[String(row.teamId)]={full:row.portuguese,big:row.big,short:row.compact};shown=-1;syncLabels();install();status('Português preenchido para as 56 equipes. Salve o projeto ou gere a ROM com a fase Seleção de equipes marcada.');}
 function hydrate(project){const state=project?.state?.semantic?.teamNamesV1;saved=state?.schema==='isssd-team-names-v1'?clone(state):{schema:'isssd-team-names-v1',values:{}};saved.values||={};shown=-1;syncLabels();install();}
 function finalize(project){if(!project?.state)return project;project.state.semantic||={};if(Object.keys(saved.values).length)project.state.semantic.teamNamesV1=clone(saved);else delete project.state.semantic.teamNamesV1;return project;}
 function install(){
  const host=node('teamNameFunctionalCard');if(!host)return;
  let card=node('teamNamesIntegratedEditor');if(!card){
   card=document.createElement('div');card.id='teamNamesIntegratedEditor';
   const info=document.createElement('p');info.className='subtle';info.textContent='Nome completo no Editor; nome grande no painel e apresentações; nome curto na grade, placar e listas. Os três são salvos no projeto e gravados juntos na fase Seleção de equipes.';card.append(info);
   for(const [id,label,max]of [['teamNameFull','Nome completo · identificação no Editor',24],['teamNameBig','Nome grande · até 80 pixels',24],['teamNameShort','Nome curto · até 32 pixels',24]]){
    const wrap=document.createElement('label');wrap.style.cssText='display:grid;gap:6px;margin:10px 0';wrap.append(document.createTextNode(label));const input=document.createElement('input');input.id=id;input.type='text';input.maxLength=max;input.autocomplete='off';input.addEventListener('input',edited);wrap.append(input);card.append(wrap);
   }
   const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
   for(const [id,label,action]of [['portuguese','Usar em português',()=>fill('portuguese')],['english','Usar em inglês',()=>fill('english')],['all','Português em todas as equipes',fillAll],['original','Restaurar nomes originais',()=>{delete saved.values[String(current())];if(Array.isArray(window.TEAM_NAMES))window.TEAM_NAMES[current()]=preset(current(),'english');shown=-1;install();status('Nomes desta equipe restaurados. As demais alterações foram preservadas.');}]]){
    const button=document.createElement('button');button.type='button';button.className='btn';button.id='teamNameLanguage_'+id;button.textContent=label;button.onclick=action;actions.append(button);
   }
   card.append(actions);const text=document.createElement('div');text.id='teamNameLanguageStatus';text.className='note info';text.style.marginTop='12px';card.append(text);host.append(card);
  }
  const enabled=isPlus();card.hidden=!enabled;const legacy=node('nativeTeamNameEditor');if(legacy)enabled?legacy.style.setProperty('display','none','important'):legacy.style.removeProperty('display');
  const unavailable=node('nativeTeamNameUnavailable');if(unavailable)enabled?unavailable.style.setProperty('display','none','important'):unavailable.style.removeProperty('display');
  if(!enabled)return;
  const team=current();if(shown!==team){const row=entries.find(e=>e.teamId===team);if(!row)return;const value=saved.values[String(team)];node('teamNameFull').value=value?.full??row.english;node('teamNameShort').value=value?.short??row.englishShort??row.english;node('teamNameBig').value=value?.big??value?.full??row.english;shown=team;status('Edite livremente ou escolha uma sugestão. Acentos ficam no projeto; a fonte da ROM usa a forma sem acentos. Nomes que excederem o espaço serão recusados, sem corte automático.');}syncLabels();
 }
 const priorFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){priorFinalize?.(project);return finalize(project);};
 const priorOpen=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
 window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){await priorOpen?.(file);hydrate(JSON.parse(await file.text()));};
 window.__ISSSD_TEAM_NAME_LANGUAGES__={entries,preset,fill,fillAll,hydrate,finalize,install,snapshot:()=>clone(saved)};
 let timer;const observe=()=>{install();if(document.body)new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(install,80);}).observe(document.body,{childList:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
