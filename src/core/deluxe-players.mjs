import {structureActive,expandedPlayerOffsets} from './deluxe-structure.mjs';
import {decodePlayerRecord,writeSkill,writeNaturalPosition,writeJersey} from './plus-player.mjs';
import {decodeFixedPlayerName,encodeFixedPlayerName,formatPlayerName} from './plus-player-name.mjs';
import {DELUXE_TEAMS} from './deluxe-team-catalog.mjs';
export {DELUXE_TEAMS};
export const PLAYER_SKILLS={acceleration:'Arranque',speed:'Rapidez',shot:'Chute',curve:'Efeito',balance:'Firmeza',intelligence:'Inteligência',dribbling:'Drible',jump:'Pulo',energy:'Resistência'};
export const PLAYER_POSITIONS=['Sem posição','Goleiro','Defensor','Defensor / Meio-campista','Meio-campista','Meio-campista / Atacante','Atacante'];
export function deluxePlayerOffsets(base,team,player){
 if(structureActive(base))return expandedPlayerOffsets(base,team,player);
 if(!Number.isInteger(team)||team<0||team>=36||!Number.isInteger(player)||player<0||player>=20)throw Error('Jogador fora dos 36 elencos regulares');
 const ptr=base[0x38138+team*2]|base[0x38139+team*2]<<8;
 if(ptr!==0x818e+team*160)throw Error('Tabela de nomes Deluxe incompatível');
 return {record:0x50000+(team*20+player)*7,name:0x30000+ptr+player*8};
}
export function readDeluxePlayer(base,team,player,edits={}){
 const at=deluxePlayerOffsets(base,team,player),raw=base.slice(at.record,at.record+7),record=decodePlayerRecord(raw),edit=edits[team+':'+player]??{};
 const skills=Object.fromEntries(Object.keys(PLAYER_SKILLS).map(k=>[k,edit.skills?.[k]??record[k]+1]));
 return {team,player,name:edit.name??decodeFixedPlayerName(base.slice(at.name,at.name+8)).trim(),jersey:edit.jersey??record.jersey,naturalPosition:edit.naturalPosition??record.naturalPosition,skills,appearanceRaw:record.appearanceRaw};
}
function object(v,label){if(!v||typeof v!=='object'||Array.isArray(v))throw Error(label+': objeto inválido');return v;}
export function applyDeluxePlayers(out,base,edits){
 if(edits===undefined)return out;object(edits,'Jogadores');const writes=[],teams=new Set();
 for(const [id,edit]of Object.entries(edits)){
  if(!/^(?:[0-9]|[1-4][0-9]|5[0-3]):(?:[0-9]|1[0-9])$/.test(id))throw Error('Identificador de jogador inválido');
  object(edit,'Jogador');if(Object.keys(edit).some(k=>!['name','jersey','naturalPosition','skills'].includes(k)))throw Error('Campo de jogador não suportado');
  const [team,player]=id.split(':').map(Number),at=deluxePlayerOffsets(base,team,player),raw=base.slice(at.record,at.record+7);teams.add(team);
  if(edit.name!==undefined){if(typeof edit.name!=='string'||!edit.name.trim())throw Error('Nome de jogador vazio ou inválido');const original=decodeFixedPlayerName(base.slice(at.name,at.name+8)).trim();if(edit.name!==original)writes.push([at.name,encodeFixedPlayerName(formatPlayerName(edit.name,'center'))]);}
  if(edit.skills!==undefined){object(edit.skills,'Atributos');for(const [k,v]of Object.entries(edit.skills)){if(!Object.hasOwn(PLAYER_SKILLS,k))throw Error('Atributo desconhecido');writeSkill(raw,k,v);}}
  if(edit.naturalPosition!==undefined)writeNaturalPosition(raw,edit.naturalPosition);
  if(edit.jersey!==undefined)writeJersey(raw,edit.jersey);
  writes.push([at.record,raw]);
 }
 for(const team of teams){const nums=Array.from({length:20},(_,p)=>readDeluxePlayer(base,team,p,edits).jersey);if(nums.some(v=>!Number.isInteger(v)||v<1||v>20)||new Set(nums).size!==20)throw Error('Os números da equipe devem conter 1 a 20, sem repetição');}
 for(const [at,bytes]of writes)out.set(bytes,at);return out;
}
export function planDeluxeJerseySwap(base,edits,team,player,jersey){
 if(!Number.isInteger(jersey)||jersey<1||jersey>20)throw Error('Número deve ser de 1 a 20');const current=readDeluxePlayer(base,team,player,edits),other=Array.from({length:20},(_,p)=>readDeluxePlayer(base,team,p,edits)).find(p=>p.player!==player&&p.jersey===jersey);
 const result=structuredClone(edits);(result[team+':'+player]??={}).jersey=jersey;if(other)(result[team+':'+other.player]??={}).jersey=current.jersey;return result;
}
