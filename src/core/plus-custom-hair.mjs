import {customHairPixels} from './player-appearance.mjs';
import {playerOffset} from './plus-player.mjs';
export const CUSTOM_HAIR_SLOT=0x3E8000;
export const CUSTOM_HAIR_END=0x3E8700;
const cpu=pc=>((0x80+(pc>>>15))<<16)|0x8000|(pc&0x7FFF);
const bytes=(v,n=3)=>Array.from({length:n},(_,i)=>v>>>(i*8)&255);
const same=(rom,at,values)=>values.every((v,i)=>rom[at+i]===v);
const hooks=[{pc:0xC7BC3,original:[0xB9,0x6D,0xED,0x8D,8,0],helper:CUSTOM_HAIR_SLOT+0x40},{pc:0xC7BE0,original:[0xB9,0x6E,0xED,0x29,0,0xFF],helper:CUSTOM_HAIR_SLOT+0x60}];
export function encodeHairTile(pixels){
 const out=new Uint8Array(32);for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let p=0;p<4;p++)out[(p>>1)*16+y*2+(p&1)]|=(pixels[y*8+x]>>p&1)<<(7-x);return out;
}
export function plusCustomHairWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('jogadores'))return rom;
 let used=false;for(let t=0;t<56;t++)for(let p=0;p<20;p++)if((rom[playerOffset(t,p)+6]&15)>=14)used=true;
 if(!used)return rom;
 if(rom.length!==0x400000)throw Error('Cabelos novos exigem ROM de 4 MB.');
 for(let t=0;t<56;t++){
  const hair=Array.from({length:11},(_,p)=>rom[playerOffset(t,p)+6]&15);
  if(hair.some(h=>h>=14)&&hair.filter(h=>h!==0&&(!(rom[0x1C930]===0x22&&rom[0x1C931]===0&&rom[0x1C932]===0x84&&rom[0x1C933]===0xE1)||h<14)).length>3)throw Error('Equipe '+t+': o motor nativo suporta até três titulares com cabelo especial; reduza a seleção antes de exportar.');
 }
 const writes=[],add=(pc,data)=>writes.push({pc,data:Uint8Array.from(data)}),table=new Uint8Array(60);table.set(base.slice(0xED6D,0xEDA1));
 for(let h=14;h<=15;h++){
  const pc=CUSTOM_HAIR_SLOT+0x100+(h-14)*0x300;table.set(bytes(cpu(pc),4),(h-1)*4);
  const data=new Uint8Array(0x300);for(let f=0;f<24;f++){
   const saved=state?.teamsV1?.spriteEdits?.hair?.[h+':'+f];
   if(saved!==undefined&&(!Array.isArray(saved)||saved.length!==64||saved.some(v=>!Number.isInteger(v)||v<0||v>15)))throw Error('Quadro personalizado inválido.');
   data.set(encodeHairTile(saved??customHairPixels(base,h,f)),f*32);
  }add(pc,data);
 }
 add(CUSTOM_HAIR_SLOT,table);
 // Preserve the native X index, Y, D, DB and widths. The first helper also
 // performs the displaced absolute store; the second returns the bank word.
 add(hooks[0].helper,[0xDA,0xBB,0xBF,...bytes(cpu(CUSTOM_HAIR_SLOT)),0xFA,0x8D,8,0,0x6B]);
 add(hooks[1].helper,[0xDA,0xBB,0xBF,...bytes(cpu(CUSTOM_HAIR_SLOT)+1),0xFA,0x29,0,0xFF,0x6B]);
 for(const hook of hooks){const patch=[0x22,...bytes(cpu(hook.helper)),0xEA,0xEA];if(!same(rom,hook.pc,hook.original)&&!same(rom,hook.pc,patch))throw Error('Leitor de cabelos Plus divergente.');add(hook.pc,patch);}
 // Complete preflight before modifying a byte. Expanded storage is owned only
 // when blank or already identical to this deterministic installation.
 for(const w of writes)if(w.pc>=CUSTOM_HAIR_SLOT&&!same(rom,w.pc,w.data)&&!rom.slice(w.pc,w.pc+w.data.length).every(v=>v===255))throw Error('Espaço dos cabelos novos ocupado.');
 for(const w of writes)rom.set(w.data,w.pc);return rom;
}
