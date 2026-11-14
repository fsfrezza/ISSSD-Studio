import {applyDeluxePasswordSave} from './deluxe-password-save.mjs';
import {applyDeluxeGoalkeeperCorner} from './deluxe-goalkeeper-corner.mjs';
import {buildExperimentalBackpassPenalty,experimentalBackpassHooks} from './experimental-backpass-penalty.mjs';
export const DELUXE_GAMEPLAY_IDS=Object.freeze(['low-goal-kick','backpass','penalty-interference','controller-one-codes','one-minute','final-attack','goalkeeper-corner','match-hour','password-save']);
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
 if(ids.includes('match-hour')){
  hook(0x121f1a,[0xa9,0,0],[0x20,0xc0,0xe7]);
  hook(0x121f25,[0xa5,0x1c,0x49,1,0,0x85,0x1c],[0x20,0,0xe7,0xea,0xea,0xea,0xea]);
  hook(0x121f35,[0x37,0x9f],[0x20,0xe7]);hook(0x121f62,[0x64,0x9f],[0x26,0xe7]);
  helper(0x126700,Uint8Array.from([0xe6,0x1c,0xa5,0x1c,0xc9,3,0,0x90,2,0x64,0x1c,0x60]));
  helper(0x126720,Uint8Array.from([0x3b,0x9f,0x4d,0x9f,0x30,0xe7,0x68,0x9f,0x75,0x9f,0x50,0xe7,0,0x71,0x74,0x77]));
  helper(0x126730,Uint8Array.from([0xc6,0x10,0x10,5,0xa9,3,0,0x85,0x10,0x20,0x70,0xe7,0x4c,0x2f,0x9f]));
  helper(0x126750,Uint8Array.from([0xe6,0x10,0xa5,0x10,0xc9,4,0,0x90,2,0x64,0x10,0x20,0x70,0xe7,0x4c,0x2f,0x9f]));
  helper(0x126770,Uint8Array.from([165, 16, 208, 27, 160, 6, 27, 162, 0, 0, 169, 0, 0, 34, 162, 149, 133, 160, 8, 27, 162, 0, 0, 169, 0, 0, 34, 178, 149, 133, 96, 170, 191, 44, 231, 164, 41, 255, 0, 170, 169, 211, 0, 160, 6, 27, 34, 162, 149, 133, 160, 8, 27, 162, 0, 0, 169, 60, 0, 34, 178, 149, 133, 96]));
  helper(0x1267c0,Uint8Array.from([0xa9,0,0,0x85,0x10,0x60]));
  hook(0x3449d,[0xbd,0xe9,0xdc],[0x20,0x9e,0xcb]);
  helper(0x34b9e,Uint8Array.from([0xad,0x48,0x16,0xd0,8,0xa5,0x10,0xa5,0x10,0xf0,2,0x3a,0x60,0xbd,0xe9,0xdc,0x60]));
 }
 if(ids.includes('final-attack')){
  hook(0x35bc0,[173, 208, 22, 208, 61, 173, 188, 0, 208, 56, 173, 48, 4, 201, 4, 0, 240, 48, 201, 5, 0, 240, 43, 201, 6, 0, 240, 38, 201, 24, 0, 240, 33, 201, 22, 0, 240, 28, 169, 6, 0, 141, 186, 0, 34, 3, 220, 134, 169, 6, 0, 141, 170, 23, 169, 60, 0, 141, 172, 23, 169, 1, 0, 141, 230, 20, 96],[0x4c,0,0xcc,...Array(64).fill(0xea)]);
  hook(0x3eb4,[0x8d,0x40,0x21],[0x20,0,0xf9]);hook(0x3215,[0x22,0x81,0x92,0xa4],[0x22,0,0xff,0xa4]);
  helper(0x34c00,Uint8Array.from([173, 208, 22, 208, 96, 173, 188, 0, 208, 91, 173, 48, 4, 201, 3, 0, 240, 83, 201, 4, 0, 240, 78, 201, 5, 0, 240, 73, 201, 6, 0, 240, 68, 201, 22, 0, 240, 63, 201, 24, 0, 240, 58, 201, 14, 0, 240, 53, 165, 110, 208, 49, 165, 108, 208, 6, 230, 108, 100, 106, 128, 39, 165, 106, 201, 0, 1, 144, 32, 100, 106, 100, 108, 169, 6, 0, 141, 186, 0, 34, 3, 220, 134, 169, 6, 0, 141, 170, 23, 169, 60, 0, 141, 172, 23, 169, 1, 0, 141, 230, 20, 96]));
  helper(0x7900,Uint8Array.from([141, 64, 33, 201, 0, 240, 14, 201, 6, 240, 10, 201, 7, 240, 9, 201, 8, 240, 5, 128, 7, 100, 110, 96, 133, 110, 100, 108, 96]));
  helper(0x127f00,Uint8Array.from([34, 129, 146, 164, 165, 108, 208, 3, 100, 106, 107, 248, 165, 106, 170, 24, 105, 1, 0, 41, 255, 0, 201, 96, 0, 176, 8, 138, 105, 1, 0, 133, 106, 216, 107, 138, 24, 105, 65, 0, 128, 245]));
 }
 if(ids.includes('one-minute')){
  hook(0x51c8b,[2],[3]);hook(0x51c96,[3],[4]);
  hook(0x51d74,[0xad,0x88,0x1f,0x0a],[0x20,0,0xf6,0xea]);
  helper(0x57600,Uint8Array.from([0xad,0x88,0x1f,0xc9,3,0,0xd0,4,0xa9,0,0,0x60,0x1a,0x60]));
  hook(0x3de2f,[0x61,0,0,0,0,0,0x63,0,0,0,0,0,0x65],[0x5f,0,0,0x61,0,0,0x63,0,0,0x65,0,0,0]);
  hook(0x121279,[0xb9,0x93,0xe8],[0x20,0x80,0xff]);hook(0x12127d,[0xb9,0x9b,0xe8],[0x20,0x90,0xff]);
  helper(0x127f80,Uint8Array.from([0xad,0x88,0x1f,0xc9,3,0,0xd0,4,0xa9,0,1,0x60,0xb9,0x93,0xe8,0x60,0xad,0x88,0x1f,0xc9,3,0,0xd0,4,0xa9,0x30,0,0x60,0xb9,0x9b,0xe8,0x60]));
 }
 if(ids.includes('penalty-interference')){hook(0x20073,[0xb5,0x22,0x4a],[0x20,0xc0,0xff]);helper(0x27fc0,PENALTY_INPUT_HELPER);}
 if(ids.includes('controller-one-codes')){hook(0x4c2,[0x22,0x0d,0xf5,0x80],[0x22,0,0xfa,0x80]);helper(0x7a00,SECRET_CONTROLLERS_HELPER);}
 if(ids.includes('low-goal-kick')){const original=[0xa5,0x76,0xa2,0x0b,0];if(original.some((v,i)=>base[0x2ef47+i]!==v)||base.slice(0x2fec0,0x2feec).some(v=>v!==255))throw Error('Tiro de meta: rotina Deluxe incompatível');write(0x2ef47,Uint8Array.of(0x20,0xc0,0xfe,0xa5,0x76));write(0x2fec0,LOW_GOAL_KICK_HELPER);}
 if(penalty){for(const[at,bytes]of experimentalBackpassHooks().writes)write(at,bytes);write(0x7fd8,Uint8Array.of(3));out[0x7fd7]=12;}
 const corners=ids.includes('goalkeeper-corner')?applyDeluxeGoalkeeperCorner(out,base):out;
 return ids.includes('password-save')?applyDeluxePasswordSave(corners,base):corners;
}
