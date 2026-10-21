import {SOUND_REGIONS} from './plus-sounds.mjs';
import {TRAINING_SELECTOR_POSITIONS,TRAINING_CHOICE_REGIONS} from './plus-native-menu-text.mjs';
import {EXTRA_MENU_GRAPHIC_REGIONS} from './plus-extra-menu-graphics.mjs';
import {TRAINING_HUD_REGIONS} from './plus-training-hud.mjs';
import {MATCH_STATISTICS_REGIONS} from './plus-match-statistics.mjs';
import {MATCH_ANNOUNCEMENT_REGIONS} from './plus-match-announcements.mjs';
import {TEAM_NAME_REGIONS} from './plus-team-names.mjs';
import {PREMATCH_GRAPHIC_MAPS} from './plus-prematch-graphics.mjs';
import {LINKED_SCREEN_FIELDS} from './plus-linked-screen-text.mjs';
import {graphicalLabelArea} from './graphical-label-layout.mjs';
import {NATIVE_MENU_TEXT_SECTIONS} from './native-menu-text-fields.mjs';
import {CURSOR_HELP_FIELDS} from './cursor-text-fields.mjs';
import {CONTROLLER_ACTIONS} from './plus-controller-actions.mjs';
import {TITLE_NATIVE_GROUPS,nativeTitleStream} from './native-title-graphics.mjs';
import {PLUS_MAIN_MENU_REGIONS} from './plus-main-menu-renderer.mjs';
import {resolvePlusPlayerNameOffset} from './plus-player-name.mjs';
import {resolvePlusTacticalRecord} from './plus-tactics-address.mjs';
import {knownMirrorSlices} from './plus-player.mjs';
import {NATIVE_SCREEN_TEXT_FIELDS,NATIVE_AUX_TEXT_GROUPS,nativeTextArea} from './plus-native-screen-text.mjs';

// PC ranges taken from legacy TITLE_GROUPS/TITLE_PALETTES/PROFILE_TEXT_MAPS,
// the verified main-menu renderer, and live player/tactical pointers.
// Unknown bytes are reported and omitted; there is no implicit catch-all phase.
export const CUMULATIVE_AREAS=Object.freeze([
 {id:'infraestrutura',label:'Infraestrutura',number:1},
 {id:'metadados',label:'Metadados',number:2},
 {id:'tela-inicial',label:'Tela Inicial',number:3},
 {id:'menu-principal',label:'Menu Principal',number:4},
 {id:'pre-partida',label:'Pré-Partida',number:5},
 {id:'textos-estrategias',label:'Textos da tela Estratégias',number:6},
 {id:'selecao-equipes',label:'Seleção de equipes',number:7},
 {id:'jogadores',label:'Jogadores',number:8},
 {id:'formacoes',label:'Formações',number:9},
 {id:'partida',label:'Textos durante a partida',number:10},
 {id:'sons',label:'Sons',number:11},
]);
export function selectedCumulativeAreas(selection){
 if(selection===undefined)return CUMULATIVE_AREAS.map(a=>a.id);
 if(!Array.isArray(selection)||selection.some(id=>!CUMULATIVE_AREAS.some(a=>a.id===id)))throw new Error('Seleção de fases inválida');
 if(!selection.length)throw new Error('Marque ao menos uma fase para salvar');
 return CUMULATIVE_AREAS.filter(a=>selection.includes(a.id)).map(a=>a.id);
}
const contains=(off,ranges)=>ranges.some(([a,b])=>off>=a&&off<b);
export function areaClassifier(rom,base=null){
 const title=[[0x11971,0x11981],[0x1198B,0x11993],[0x1199A,0x119A2],
  [0x1764EA,0x178000],[0x1842DE,0x188000],[0xDEA6D,0xE0000],[0x12617F,0x126C00],
  [0x46E13,0x46ED2],[0x4C292,0x4C2B2],[0x4C2B4,0x4C2D4],[0x4C318,0x4C338],[0x4C2D6,0x4C2F6],
  [0x270000,0x290000]];
 for(const id of Object.keys(TITLE_NATIVE_GROUPS))for(const source of [rom,base].filter(Boolean)){
  try{const r=nativeTitleStream(source,id);title.push([r.pc,r.pc+r.size]);}catch{/* invalid/non-title fixture; never guess */}
 }
 const menu=Object.values(PLUS_MAIN_MENU_REGIONS).map(r=>[r.pc,r.pc+(r.capacity??r.length)]);
 menu.push([0x3DA0D,0x3DA8F],[0x4E49E,0x4E4BE],[0x4E4C0,0x4E4E0],[0x4E404,0x4E408],[0x4E45C,0x4E460],[0x4E464,0x4E46A]);
 const players=[[0x150000,0x150000+56*140],[0x38138,0x38138+56*2]],tactics=[[0x5FDD0,0x5FDD0+57*2],[0x200100,0x200100+57]],derived=[[0x7FDC,0x7FE0]];
 for(let t=0;t<56;t++){
  try{const p=resolvePlusPlayerNameOffset(rom,t,0);players.push([p,p+160]);}catch{/* no guessed name ranges */}
  const rec=resolvePlusTacticalRecord(rom,t);if(rec)tactics.push([rec.recordPc,rec.recordPc+31]);
  if(base){const br=resolvePlusTacticalRecord(base,t);if(br)tactics.push([br.recordPc,br.recordPc+31]);}
 }
 for(let p=1;p<=7;p++)for(const s of knownMirrorSlices(30,p))derived.push([s.mirror,s.mirror+s.length]);
 return off=>{
  if(contains(off,SOUND_REGIONS))return 'sons';
  if(contains(off,EXTRA_MENU_GRAPHIC_REGIONS))return 'pre-partida';
  if(contains(off,TRAINING_HUD_REGIONS))return 'partida';
  if(contains(off,MATCH_STATISTICS_REGIONS))return 'partida';
  if(contains(off,MATCH_ANNOUNCEMENT_REGIONS))return 'partida';
  if(PREMATCH_GRAPHIC_MAPS.some(m=>off>=m.pc&&off<m.pc+m.size))return 'pre-partida';
  if(LINKED_SCREEN_FIELDS.some(([, ,pc,w,h])=>off>=pc&&off<pc+w*h))return 'pre-partida';
  const graphic=graphicalLabelArea(off);if(graphic!==undefined)return graphic;
  if(NATIVE_AUX_TEXT_GROUPS.some(g=>off>=g.pc&&off<g.pc+g.rows.reduce((a,b)=>a+b,0)))return 'textos-estrategias';
  if(contains(off,derived))return null;
  if(contains(off,TEAM_NAME_REGIONS))return 'selecao-equipes';
  if(contains(off,title))return 'tela-inicial';
  if(contains(off,menu))return 'menu-principal';
  if((off>=0xF6C78&&off<0xF6F2B)||(off>=0x3FAC8&&off<0x3FB7C)||(off>=0xE7F2&&off<0xE830)||(off>=0x2DDA5&&off<0x2DDA5+56*10))return 'selecao-equipes';
  if((off>=0x3E8000&&off<0x3E8700)||(off>=0xC7BC3&&off<0xC7BC9)||(off>=0xC7BE0&&off<0xC7BE6))return 'jogadores';
  if((off>=0x483C2&&off<0x483C2+56*2*34)||(off>=0x48D50&&off<0x48D50+56*24))return 'jogadores';
  if((off>=0x3fc00&&off<0x40000)||(off>=0x113a7&&off<0x113aa)||(off>=0x3cafa&&off<0x3caff)||(off>=0x167ade&&off<0x167c34))return 'pre-partida';
  if(contains(off,TRAINING_CHOICE_REGIONS))return 'pre-partida';
  if(TRAINING_SELECTOR_POSITIONS.some(([pc])=>off>=pc&&off<pc+2))return 'pre-partida';
  for(const section of NATIVE_MENU_TEXT_SECTIONS)if(section.fields.some(f=>f[3].pool.segments.some(s=>off>=s.pc&&off<s.pc+s.original.length)))return section.area;
  if(CURSOR_HELP_FIELDS.some(([, , , {native:n}])=>off>=n.pc&&off<n.pc+n.width*n.rowCount))return 'pre-partida';
  if(CONTROLLER_ACTIONS.some(a=>off>=a.pc&&off<a.pc+a.cells))return 'pre-partida';
  if((off>=0xF631C&&off<0xF631C+2153)||(off>=0x108162&&off<0x108162+390))return 'pre-partida';
  if(contains(off,players))return 'jogadores';
  if(off>=248014&&off<248174)return 'textos-estrategias';
  const native=NATIVE_SCREEN_TEXT_FIELDS.find(f=>off>=f.pc&&off<f.pc+f.capacity);if(native)return nativeTextArea(native);
  if(contains(off,tactics))return 'formacoes';
  if(off>=0x7FC0&&off<0x7FD7)return 'metadados';
  return undefined;
 };
}
