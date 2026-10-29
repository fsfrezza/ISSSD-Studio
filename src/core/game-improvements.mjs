import {buildExperimentalBackpassPenalty,experimentalBackpassHooks} from './experimental-backpass-penalty.mjs';
export const GAME_IMPROVEMENTS_AREA='melhorias-jogo';
export const GAME_IMPROVEMENT_RANGES=Object.freeze([...experimentalBackpassHooks().writes.map(([off,bytes])=>[off,off+bytes.length]),[0x7FD8,0x7FD9]]);
export function gameImprovementsWriter(work,state,base,selectedAreas=null){
 if(state?.specialRulesV1?.goalkeeperBackpassNoHands!==true)return work;
 if(selectedAreas&&!selectedAreas.includes(GAME_IMPROVEMENTS_AREA))return work;
 const verified=buildExperimentalBackpassPenalty(base);
 for(const [start,end] of GAME_IMPROVEMENT_RANGES)for(let off=start;off<end;off++){
  const original=off<base.length?base[off]:255;
  if(work[off]!==original&&work[off]!==verified[off])throw Error('Melhorias de Jogo: conflito com outra alteração em 0x'+off.toString(16));
 }
 for(const [start,end] of GAME_IMPROVEMENT_RANGES)work.set(verified.subarray(start,end),start);
 return work;
}
