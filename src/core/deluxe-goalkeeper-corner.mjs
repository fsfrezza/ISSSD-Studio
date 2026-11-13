import {baldPointerHelper} from './plus-bald-player-base.mjs';
import {GOALKEEPER_SET_PIECE_PATCHES} from './goalkeeper-set-piece-data.mjs';
const bytes=hex=>Uint8Array.from(hex.match(/../g)??[],v=>parseInt(v,16));
export function deluxeGoalkeeperCornerWrites(){return GOALKEEPER_SET_PIECE_PATCHES.map(p=>({pc:p.pc,original:p.original===null?new Uint8Array(p.hex.length/2).fill(255):bytes(p.original),data:p.pc===0x3fed80?Uint8Array.of(2):bytes(p.hex)}));}
// Reuse the complete approved Plus renderer and carry frames. Mask 2 only
// unlocks the corner picker; the free-kick picker keeps rejecting roster zero.
export function applyDeluxeGoalkeeperCorner(input,base){
 const writes=deluxeGoalkeeperCornerWrites(),chains=new Map();
 for(const[site,helper,bank,wrapper]of[[0x266fb,0x308000,false,0x3fe980],[0x26706,0x308200,true,0x3fec00]]){const h=baldPointerHelper(bank);if(h.every((v,i)=>input[helper+i]===v)){const cpu=0x800000|((helper>>15)<<16)|32768|(helper&32767),patch=Uint8Array.of(0x22,cpu&255,cpu>>8&255,cpu>>16);chains.set(site,patch);const record=writes.find(w=>w.pc===wrapper),needle=[0xbf,bank?4:2,0,0x82,0x6b],at=record.data.findIndex((_,i)=>needle.every((v,j)=>record.data[i+j]===v));if(at<0)throw Error('Escanteio: retorno do corpo incompatível');record.data.set([0x5c,cpu&255,cpu>>8&255,cpu>>16],at);}}

 for(const w of writes)for(let i=0;i<w.original.length;i++){
  if((base[w.pc+i]??255)!==w.original[i])throw Error('Escanteio com goleiro: base incompatível em 0x'+w.pc.toString(16));
  if((input[w.pc+i]??255)!==w.original[i]&&(input[w.pc+i]??255)!==w.data[i]&&!(chains.has(w.pc)&&input[w.pc+i]===chains.get(w.pc)[i]))throw Error('Escanteio com goleiro: conflito em 0x'+(w.pc+i).toString(16));
 }
 const out=new Uint8Array(0x400000).fill(255);out.set(input);for(const w of writes)out.set(w.data,w.pc);out[0x7fd7]=12;return out;
}
