(()=>{
 const api=window.ISSSDIndependentTeams,clone=v=>structuredClone(v);let saved=null,groups=null,openedGroups=null;
 const core=()=>window.__ISSSD_UNIFIED_TEAM_CORE__;
 function note(text){const n=document.getElementById('plusGroupWarnings');if(n)n.textContent=text;window.studioUpdateBadge?.();}
 function finalize(project){if(!project?.state)return project;project.state.semantic||={};if(saved){project.state.semantic.independentTeamsV1=api.validateIndependentTeams(core()?.model()??saved);project.state.semantic.plusGroups=clone(groups);}else if(project.state.semantic.independentTeamsV1)project.state.semantic.independentTeamsV1=api.validateIndependentTeams(project.state.semantic.independentTeamsV1);return project;}
 function renderGroups(host){if(!saved||!groups)return;
 const apply=document.getElementById('plusGroupsApplyBtn');if(apply)apply.onclick=()=>note('Organização guardada no projeto. Salve o projeto ou gere a ROM.');
 const restore=document.getElementById('plusGroupsRestoreBtn');if(restore){restore.textContent='Restaurar grupos do projeto aberto';restore.onclick=()=>{groups=clone(openedGroups);renderGroups(host);note('Organização restaurada.');};}
 const exp=document.getElementById('plusGroupsExportBtn');if(exp)exp.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(core().exportGroups(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ISSSD-grupos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const file=document.getElementById('plusGroupsImportFile');if(file)file.onchange=async()=>{try{const value=JSON.parse(await file.files[0].text()),rows=[...(value.groups??[]),value.secret];if(rows.length!==10||rows.some(r=>!Array.isArray(r)||r.length!==6)||rows.flat().some(t=>!Number.isInteger(t)||t<0||t>=60)||new Set(rows.flat()).size!==60||value.labels?.length!==10)throw Error('Use dez grupos com as 60 equipes, sem duplicações.');groups={...groups,groups:clone(value.groups),secret:clone(value.secret),labels:clone(value.labels)};renderGroups(host);note('Grupos importados.');}catch(e){note(e.message);}finally{file.value='';}};
host.replaceChildren();const rows=[...groups.groups,groups.secret];for(let g=0;g<10;g++){
  const card=document.createElement('div');card.className='plus-group-card';const label=document.createElement('input');label.value=groups.labels[g];label.setAttribute('aria-label','Nome do grupo '+(g+1));label.onchange=()=>{if(!label.value.trim())return;groups.labels[g]=label.value.trim();note('Nome do grupo salvo no projeto.');};card.append(label);
  const count=document.createElement('span');count.className='badge';count.textContent='6 equipes';card.append(count);const slots=document.createElement('div');slots.className='plus-group-slots';card.append(slots);
  for(let i=0;i<6;i++){const wrap=document.createElement('label');wrap.textContent='Posição '+(i+1);const select=document.createElement('select');for(let t=0;t<60;t++){const o=document.createElement('option');o.value=t;o.textContent=(t+1)+' · '+(saved.teams[t]?.name||window.TEAM_NAMES?.[t]||'Equipe '+(t+1));select.append(o);}select.value=rows[g][i];select.onchange=()=>{const next=Number(select.value),other=rows.findIndex(row=>row.includes(next)),index=rows[other].indexOf(next);rows[other][index]=rows[g][i];rows[g][i]=next;renderGroups(host);note('Organização salva no projeto.');};wrap.append(select);slots.append(wrap);}host.append(card);
 }}
 const prior=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){return finalize(prior?.(project)??project);};
 const collect=window.studioProjectObject;if(typeof collect==='function')window.studioProjectObject=async function(...args){const project=await collect.apply(this,args);return finalize(window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(project)??project);};
 const stringify=window.studioProjectStringify;if(typeof stringify==='function')window.studioProjectStringify=function(project,...args){
  if(saved)finalize(project);
  if(api.independentTeamLabelsNeedRecovery(project))throw Error('Projeto incompleto: os nomes adicionais não têm registros. Reabra o projeto para recuperá-los.');
  const text=stringify.call(this,project,...args),disk=JSON.parse(text);
  if(api.independentTeamLabelsNeedRecovery(disk)||saved&&!disk.state?.semantic?.independentTeamsV1)throw Error('O salvamento perdeu os registros das seis equipes; o arquivo não será baixado.');
  return text;
 };
 const apply=window.studioApplyProjectWithBase;if(typeof apply==='function')window.studioApplyProjectWithBase=async function(project,...args){
  let recovered=false;if(api.independentTeamLabelsNeedRecovery(project)){const response=await fetch('/__isssd/recover-independent-teams',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project})});const result=await response.json();if(!response.ok||!result.project)throw Error(result.error||'Não foi possível recuperar as seis equipes.');project=result.project;recovered=true;}
  const next=api.validateIndependentTeams(project?.state?.semantic?.independentTeamsV1),old=saved,oldGroups=groups,legacy=next?clone(project):project;
  if(next){delete legacy.state.semantic.independentTeamsV1;delete legacy.state.semantic.plusGroups;if(legacy.state.ui){if(legacy.state.ui.currentTeam>=54)legacy.state.ui.currentTeam=0;if(legacy.state.ui.teamNames)legacy.state.ui.teamNames=[...legacy.state.ui.teamNames.slice(0,54),api.normalNames[54],api.normalNames[55]];}for(let t=54;t<60;t++){if(legacy.state.ui?.teamNameEdits)delete legacy.state.ui.teamNameEdits[t];if(legacy.state.semantic.teamNamesV1?.values)delete legacy.state.semantic.teamNamesV1.values[t];}}
  core()?.activate(null);
  try{const result=await apply.call(this,legacy,...args);saved=next;groups=next?clone(project.state.semantic.plusGroups):null;openedGroups=groups?clone(groups):null;core()?.activate(saved);window.__ISSSD_UNIFORMS_EDITOR__?.render();window.__ISSSD_GOALKEEPERS_EDITOR__?.render();window.__ISSSD_TEAM_NAME_LANGUAGES__?.install();if(recovered)note('Seis equipes recuperadas e grupo GG restaurado. Salve o projeto para preservar os registros completos.');return result;}
  catch(e){saved=old;groups=oldGroups;core()?.activate(saved);throw e;}
 };
 window.__ISSSD_INDEPENDENT_TEAMS_EDITOR__={snapshot:()=>saved?api.validateIndependentTeams(core()?.model()??saved):null,replaceModel(value){saved=value;},renderGroups,groups:()=>clone(groups),finalize,install(){window.__ISSSD_INSTALL_UNIFIED_TEAM_CORE__?.();},render(){core()?.refresh();}};
 window.__ISSSD_PROJECT_TEAM_RECORDS_GUARD__='v1';
 function boot(){const style=document.createElement('style');style.textContent='body[data-unified-teams="60"] #plusTeamExpansionCard{display:none!important}';document.head.append(style);window.__ISSSD_INSTALL_UNIFIED_TEAM_CORE__?.();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
