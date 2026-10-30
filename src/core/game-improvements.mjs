import {buildExperimentalBackpassPenalty,experimentalBackpassHooks} from './experimental-backpass-penalty.mjs';
import {goalkeeperSetPiecesWriter,GOALKEEPER_TAKER_RANGES,GOALKEEPER_SHARED_BODY_HOOKS} from './goalkeeper-set-pieces.mjs';
export const GAME_IMPROVEMENTS_AREA='melhorias-jogo';
const BACKPASS_RANGES=[...experimentalBackpassHooks().writes.map(([off,bytes])=>[off,off+bytes.length]),[0x7FD8,0x7FD9]];
export const GAME_IMPROVEMENT_RANGES=Object.freeze([...BACKPASS_RANGES,...GOALKEEPER_TAKER_RANGES.filter(([start])=>!GOALKEEPER_SHARED_BODY_HOOKS.includes(start))]);
export function gameImprovementsWriter(work,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes(GAME_IMPROVEMENTS_AREA))return work;
 const rules=state?.specialRulesV1;
 if(rules?.goalkeeperBackpassNoHands!==true)return goalkeeperSetPiecesWriter(work,rules,base);
 const verified=buildExperimentalBackpassPenalty(base);
 for(const [start,end] of BACKPASS_RANGES)for(let off=start;off<end;off++){
  const original=off<base.length?base[off]:255;
  if(work[off]!==original&&work[off]!==verified[off])throw Error('Melhorias de Jogo: conflito com outra alteração em 0x'+off.toString(16));
 }
 goalkeeperSetPiecesWriter(work,rules,base);
 for(const [start,end] of BACKPASS_RANGES)work.set(verified.subarray(start,end),start);
 return work;
}
