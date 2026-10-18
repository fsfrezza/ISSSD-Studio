// Audited native menu assets (AssetPointersAndFiles.asm / bank 82 loaders).
// The native decoder uses bank bit 6 as a map flag, so these streams must
// remain in the first 2 MiB. Slots are verified FF ranges in the Plus base,
// within disassembly FREE_BYTES regions $80F828, $86CB9E, $86E5AB,
// $8AF558 and $AFBD1E.
export const GRAPHICAL_LABEL_ASSETS=Object.freeze([
 {id:'playerNumberLabel',area:'pre-partida',pc:0xF7819,size:62,raw:96,planar:true,pointers:[0x111BE,0x11645,0xA0B88],cpu:0x9EF819,slot:0x7D40,capacity:0x80},
 {id:'uniformLabels',area:'pre-partida',pc:0x1206CF,size:379,raw:496,planar:false,pointers:[0x11623],cpu:0xA486CF,slot:0x7B20,capacity:0x220},
 {id:'handicapLabels',area:'pre-partida',pc:0xF7691,size:392,raw:512,planar:false,pointers:[0x11277],cpu:0x9EF691,slot:0x372E0,capacity:0x240},
 {id:'handicapStrength',area:'pre-partida',pc:0xF7615,size:124,raw:128,planar:true,pointers:[0x11272],cpu:0x9EF615,slot:0x37520,capacity:0xA0},
 {id:'formationRoleButtonTop',area:'formacoes',pc:0xF6F2B,size:296,raw:544,planar:true,pointers:[0x10EB4,0x111B9,0x11232,0x1125E,0x11640],cpu:0x9EEF2B,slot:0x37080,capacity:0x260},
 {id:'teamStats',area:null,pc:0x876D8,size:1177,raw:2560,planar:true,pointers:[0x10E65,0x10E93,0x11892,0x11929],cpu:0x90F6D8,slot:0x17E020,capacity:0x1000,literal:true},
 {id:'navigationButtons',area:'pre-partida',pc:0xAFBDC,size:948,raw:1536,planar:true,pointers:[0x10E60,0x10E8E,0x10E9B,0x1188D,0x11924],cpu:0x95FBDC,slot:0x17F020,capacity:0x800},
 {id:'formationRoleMap',area:'formacoes',pc:0xD7DEB,size:510,raw:2048,planar:false,pointers:[0x10EDB],cpu:0x9AFDEB,slot:0x17F820,capacity:0x7E0},
 {id:'playerMisc',area:'jogadores',pc:0xF727E,size:182,raw:192,planar:true,pointers:[0x111CD],cpu:0x9EF27E,slot:0x57950,capacity:0x100},
 {id:'playerSkills',area:'jogadores',pc:0xF7369,size:549,raw:768,planar:true,pointers:[0x111D7],cpu:0x9EF369,slot:0x57A50,capacity:0x5B0},
 {id:'formationType',area:'formacoes',pc:0xF758E,size:135,raw:144,planar:false,pointers:[0x10EC3],cpu:0x9EF58E,slot:0x34BB0,capacity:0x100},
 {id:'attackParticipation',area:'formacoes',pc:0xDAD64,size:653,raw:2208,planar:true,pointers:[0x10EBE],cpu:0x9BAD64,slot:0x34CB0,capacity:0x400},
 {id:'cancelHeader',area:'pre-partida',pc:0x102100,size:304,raw:352,planar:true,pointers:[0x10EE9,0x11241,0x1126D,0x11296,0x112C9,0x112F1,0x118A6,0x118E5],cpu:0xA0A100,slot:0x7920,capacity:0x200,literal:true},
]);
export const GRAPHICAL_LABEL_FIELDS=Object.freeze({
 'team-selection-labels':['formation','statistics','keeperAbbr'],
 'uniform-labels':['shirt','pants','socks','color','type','edit'],
 'handicap-labels':['condition','keeper','skill','players','strong','weak'],
 'pre-match-labels':['keyConfiguration','changeController','numberPlayers','editPlayers','teamColors'],
 'player-labels':['player','substitute','speed','dash','shotPower','curlSkill','balance','intelligence','jump','dribble','stamina','pointsLeft'],
 'formation-labels':['formationType','attackParticipation','defenders','midfielders','forwards'],
 'navigation-labels':['exit','cancel','numbers'],
});
export function graphicalLabelArea(off){
 if((off>=0x3C7FC&&off<0x3C811)||off===0x3347B||off===0x33486)return 'jogadores';
 if((off>=0x3C875&&off<0x3C884)||(off>=0x3AFCA&&off<0x3AFCC))return 'pre-partida';
 for(const shared of GRAPHICAL_LABEL_ASSETS.filter(a=>a.literal)){
  if(shared.pointers.some(pc=>off>=pc&&off<pc+3))return null;
  if(off>=shared.slot&&off<shared.slot+shared.capacity){
   const index=off-shared.slot-2;if(index<0||index%32===0)return null;
   const raw=Math.floor(index/32)*31+index%32-1,tile=Math.floor(raw/(shared.id==='cancelHeader'?16:32));
   if(shared.id==='teamStats'){
    if(tile>=2&&tile<6)return 'pre-partida';if(tile>=6&&tile<12)return 'formacoes';
   }else{if(tile<11)return 'selecao-equipes';if(tile>=16&&tile<21)return 'pre-partida';}
   return null;
  }
 }
 for(const a of GRAPHICAL_LABEL_ASSETS.filter(a=>!a.literal))if((off>=a.slot&&off<a.slot+a.capacity)||a.pointers.some(pc=>off>=pc&&off<pc+3))return a.area;
 if(off>=0x3C530&&off<0x3C532)return 'selecao-equipes';
 if(off>=0x3C532&&off<0x3C538)return 'formacoes';
 if(off>=0xD0BE0&&off<0xD0C40)return 'formacoes';
 if((off>=0xD0B60&&off<0xD0BE0)||(off>=0x3DFB7&&off<0x3DFBE))return 'pre-partida';
 return undefined;
}
