import {resolvePlusPlayerNameOffset} from './plus-player-name.mjs';
// Preserve native glyph bytes and internal spaces; move only outer blank slots.
export function centerPlayerNameBytes(bytes){
 if(!bytes||bytes.length!==8||Array.from(bytes).some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Nome: registro de oito bytes necessário.');
 let start=0,end=8;while(start<end&&bytes[start]===0)start++;while(end>start&&bytes[end-1]===0)end--;
 const out=new Uint8Array(8);out.set(Array.from(bytes).slice(start,end),Math.floor((8-end+start)/2));return out;
}
export function centeredRosterNames(bytes){
 if(!bytes||bytes.length!==160)throw Error('Elenco: vinte nomes necessários.');const out=new Uint8Array(160);
 for(let i=0;i<20;i++)out.set(centerPlayerNameBytes(bytes.slice(i*8,i*8+8)),i*8);return out;
}
export function centerPlusPlayerNames(rom,state){
 if(state?.playerNameAlignment!=='center')return rom;
 // Resolve all destinations before writing so a malformed table cannot partly apply.
 const records=[];for(let t=0;t<56;t++)for(let p=0;p<20;p++){const off=resolvePlusPlayerNameOffset(rom,t,p);records.push([off,centerPlayerNameBytes(rom.slice(off,off+8))]);}
 for(const [off,bytes]of records)rom.set(bytes,off);return rom;
}
