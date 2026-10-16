import {NATIVE_MENU_TEXT_SECTIONS} from './native-menu-text-fields.mjs';
import {CURSOR_LABEL_IDS} from './cursor-label-layout.mjs';
import {CURSOR_HELP_FIELDS,CURSOR_PORTUGUESE} from './cursor-text-fields.mjs';
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
 {id:'cursor-labels',aliases:['control-labels'],page:'texts-cursor',title:'Textos Cursor',area:'pre-partida',fields:[
  ...[
   ['type','TYPE'],['typeA','TYPE-A'],['typeB','TYPE-B'],['typeC','TYPE-C'],['typeD','TYPE-D'],
   ['area','AREA'],['areaA','AREA-A'],['areaB','AREA-B'],['areaC','AREA-C'],
   ['cursorChange','CURSOR CHANGE'],['cursorAuto','AUTO'],['cursorManual','MANUAL'],
  ].map(([id,english])=>[id,english,CURSOR_PORTUGUESE[id]]),
  ...CURSOR_HELP_FIELDS,
 ]},
 {id:'uniform-labels',page:'uniforms',title:'Textos da tela de uniformes',area:'pre-partida',fields:[
  ['shirt','SHIRT','CAMISA'],['pants','PANTS','CALÇÃO'],['socks','SOCKS','MEIAS'],
  ['color','COLOR','COR'],['type','TYPE','TIPO'],['edit','EDIT','EDITAR'],
 ]},
 {id:'navigation-labels',page:'match-options',title:'Botões de navegação compartilhados',area:'pre-partida',fields:[
  ['exit','EXIT','SAIR'],['reset','RESET','RESTAURAR'],['cancel','CANCEL','CANCELAR'],['ok','OK','OK'],
 ]},
 ...NATIVE_MENU_TEXT_SECTIONS,
]);
export const normalizeAdditionalText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
export function additionalTextValues(semantic={}){
 const state=semantic.additionalScreenTextsV1;
 const values=state?.schema==='isssd-additional-screen-texts-v1'?state.values||{}:{};
 const out={...values};
 for(const section of ADDITIONAL_TEXT_SECTIONS)if(section.aliases)out[section.id]=Object.assign({},...section.aliases.map(a=>values[a]||{}),values[section.id]||{});
 return out;
}

// Unimplemented inscriptions are an explicit export report, not a fatal error.
// Leave confirmed values/drafts untouched; supported writers still run normally.
export function pendingAdditionalTextExports(semantic={},selectedAreas=null){
 const values=additionalTextValues(semantic),pending=[];
 for(const section of ADDITIONAL_TEXT_SECTIONS){
  if(selectedAreas&&!selectedAreas.includes(section.area))continue;
  for(const [id,english,,options] of section.fields){
   if(options?.pool||options?.native||(section.id==='cursor-labels'&&CURSOR_LABEL_IDS.includes(id)))continue;
   const fields=values[section.id]||{};
   if(Object.hasOwn(fields,id)&&String(fields[id])!==english)pending.push({
    section:section.id,sectionTitle:section.title,field:id,label:english,
    requested:String(fields[id]),original:english,area:section.area,
    status:'not-applied',reason:'native-writer-unavailable',
   });
  }
 }
 return pending;
}
export function pendingTextExportReport(pending=[]){
 if(!pending.length)return '';
 return 'TEXTOS PENDENTES — NÃO APLICADOS ÀS ROMS\n'+
  'O ZIP foi gerado com as alterações suportadas. Estes novos textos continuam salvos no projeto, mas não foram gravados nas ROMs.\n\n'+
  pending.map(p=>p.sectionTitle+' · '+p.label+'\nFase: '+p.area+'\nTexto solicitado: '+JSON.stringify(p.requested)+'\nMotivo: gravador nativo ainda não disponível.').join('\n\n')+'\n';
}
