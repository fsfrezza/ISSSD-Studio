const definitions=[
 ['friendly',0x3da0d,'OPEN GAME       ','AMISTOSO'],
 ['league',0x3da1d,'SHORT LEAGUE    ','LIGA CURTA'],
 ['tournament',0x3da2d,'SHORT TOURNAMENT','TORNEIO CURTO'],
 ['friendlyHelp',0x3da3d,'Single game only','Partida unica'],
 ['leagueHelp',0x3da4e,'League up to six players.        ','Liga para ate seis equipes.'],
 ['tournamentHelp',0x3da70,'Tournament up to eight players','Torneio para ate oito equipes'],
];
export const DELUXE_SUBMENU_FIELDS={id:'game-type-native',page:'game-type',title:'Tipo de partida',area:'menu',nativePool:true,fields:definitions.map(([id,pc,original])=>[id,original.trimEnd(),null,{label:original.trimEnd(),multiline:false,rows:1,pool:{font:'TallMenuText',segments:[{pc,original}]}}])};
export const DELUXE_SUBMENU_PORTUGUESE=Object.fromEntries(definitions.map(([id,pc,original,text])=>[id,text]));
