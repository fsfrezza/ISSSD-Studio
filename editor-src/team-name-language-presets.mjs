// Suggestions fill the existing editable field; applying/saving remains explicit.
(()=>{
 const entries=TEAM_NAME_LANGUAGE_PRESETS;
 const preset=(team,language='portuguese',compact=false)=>{
  const row=entries.find(e=>e.teamId===Number(team));
  return row?(language==='english'?row.english:compact?row.compact:row.portuguese):null;
 };
 function fill(language){
  const input=document.getElementById('teamReferenceName');
  const compact=document.getElementById('teamNamePortugueseCompact')?.checked===true;
  const name=preset(window.currentTeam,language,compact);if(!input||name===null)return;
  input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('teamNameLanguageStatus').textContent='Sugestão preenchida: '+name+'. Revise o nome e use o comando de aplicação desta tela. As outras equipes permanecem como estão.';
  document.getElementById('teamGfxGenerateBtn')?.click();
 }
 function install(){
  const input=document.getElementById('teamReferenceName');if(!input||document.getElementById('teamNameLanguageActions'))return;
  const actions=document.createElement('div');actions.id='teamNameLanguageActions';actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
  for(const [language,label]of [['portuguese','Usar em português'],['english','Usar em inglês']]){
   const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=label;button.id='teamNameLanguage_'+language;button.onclick=()=>fill(language);actions.append(button);
  }
  const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:6px';const compact=document.createElement('input');compact.type='checkbox';compact.id='teamNamePortugueseCompact';label.append(compact,document.createTextNode('Preferir nome curto em português'));actions.append(label);
  const status=document.createElement('div');status.id='teamNameLanguageStatus';status.className='subtle';status.textContent='Sugestões por equipe. Você pode editar o resultado livremente. Acentos ficam no texto; a fonte nativa usa a forma sem acentos. Na Plus, o comando atual aplica somente o nome superior.';
  input.after(actions,status);
 }
 window.__ISSSD_TEAM_NAME_LANGUAGES__={entries,preset,fill,install};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
