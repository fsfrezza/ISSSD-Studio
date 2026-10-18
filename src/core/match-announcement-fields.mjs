export const MATCH_ANNOUNCEMENTS=Object.freeze([
 ['goal','GOAL','GOL!',0xE7F6,16],['foul','FOUL','FALTA',0xE838,2],
 ['ownGoal','OWN GOAL','GOL CONTRA',0xE842,4],['yellowCard','YELLOW CARD','CARTÃO AMARELO',0xE854,5],
 ['redCard','RED CARD','CARTÃO VERMELHO',0xE86A,4],['cornerKick','CORNER KICK','ESCANTEIO',0xE87C,5],
 ['offside','OFF SIDE','IMPEDIMENTO',0xE892,4],['penaltyKick','PENALTY KICK','PÊNALTI',0xE8A4,6],
 ['timeUp','TIME UP','FIM DE JOGO',0xE8BE,3],['freeKick','FREE KICK','TIRO LIVRE',0xE8CC,4],
 ['goalKick','GOAL KICK','TIRO DE META',0xE8DE,4],['halfTime','HALF TIME','INTERVALO',0xE8F0,4],
 ['throwIn','THROW IN','LATERAL',0xE902,4],['player1Win','1P WIN','1P VENCEU',0xE914,3],
 ['player2Win','2P WIN','2P VENCEU',0xE922,3],['win','WIN','VITÓRIA',0xE930,2],['lose','LOSE','DERROTA',0xE93A,2],
]);
export const MATCH_ANNOUNCEMENT_SECTION={id:'match-announcements',page:'texts-match',title:'Avisos durante a partida',area:'partida',createPage:true,fields:MATCH_ANNOUNCEMENTS.map(([id,en,pt])=>[id,en,pt,{announcement:true}])};

export const MATCH_ANNOUNCEMENT_FALLBACKS=Object.freeze({yellowCard:'AMARELO',redCard:'VERMELHO',offside:'IMPEDIDO'});
