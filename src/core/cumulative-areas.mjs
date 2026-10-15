import {PLUS_MAIN_MENU_REGIONS} from './plus-main-menu-renderer.mjs';
import {resolvePlusPlayerNameOffset} from './plus-player-name.mjs';
import {resolvePlusTacticalRecord} from './plus-tactics-address.mjs';
import {knownMirrorSlices} from './plus-player.mjs';

// PC ranges taken from legacy TITLE_GROUPS/TITLE_PALETTES/PROFILE_TEXT_MAPS,
// the verified main-menu renderer, and live player/tactical pointers.
// Unknown bytes are explicitly retained in one final legacy area.
export const CUMULATIVE_AREAS=Object.freeze([
 {id:'tela-inicial',label:'Tela inicial',always:true},
 {id:'menu-principal',label:'Menu principal',always:true},
 {id:'selecao-equipes',label:'Seleção e grupos de equipes'},
 {id:'uniformes',label:'Uniformes e paletas de goleiro'},
 {id:'jogadores',label:'Jogadores: nomes, camisas, posições, skills e aparência'},
 {id:'pre-partida',label:'Tela de preparação da partida'},
 {id:'formacoes-estrategias',label:'Formações, táticas e textos de estratégia'},
 {id:'outros-legados',label:'Outras alterações legadas sem área confirmada'},
 {id:'metadados',label:'Metadados internos da ROM'},
]);
const contains=(off,ranges)=>ranges.some(([a,b])=>off>=a&&off<b);
export function areaClassifier(rom){
 const title=[[0x11971,0x11981],[0x1198B,0x11993],[0x1199A,0x119A2],
  [0x1764EA,0x178000],[0x1842DE,0x188000],[0xDEA6D,0xE0000],[0x12617F,0x126C00],
  [0x46E13,0x46ED2],[0x4C292,0x4C2B2],[0x4C2B4,0x4C2D4],[0x4C318,0x4C338],[0x4C2D6,0x4C2F6],
  [0x3C884,0x3C88A],[0x270000,0x290000]];
 const menu=Object.values(PLUS_MAIN_MENU_REGIONS).map(r=>[r.pc,r.pc+(r.capacity??r.length)]);
 menu.push([0x3DA0D,0x3DA8F],[0x4E49E,0x4E4BE],[0x4E4C0,0x4E4E0],[0x4E404,0x4E408],[0x4E45C,0x4E460],[0x4E464,0x4E466]);
 const players=[[0x150000,0x150000+56*140],[0x38138,0x38138+56*2]],tactics=[[248014,248174],[0x5FDD0,0x5FDD0+57*2],[0x200100,0x200100+57]],derived=[[0x7FDC,0x7FE0]];
 for(let t=0;t<56;t++){
  try{const p=resolvePlusPlayerNameOffset(rom,t,0);players.push([p,p+160]);}catch{/* no guessed name ranges */}
  const rec=resolvePlusTacticalRecord(rom,t);if(rec)tactics.push([rec.recordPc,rec.recordPc+31]);
 }
 for(let p=1;p<=7;p++)for(const s of knownMirrorSlices(30,p))derived.push([s.mirror,s.mirror+s.length]);
 return off=>{
  if(contains(off,derived))return null;
  if(contains(off,title))return 'tela-inicial';
  if(contains(off,menu))return 'menu-principal';
  if((off>=0xE7F2&&off<0xE830)||(off>=0x2DDA5&&off<0x2DDA5+56*10))return 'selecao-equipes';
  if((off>=0x483C2&&off<0x483C2+56*2*34)||(off>=0x48D50&&off<0x48D50+56*24))return 'uniformes';
  if(off>=0xF631C&&off<0xF631C+2153)return 'pre-partida';
  if(contains(off,players))return 'jogadores';
  if(contains(off,tactics))return 'formacoes-estrategias';
  if(off>=0x7FC0&&off<0x7FD7)return 'metadados';
  return 'outros-legados';
 };
}
