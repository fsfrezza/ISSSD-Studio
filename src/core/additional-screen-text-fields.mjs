// User-approved inscriptions. Keeping this catalog shared by UI and export
// prevents a visible editable field from silently disappearing during a build.
export const ADDITIONAL_TEXT_SECTIONS=Object.freeze([
 {id:'player-labels',page:'players',title:'Textos da tela de jogadores',area:'jogadores',fields:[
  ['player','PLAYER','JOGADOR'],['substitute','SUBSTITUTE','RESERVA'],
  ['speed','SPEED','RAPIDEZ'],['dash','DASH','ARRANQUE'],
  ['shotPower','SHOTPOWR','FORÇA-CHUTE'],['curlSkill','CURLSKILL','EFEITO'],
  ['balance','BALANCE','EQUILÍBRIO'],['intelligence','INTELLIGENCE','INTELIGÊNCIA'],
  ['jump','JUMP','PULO'],['dribble','DRIBBLE','DRIBLE'],
  ['stamina','STAMINA','RESISTÊNCIA'],['pointsLeft','POINTS LEFT','RESTANTES'],
 ]},
 {id:'formation-labels',page:'teams',title:'Textos da tela de formações',area:'formacoes',fields:[
  ['formationType','TYPE OF FORMATION','TIPO DE FORMAÇÃO'],
  ['attackParticipation','ATTACK PARTICIPATION','APOIO AO ATAQUE'],
  ['defenders','DF','DF'],['midfielders','MF','MC'],['forwards','FW','AT'],
 ]},
 {id:'strategy-labels',page:'strategies',title:'Textos auxiliares de estratégias',area:'textos-estrategias',fields:[
  ['one','ONE','UMA'],['four','FOUR','QUATRO'],
 ]},
 {id:'control-labels',page:'controls',title:'Textos auxiliares dos controles',area:'pre-partida',fields:[
  ['type','TYPE','TIPO'],['typeA','TYPE-A','TIPO-A'],['area','AREA','ÁREA'],['areaA','AREA-A','ÁREA-A'],
  ['cursorChange','CURSOR CHANGE','TROCA DE CURSOR'],
  ['pageHelp','Turn the page by pressing the L/R buttons.','Troque a página usando os botões L/R.'],
 ]},
 {id:'uniform-labels',page:'uniforms',title:'Textos da tela de uniformes',area:'pre-partida',fields:[
  ['shirt','SHIRT','CAMISA'],['pants','PANTS','CALÇÃO'],['socks','SOCKS','MEIAS'],
  ['color','COLOR','COR'],['type','TYPE','TIPO'],['edit','EDIT','EDITAR'],
 ]},
 {id:'navigation-labels',page:'match-options',title:'Botões de navegação compartilhados',area:'pre-partida',fields:[
  ['exit','EXIT','SAIR'],['reset','RESET','RESTAURAR'],['cancel','CANCEL','CANCELAR'],['ok','OK','OK'],
 ]},
]);
export const normalizeAdditionalText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
export function additionalTextValues(semantic={}){
 const state=semantic.additionalScreenTextsV1;
 return state?.schema==='isssd-additional-screen-texts-v1'?state.values||{}:{};
}

// Until the graphics writers have verified layouts, never silently ignore
// confirmed new text or let it appear as successfully exported in a ZIP.
export function validateAdditionalTextExport(semantic={},selectedAreas=null){
 const values=additionalTextValues(semantic);
 const pending=[];
 for(const section of ADDITIONAL_TEXT_SECTIONS){
  if(selectedAreas&&!selectedAreas.includes(section.area))continue;
  for(const [id,english] of section.fields){
   if(Object.hasOwn(values[section.id]||{},id)&&String(values[section.id][id])!==english)pending.push(section.title+' · '+english);
  }
 }
 if(pending.length)throw new Error('Os novos campos estão salvos no projeto, mas sua gravação na ROM ainda não está disponível: '+pending.join(', ')+'. Restaure os originais desta seção ou desmarque a fase correspondente para exportar as demais alterações.');
 return true;
}
