import {buildExperimentalBackpassPenalty,experimentalBackpassHooks} from './experimental-backpass-penalty.mjs';
export const DELUXE_GAMEPLAY_IDS=Object.freeze(['low-goal-kick','backpass','penalty-interference','controller-one-codes']);
// Exact 44-byte helper from the clean Plus ROM at 85:FEC0. PHD/PLD preserve
// the player's direct page; only keepers 0500/1000 consult their own controller.
export const LOW_GOAL_KICK_HELPER=Uint8Array.from('0ba900005be00005f007e00010f0078011a2a01a8003a2d01ab58e748ec90080f005a20b002b60a20a002b60'.match(/../g).map(v=>parseInt(v,16)));
export const PENALTY_INPUT_HELPER=Uint8Array.from('c90080d011b92000892000d009958eadc200d002748eb5224a60'.match(/../g).map(v=>parseInt(v,16)));
// Preserve caller registers and both input words. The original code detector
// sees the combined edge for this call only, so controller 2 remains supported.
export const SECRET_CONTROLLERS_HELPER=Uint8Array.from('08c23048da5aa52a48a528052a852a220df58068852a7afa68286b'.match(/../g).map(v=>parseInt(v,16)));
export function validateDeluxeGameplay(ids){if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!DELUXE_GAMEPLAY_IDS.includes(id)))throw Error('Melhorias sem patch Deluxe: '+(Array.isArray(ids)?ids.join(', '):'lista inválida'));}
export function applyDeluxeGameplay(input,base,ids){
 validateDeluxeGameplay(ids);if(!ids.length)return input;
 const penalty=ids.includes('backpass')?buildExperimentalBackpassPenalty(base):null;
 const out=new Uint8Array(penalty?0x400000:input.length).fill(255);out.set(input);
 const write=(at,bytes)=>{for(let i=0;i<bytes.length;i++){const original=base[at+i]??255;if(out[at+i]!==original&&out[at+i]!==bytes[i])throw Error('Melhorias: conflito em 0x'+(at+i).toString(16));}out.set(bytes,at);};
 const hook=(at,expected,bytes)=>{if(expected.some((v,i)=>base[at+i]!==v))throw Error('Melhorias: rotina Deluxe incompatível em 0x'+at.toString(16));write(at,Uint8Array.from(bytes));};
 const helper=(at,bytes)=>{if(base.slice(at,at+bytes.length).some(v=>v!==255))throw Error('Melhorias: reserva nativa ocupada');write(at,bytes);};
 if(ids.includes('penalty-interference')){hook(0x20073,[0xb5,0x22,0x4a],[0x20,0xc0,0xff]);helper(0x27fc0,PENALTY_INPUT_HELPER);}
 if(ids.includes('controller-one-codes')){hook(0x4c2,[0x22,0x0d,0xf5,0x80],[0x22,0,0xfa,0x80]);helper(0x7a00,SECRET_CONTROLLERS_HELPER);}
 if(ids.includes('low-goal-kick')){const original=[0xa5,0x76,0xa2,0x0b,0];if(original.some((v,i)=>base[0x2ef47+i]!==v)||base.slice(0x2fec0,0x2feec).some(v=>v!==255))throw Error('Tiro de meta: rotina Deluxe incompatível');write(0x2ef47,Uint8Array.of(0x20,0xc0,0xfe,0xa5,0x76));write(0x2fec0,LOW_GOAL_KICK_HELPER);}
 if(penalty){for(const[at,bytes]of experimentalBackpassHooks().writes)write(at,bytes);write(0x7fd8,Uint8Array.of(3));out[0x7fd7]=12;}
 return out;
}
