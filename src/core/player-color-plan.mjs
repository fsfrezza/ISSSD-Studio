import {validatePlayerColors,appearanceChoice,allocateAppearanceChoices} from './player-color-catalog.mjs';
import {readNativeAppearancePalettes} from './player-appearance.mjs';
import {playerOffset} from './plus-player.mjs';
const words=record=>Array.from({length:(record.length-2)/2},(_,i)=>record[2+i*2]|record[3+i*2]<<8);
export function preparePlayerColorState(base,state){
 const value=validatePlayerColors(state.playerColorsV1),ids=[...new Set(Object.keys(value.players).map(k=>Number(k.split(':')[0])))];if(!ids.length)return state;
 if(!state.independentTeamsV1)throw Error('Pele/cabelo do catálogo exigem a estrutura atual de equipes independentes. Reabra o projeto no Editor atualizado.');
 const out=structuredClone(state);out.playerColorsV1=value;out.__playerColorPlans={};
 for(const team of ids){
  const independent=out.independentTeamsV1.teams[team],players=out.teamsV1?.teams?.[team]?.players||[];let palettes;
  if(independent){const p=independent.data.palettes,a=words(p.home),b=a.slice();if(p.skinAlt)b.splice(2,5,...words(p.skinAlt));if(p.hairAlt)b[1]=words(p.hairAlt)[0];palettes=[a,b];}
  else palettes=readNativeAppearancePalettes(base,team).palettes;
  const roster=[];
  for(let slot=1;slot<=20;slot++){
   const p=players.find(p=>Number(p.slot)===slot),identity=independent?slot:Number(p?.baseSlot??slot),offset=independent?(slot-1)*7:playerOffset(team,identity-1),bytes=independent?independent.data.attributes:base;
   const pos=p?.custom?.position??(bytes[offset+4]>>4);if(pos===1||['GO','GK'].includes(String(pos).toUpperCase()))continue;
   const palette=p?.custom?.appearance?.palette??(bytes[offset+6]>>4&1),choice=value.players[team+':'+identity]??appearanceChoice(palettes[palette]);
   roster.push({slot,choice});
  }
  try{out.__playerColorPlans[team]=allocateAppearanceChoices(roster);}catch(e){throw Error('Equipe '+team+': '+e.message);}
 }return out;
}
