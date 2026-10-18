// Halftime/final statistics and the goal-history panel share this native font.
export const MATCH_STATISTICS_FIELDS=Object.freeze([
 ['shots','SHOTS','CHUTES',0xF1EB],['freeKicks','F.K.','FALTAS',0xF201],
 ['cornerKicks','C.K.','ESCANTEIOS',0xF217],['penaltyKicks','P.K.','PÊNALTIS',0xF22D],
 ['yellowCards','YELLOW CARDS','CARTÕES AMARELOS',0xF243],
 ['redCards','RED CARDS','CARTÕES VERMELHOS',0xF259],
 ['offsides','OFF SIDE','IMPEDIMENTOS',0xF26F],
 ['ownGoal','OWN GOAL','GOL CONTRA'],['firstHalf','1ST','1T'],['secondHalf','2ND','2T'],
]);
export const MATCH_STATISTICS_SECTION={id:'match-statistics',page:'texts-match',title:'Estatísticas e histórico de gols',area:'partida',fields:MATCH_STATISTICS_FIELDS.map(([id,en,pt])=>[id,en,pt,{matchStatistics:true}])};
