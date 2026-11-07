import {TRAINING_HUD_FIELDS} from './training-hud-fields.mjs';
import {MATCH_STATISTICS_FIELDS} from './match-statistics-fields.mjs';
import {plusTrainingHudWriter,encodeTrainingHud} from './plus-training-hud.mjs';
import {plusMatchStatisticsWriter,renderMatchStatistics} from './plus-match-statistics.mjs';
export {TRAINING_HUD_FIELDS,MATCH_STATISTICS_FIELDS,encodeTrainingHud,renderMatchStatistics};
function validate(values,fields,label){
 if(values===undefined)return;
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error(label+': objeto inválido');
 for(const [id,value]of Object.entries(values)){
  if(!fields.some(f=>f[0]===id))throw Error(label+': campo desconhecido '+id);
  if(typeof value!=='string'||!value.trim())throw Error(label+': texto vazio ou inválido');
 }
}
export function applyDeluxeMatchTexts(out,base,changes){
 validate(changes.trainingHud,TRAINING_HUD_FIELDS,'Treino');validate(changes.matchStatistics,MATCH_STATISTICS_FIELDS,'Estatísticas');
 // Reuse both Plus writers with their complete original-data preflight.
 plusTrainingHudWriter(out,{additionalScreenTextsV1:{values:{'training-hud':changes.trainingHud}}},base);
 plusMatchStatisticsWriter(out,{additionalScreenTextsV1:{values:{'match-statistics':changes.matchStatistics}}},base);
 return out;
}
