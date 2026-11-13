import {buildExperimentalBackpassPenalty,experimentalBackpassHooks} from './experimental-backpass-penalty.mjs';
export const DELUXE_GAMEPLAY_IDS=Object.freeze(['low-goal-kick','backpass']);
// Exact 44-byte helper from the clean Plus ROM at 85:FEC0. PHD/PLD preserve
// the player's direct page; only keepers 0500/1000 consult their own controller.
export const LOW_GOAL_KICK_HELPER=Uint8Array.from('0ba900005be00005f007e00010f0078011a2a01a8003a2d01ab58e748ec90080f005a20b002b60a20a002b60'.match(/../g).map(v=>parseInt(v,16)));
export function validateDeluxeGameplay(ids){if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!DELUXE_GAMEPLAY_IDS.includes(id)))throw Error('Melhorias sem patch Deluxe: '+(Array.isArray(ids)?ids.join(', '):'lista inválida'));}
export function applyDeluxeGameplay(input,base,ids){
 validateDeluxeGameplay(ids);if(!ids.length)return input;
 const penalty=ids.includes('backpass')?buildExperimentalBackpassPenalty(base):null;
 const out=new Uint8Array(penalty?0x400000:input.length).fill(255);out.set(input);
 const write=(at,bytes)=>{for(let i=0;i<bytes.length;i++){const original=base[at+i]??255;if(out[at+i]!==original&&out[at+i]!==bytes[i])throw Error('Melhorias: conflito em 0x'+(at+i).toString(16));}out.set(bytes,at);};
 if(ids.includes('low-goal-kick')){const original=[0xa5,0x76,0xa2,0x0b,0];if(original.some((v,i)=>base[0x2ef47+i]!==v)||base.slice(0x2fec0,0x2feec).some(v=>v!==255))throw Error('Tiro de meta: rotina Deluxe incompatível');write(0x2ef47,Uint8Array.of(0x20,0xc0,0xfe,0xa5,0x76));write(0x2fec0,LOW_GOAL_KICK_HELPER);}
 if(penalty){for(const[at,bytes]of experimentalBackpassHooks().writes)write(at,bytes);write(0x7fd8,Uint8Array.of(3));out[0x7fd7]=12;}
 return out;
}
