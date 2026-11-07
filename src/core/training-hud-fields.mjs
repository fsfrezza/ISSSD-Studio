export const TRAINING_HUD_FIELDS=Object.freeze([
 ['practice','TRAINING','TREINO',0xE511,0x5B16,'name',[0x120A94]],
 ['time','TIME','TEMPO',0xE52C,0x5B58,'small',[0x1208E6]],
 ['bonusTime','BONUS TIME','BÔNUS',0xE533,0x5B41,'small',[0x1208F0]],
 ['start','START','INÍCIO',0xE540,0x590E,'large',[0x120981]],
 ['clear','CLEAR','ACERTO',0xE550,0x590E,'large',[0x120A11,0x120A68,0x120AEA,0x120B32]],
 ['timeUp','TIME UP','FIM DO TEMPO',0xE560,0x590D,'large',[0x1209E3]],
 ['miss','MISS','ERRO',0xE574,0x590E,'large',[0x120A58,0x120B1B]],
 ['bonusChance','BONUS CHANCE','BÔNUS',0xE582,0x590B,'large',[0x120A1B,0x120A39]],
]);
export const TRAINING_HUD_SECTION={id:'training-hud',page:'texts-training',title:'Avisos e relógios do treino/desafio',area:'partida',fields:TRAINING_HUD_FIELDS.map(([id,en,pt])=>[id,en,pt,{trainingHud:true}])};
