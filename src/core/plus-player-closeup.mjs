import {applyAppearanceChoice} from './player-color-catalog.mjs';
import{konamiLzDecompress}from'./konami-lz.mjs';
import{transformLabelPlanes}from'./plus-graphical-labels.mjs';
import{readNativeAppearancePalettes,decodeNativeHairTile}from'./player-appearance.mjs';
import{playerOffset}from'./plus-player.mjs';
import{defaultGoalkeeperPalette}from'./goalkeeper-palettes.mjs';
import{encodeHairTile}from'./plus-custom-hair.mjs';
export const CLOSEUP_PALETTE_SLOT=0x2B8000,CLOSEUP_STYLE_SLOT=0x2C8000,CLOSEUP_HEAD_SLOT=0x2C9000,CLOSEUP_HELPER_SLOT=0x2CA000;
export const CLOSEUP_REGIONS=[[CLOSEUP_PALETTE_SLOT,CLOSEUP_PALETTE_SLOT+0x10000],[CLOSEUP_STYLE_SLOT,CLOSEUP_HELPER_SLOT+0x800],[0x58EF8,0x58EFC],[0x592CF,0x592D5]];
const cpu=p=>0x800000|(p>>15)<<16|0x8000|(p&32767),word=v=>[v&255,v>>8&255],long=v=>[...word(v),v>>16&255],signed=v=>v>=128?v-256:v;
const HEAD_TILES=[0,1,16,17,4,5,20,21];
function mix(a,b,t){let out=0;for(const s of[0,5,10])out|=Math.max(0,Math.min(31,Math.round((a>>s&31)*(1-t)+(b>>s&31)*t)))<<s;return out;}
function shade(v,f){let out=0;for(const s of[0,5,10])out|=Math.min(31,Math.round((v>>s&31)*f))<<s;return out;}
export function closeupPalette(colors){
 if(!Array.isArray(colors)||colors.length<7||colors.some(v=>!Number.isInteger(v)||v<0||v>32767))throw Error('Telão: cores inválidas.');
 const out=[0,...[1.8,1.5,1.2,0.9,0.45,0].map(f=>shade(colors[1],f))];
 for(let i=0;i<9;i++){const t=i/2,lo=Math.floor(t),hi=Math.min(4,lo+1);out.push(mix(colors[6-lo],colors[6-hi],t-lo));}
 return out;
}
function decodeTile(raw,t){return Array.from({length:64},(_,i)=>{let v=0;for(let p=0;p<4;p++)v|=(raw[t*32+(p>>1)*16+(i>>3)*2+(p&1)]>>(7-i%8)&1)<<p;return v;});}
export function closeupHeadTiles(base,style,edits={}){
 if(!Number.isInteger(style)||style<0||style>15)throw Error('Telão: cabelo inválido.');
 const raw=transformLabelPlanes(konamiLzDecompress(base,0x1127BB).data),tiles=new Map(HEAD_TILES.map(t=>[t,decodeTile(raw,t)]));
 const selected=edits?.hair?.[style+':3'],native=style?Array.from(decodeNativeHairTile(base,style,3)):Array(64).fill(0),custom=selected??native;
 if(custom.length!==64||Array.from(custom).some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Telão: quadro de cabelo inválido.');
 // Original 14 is copied exactly unless the relevant edited diagonal view differs.
 if(style===14&&!selected?.some((v,i)=>v!==native[i]))return Uint8Array.from(HEAD_TILES.flatMap(t=>[...encodeHairTile(tiles.get(t))]));
 // Two overlapping native 16x16 head objects. Preserve all face/neck pixels;
 // only the six hair shades inside the head are regenerated as scalp.
 for(const [tile,ox,oy]of [[0,-9,-102],[4,-11,-97]])for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const sx=15-x,t=tile+(y>>3)*16+(sx>>3),at=(y&7)*8+(sx&7),v=tiles.get(t)[at],wx=ox+x,wy=oy+y;
  if(v>0&&v<7){const ellipse=(wx+1)**2/64+(wy+94)**2/64;tiles.get(t)[at]=ellipse<=1.1?(wx< -3?9:wx<2?10:12):0;}
 }
 if(style)for(const [tile,ox,oy]of [[0,-9,-102],[4,-11,-97]])for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const wx=ox+x,wy=oy+y,hx=7-Math.floor((wx+11)/2),hy=Math.floor((wy+104)/2);
  if(hx<0||hx>=8||hy<0||hy>=8)continue;const v=custom[hy*8+hx];if(!v)continue;
  const sx=15-x,t=tile+(y>>3)*16+(sx>>3),at=(y&7)*8+(sx&7);tiles.get(t)[at]=Math.min(6,Math.max(1,v));
 }
 return Uint8Array.from(HEAD_TILES.flatMap(t=>[...encodeHairTile(tiles.get(t))]));
}
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){if(op!==0x80)this.put(({0xD0:0xF0,0xF0:0xD0,0x90:0xB0,0xB0:0x90})[op],3);this.put(0x82);this.refs.push([this.b.length,n]);return this.put(0,0);}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-2;this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}
export function closeupHelper(){
 const c=new Code();
 c.put(0x22,0x98,0x90,0x8B,0x08,0x8B,0x48,0xDA,0x5A,0xA5,0,0x48,0xA5,2,0x48,0xD8);
 c.put(0xAF,...long(0x7E19A4),0x29,6,0,0xC9,4,0).branch(0xD0,'done');
 c.put(0xAF,...long(0x7E19B0)).branch(0xD0,'done');
 c.put(0xAF,...long(0x7E14D2),0xAA,0xAF,...long(0x7E17C6)).branch(0xF0,'side');
 c.put(0x8A,0x49,0,3,0xAA);c.label('side');
 c.put(0xBF,...long(0x7E00A0),0x29,255,0,0x4A,0xC9,56,0).branch(0xB0,'done');
 // team*20, then the current roster index, not shirt or original baseSlot.
 c.put(0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0x0A,0x48,0xAF,...long(0x7E14FC),0x29,0x7F,0,0xC9,20,0).branch(0xB0,'drop');
 c.put(0x18,0x63,1,0xFA,0x48,0x0A,0xAA,0xBF,...long(cpu(CLOSEUP_STYLE_SLOT)),0x85,2);
 c.put(0x68,0xC9,0,4).branch(0xB0,'upper');
 c.put(0x0A,0x0A,0x0A,0x0A,0x0A,0x18,0x69,0,0x80,0xAA,0xA0,0,0x2D,0xA9,31,0,0x54,0x7E,cpu(CLOSEUP_PALETTE_SLOT)>>16).branch(0x80,'head');
 c.label('upper').put(0x38,0xE9,0,4,0x0A,0x0A,0x0A,0x0A,0x0A,0x18,0x69,0,0x80,0xAA,0xA0,0,0x2D,0xA9,31,0,0x54,0x7E,cpu(CLOSEUP_PALETTE_SLOT+0x8000)>>16);
 c.label('head').put(0xA5,2,0x29,0,0x80).branch(0xF0,'done');
 c.put(0xA9,0xE4,0x40,0x8F,...long(0x7E0900),0xA5,2,0x29,15,0,0xEB,0x18,0x69,...word(cpu(CLOSEUP_HEAD_SLOT)&65535),0x85,2);
 c.put(0xA9,cpu(CLOSEUP_HEAD_SLOT)>>16,0,0x85,0);
 for(const[i,dest]of [0x6000,0x6100,0x6040,0x6140].entries())c.put(0xA5,2,0x18,0x69,i*64,0,0xA2,64,0,0xA0,...word(dest),0x22,0x37,0x8E,0x80);
 c.branch(0x80,'done');c.label('drop').put(0x68);c.label('done').put(0x68,0x85,2,0x68,0x85,0,0x7A,0xFA,0x68,0xAB,0x28,0x6B);
 return c.finish();
}
// Runs at the final native head-frame selection, after special-team overrides.
export function closeupFrameHelper(){
 const c=new Code();c.put(0x08,0xDA,0xBB,0xBF,...long(0x81F0A9),0x48,0xD8);
 c.put(0xAF,...long(0x7E19A4),0x29,6,0,0xC9,4,0).branch(0xD0,'native');
 c.put(0xAF,...long(0x7E19B0)).branch(0xD0,'native');
 c.put(0xAF,...long(0x7E14D2),0xAA,0xAF,...long(0x7E17C6)).branch(0xF0,'side');
 c.put(0x8A,0x49,0,3,0xAA);c.label('side').put(0xBF,...long(0x7E00A0),0x29,255,0,0x4A,0xC9,56,0).branch(0xB0,'native');
 c.put(0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0x0A,0x48,0xAF,...long(0x7E14FC),0x29,0x7F,0,0xC9,20,0).branch(0xB0,'drop');
 c.put(0x18,0x63,1,0xFA,0x0A,0xAA,0xBF,...long(cpu(CLOSEUP_STYLE_SLOT)),0x29,0,0x80).branch(0xF0,'native');
 c.put(0x68,0xA9,0xE4,0x40).branch(0x80,'store');
 c.label('drop').put(0x68);c.label('native').put(0x68);c.label('store').put(0x8F,...long(0x7E0900),0xFA,0x28,0x09,0,0,0x6B);return c.finish();
}
export function plusPlayerCloseupWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('jogadores'))return rom;
 if(![0x22,0x98,0x90,0x8B].every((v,i)=>base[0x58EF8+i]===v))return rom;
 if(![0x22,0x98,0x90,0x8B].every((v,i)=>rom[0x58EF8+i]===v))throw Error('Telão: leitor já alterado.');
 const palettes=new Uint8Array(0x10000).fill(255),styles=new Uint8Array(2240),heads=new Uint8Array(4096),edits=state.teamsV1?.spriteEdits??{};
 for(let h=0;h<16;h++)heads.set(closeupHeadTiles(base,h,edits),h*256);
 for(let team=0;team<56;team++){
  const native=readNativeAppearancePalettes(rom,team),players=state.teamsV1?.teams?.[team]?.players??[];
  for(let slot=0;slot<20;slot++){
   const at=playerOffset(team,slot),raw=rom[at+6],hair=raw&15,palette=raw>>4&1,p=players.find(p=>p.slot===slot+1);let colors=native.palettes[palette];
   const keeper=rom[at+4]>>4===1;const plan=state.__playerColorPlans?.[team];if(plan&&!keeper)colors=applyAppearanceChoice(colors,plan.combinations[plan.assignments[slot+1]]);if(keeper){const k=state.goalkeeperPalettesV1?.players?.[team+':'+(p?.baseSlot??slot+1)]?.colors??defaultGoalkeeperPalette(base,team);colors=[0,k[0],k[1],mix(k[1],k[2],0.5),k[2],k[3],k[4]];}
   const key=team*20+slot;palettes.set(closeupPalette(colors).flatMap(word),key*32);
   const h=keeper?14:hair,changed=h>0&&edits.hair?.[h+':3']?.some((v,i)=>v!==decodeNativeHairTile(base,h,3)[i]);
   styles.set(word((h===0||h>=14||changed?0x8000:0)|h),key*2);
  }
 }
 if(![0xB9,0xA9,0xF0,0x8D,0,9].every((v,i)=>base[0x592CF+i]===v&&rom[0x592CF+i]===v))throw Error('Telão: seletor de cabeça divergente.');
 const helper=closeupHelper();if(helper.length>0x800)throw Error('Telão: helper excede reserva.');
 const writes=[[CLOSEUP_PALETTE_SLOT,palettes],[CLOSEUP_STYLE_SLOT,styles],[CLOSEUP_HEAD_SLOT,heads],[CLOSEUP_HELPER_SLOT,helper],[CLOSEUP_HELPER_SLOT+0x400,closeupFrameHelper()]];
 for(const[pc,data]of writes)if(rom.length<pc+data.length||rom.slice(pc,pc+data.length).some(v=>v!==255))throw Error('Telão: reserva ocupada.');
 writes.push([0x592CF,Uint8Array.from([0x22,...long(cpu(CLOSEUP_HELPER_SLOT+0x400)),0xEA,0xEA])],[0x58EF8,Uint8Array.from([0x22,...long(cpu(CLOSEUP_HELPER_SLOT))])]);for(const[pc,data]of writes)rom.set(data,pc);return rom;
}
