import {GOALKEEPER_SET_PIECE_PATCHES} from './goalkeeper-set-piece-data.mjs';
import {baldPointerHelper} from './plus-bald-player-base.mjs';

const bytes=hex=>Uint8Array.from(hex.match(/../g)||[],v=>parseInt(v,16));
const same=(rom,pc,data)=>data.every((v,i)=>(pc+i<rom.length?rom[pc+i]:255)===v);
const cpu=pc=>0x808000|((pc>>15)<<16)|(pc&32767);
const long=n=>[n&255,n>>8&255,n>>16&255];
export const GOALKEEPER_TAKER_KEYS=Object.freeze(['goalkeeperFreeKickTaker','goalkeeperCornerKickTaker']);
export const GOALKEEPER_TAKER_RANGES=Object.freeze(GOALKEEPER_SET_PIECE_PATCHES.map(p=>[p.pc,p.pc+p.hex.length/2]));
export const GOALKEEPER_SHARED_BODY_HOOKS=Object.freeze([0x266FB,0x26706]);
export function goalkeeperSetPieceWrites(options={}){
 const mask=(options.goalkeeperFreeKickTaker===true?1:0)|(options.goalkeeperCornerKickTaker===true?2:0);
 if(!mask)return [];
 return GOALKEEPER_SET_PIECE_PATCHES.map(p=>({pc:p.pc,original:p.original===null?new Uint8Array(p.hex.length/2).fill(255):bytes(p.original),data:p.pc===0x3FED80?Uint8Array.of(mask):bytes(p.hex)}));
}

// Disassembly: 86:AB4F rejects roster zero; menu state 3=FK and 4=CK.
// Runtime/body changes are the approved v7. Carry data uses FE:A000..FF:C443,
// outside Studio's text, menu, appearance, and backpass reservations.
export function goalkeeperSetPiecesWriter(work,options,base){
 const writes=goalkeeperSetPieceWrites(options);if(!writes.length)return work;
 if(work.length!==0x400000)throw Error('Goleiro batedor: a ROM precisa estar expandida para 4 MB.');
 const chains=new Map();
 for(const [pc,helper,bank,wrapper]of [[0x266FB,0x308000,false,0x3FE980],[0x26706,0x308200,true,0x3FEC00]]){
  const previous=Uint8Array.of(0x22,...long(cpu(helper)));
  if(same(work,helper,baldPointerHelper(bank))){
   chains.set(pc,previous);
   const record=writes.find(w=>w.pc===wrapper),needle=[0xBF,bank?4:2,0,0x82,0x6B];
   const at=record.data.findIndex((_,i)=>needle.every((v,j)=>record.data[i+j]===v));
   if(at<0)throw Error('Goleiro batedor: retorno do renderizador incompatível.');
   record.data.set([0x5C,...long(cpu(helper))],at);
  }
 }
 // Validate every destination before mutating; never partially install a rule.
 for(const w of writes){
  if(!same(base,w.pc,w.original))throw Error('Goleiro batedor: ROM-base incompatível em 0x'+w.pc.toString(16));
  const ownConfig=w.pc===0x3FED80&&[1,2,3].includes(work[w.pc]);
  if(!same(work,w.pc,w.original)&&!same(work,w.pc,w.data)&&!ownConfig&&!(chains.has(w.pc)&&same(work,w.pc,chains.get(w.pc))))throw Error('Goleiro batedor: conflito em 0x'+w.pc.toString(16));
 }
 for(const w of writes)work.set(w.data,w.pc);
 return work;
}
