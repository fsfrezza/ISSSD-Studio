import {DELUXE_TEAMS} from './deluxe-team-catalog.mjs';
import {DELUXE_MENU_SECTIONS,encodeNativeMenuField} from './deluxe-menu-text.mjs';

export const SCENARIO_BASE=0x5fcf8, SCENARIO_COUNT=12, SCENARIO_STRIDE=15;
export const SCENARIO_RESTARTS=['ESCANTEIO','FALTA','ESCANTEIO','FALTA','LATERAL','FALTA','FALTA','TIRO DE META','FALTA','ESCANTEIO','FALTA','ESCANTEIO'];
const fields=DELUXE_MENU_SECTIONS.find(s=>s.id==='scenario-native').fields;
const word=(b,p)=>b[p]|b[p+1]<<8;
const seconds=v=>((v>>8&15)*60)+(v>>4&15)*10+(v&15);
const timer=s=>((Math.floor(s/60))<<8)|((Math.floor(s%60/10))<<4)|s%10;
const hexId=n=>'data_'+n.toString(16);
export const scenarioHeaderId=i=>hexId(0x87ee3b+i*56);
export const scenarioDescriptionId=i=>hexId(0x87f12d+i*156);
export const scenarioTextField=id=>fields.find(f=>f[0]===id);
export function scenarioDefaultDescription(i){return (i===2?'\n'.repeat(7):'')+'Vença a partida!\nAproveite a jogada inicial\npara buscar a vitória.';}
export function readDeluxeScenario(base,i){
 if(!Number.isInteger(i)||i<0||i>=12)throw Error('Cenário inválido');
 const p=SCENARIO_BASE+i*15;
 return {team1:base[p+4]/2,team2:base[p+5]/2,score1:base[p+6],score2:base[p+7],seconds:seconds(word(base,p+2)),referee:base[0x5fdac+i]};
}
export function scenarioTeamNames(structure){return structure?.teams.map(t=>t.name)??DELUXE_TEAMS;}
export function scenarioClock(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
const name=(s,max)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 .-]/g,'').trim().slice(0,max).trim();
export function scenarioTexts(i,v,names){
 const score=` ${v.score1}-${v.score2} `,space=28-score.length,fullA=name(names[v.team1],32),fullB=name(names[v.team2],32),half=Math.floor(space/2),a=name(fullA,Math.max(half,space-fullB.length)),b=name(fullB,space-a.length);
 // The native menu draws its TIME REMAINING label in the first six cells.
 const restart=`      ${scenarioClock(v.seconds)} ${SCENARIO_RESTARTS[i]}`;
 const suffix=fullA.length+restart.length+1<=28?' '+fullA:'';
 return {[scenarioHeaderId(i)]:a+score+b+'\n'+restart+suffix,[scenarioDescriptionId(i)]:v.description??scenarioDefaultDescription(i)};
}
export function validateDeluxeScenario(i,v,names){
 if(!Number.isInteger(i)||i<0||i>=12||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['team1','team2','score1','score2','seconds','referee','description'].includes(k)))throw Error('Cenário inválido');
 for(const key of ['team1','team2','score1','score2','seconds','referee']){const max=key.startsWith('team')?names.length-1:key.startsWith('score')?9:key==='seconds'?539:2;if(!Number.isInteger(v[key])||v[key]<0||v[key]>max)throw Error('Cenário: valor inválido em '+key);}
 if(v.team1===v.team2)throw Error('Selecione duas equipes diferentes.');
 if(v.description!==undefined&&typeof v.description!=='string')throw Error('Descrição inválida');
 const texts=scenarioTexts(i,v,names);for(const [id,value]of Object.entries(texts))encodeNativeMenuField(scenarioTextField(id),value);
 return texts;
}
export function applyDeluxeScenarios(out,base,changes){
 const values=changes.scenarios;if(values===undefined&&!changes.menuTexts?.['scenario-native'])return changes.menuTexts;
 if(values!==undefined&&(!values||typeof values!=='object'||Array.isArray(values)))throw Error('Cenários inválidos');
 const names=scenarioTeamNames(changes.structure),menus=structuredClone(changes.menuTexts??{}),section=menus['scenario-native']??={};
 // Existing translated headers may still contain the legacy scenario number.
 // The selection rectangles use a separate native number table; never modify it.
 for(let i=0;i<SCENARIO_COUNT;i++){const id=scenarioHeaderId(i),text=section[id];if(typeof text==='string')section[id]=text.replace(/^\s*N(?:O)?\.\s*\d+\s*/i,'');else if(values!==undefined)section[id]=scenarioTextField(id)[1].replace(/^\s*N(?:O)?\.\s*\d+\s*/i,'');}
 for(const [key,v]of Object.entries(values??{})){
  const i=Number(key);if(String(i)!==key)throw Error('Índice de cenário inválido');
  Object.assign(section,validateDeluxeScenario(i,v,names));
  const p=SCENARIO_BASE+i*15,original=readDeluxeScenario(base,i);
  if(v.seconds!==original.seconds){const extra=Math.max(0,seconds(word(base,p))-original.seconds),internal=timer(v.seconds+extra),display=timer(v.seconds);out.set([internal&255,internal>>8,display&255,display>>8],p);}
  out.set([v.team1*2,v.team2*2,v.score1,v.score2],p+4);out[0x5fdac+i]=v.referee;
 }
 return menus;
}
