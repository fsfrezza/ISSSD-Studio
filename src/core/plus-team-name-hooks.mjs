import {konamiLzDecompress} from './konami-lz.mjs';
import {convertedMenuOam,MENU_OAM_CACHE_SLOT,MENU_OAM_PLANE_SIZE} from './plus-menu-oam-cache.mjs';
// The native OAM converter stores four parallel arrays 0x2000 bytes apart.
// Tall names use two SMALL objects per token. Menus and formation use
// 5280..5876; only stadium layouts use 5A00, beyond their 5600..57D2 objects.
// Cache words live beyond the maximum name plane (5A00..5FF6).
// Native menu objects also use the 0F00 page; it cannot hold persistent state.
export const TEAM_NAME_CACHE_SLOT=0x3E5500;
export const TEAM_NAME_CACHE_PLANE=0x5F6;
export const TEAM_NAME_CACHE_SIZE=TEAM_NAME_CACHE_PLANE*4;
export const STADIUM_OAM_CACHE_SLOT=0x3E6D00;
export const STADIUM_OAM_PLANE=0x1D2;
export const STADIUM_RESTORE_SLOT=0x3E7500;
export const STADIUM_RESTORE_SIZE=0x80;
export const SQUAD_OAM_CACHE_SLOT=0x3E7600,SQUAD_OAM_CACHE_SIZE=0x200;
export const SQUAD_RESTORE_SLOT=0x3E7800,SQUAD_RESTORE_SIZE=0x100;
export const SQUAD_OAM_DEST=0x5EB2,SQUAD_OAM_PLANE=116;
// Include the immediate frame operands used by 86:AA50/AA5C while the
// corner/free-kick taker blinks, as well as the static frame tables.
export const SQUAD_OAM_POINTERS=Object.freeze([0x175EE,0x175F0,0x175F2,...Array.from({length:11},(_,i)=>0x174F4+i*2),0x32A56,0x32A62]);
export const TEAM_NAME_HOOK_SLOT=0x3E3000;
export const TEAM_NAME_HOOK_SIZE=0x200;
export const TEAM_NAME_POINTER_READS=Object.freeze([0x1BA5B,0x1BA86,0x2A995,0x2A9CB,0x2C754,0x2D156,0x2D6AF,0x2E99F,0x364A0,0x5668E,0x566B1,0x566D4,0x566F7,0x5671A,0x5673D,0x59908,0x5FFCE,0x5FFD4,0x5FFE0,0x122046,0x1244E0]);
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),long=n=>[n&255,n>>8&255,n>>16&255];
function wrapper(original){
 // 5876..5EB2 contains the shared menu/cursor objects. The stadium
 // instead uses 5600..57D2. Move names BEFORE either native conversion.
 return Uint8Array.from([
  0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0xC0)),
  0x08,0xC2,0x30,0x48,
  0xC0,0x76,0x58,0xD0,5,0xA9,0x80,0x52,0x80,8,
  0xC0,0,0x56,0xD0,11,0xA9,0,0x5A,
  0x8F,0xFA,0x5F,0x7E,0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0x120)),
  0x68,0x28,
  0xC0,0x02,0x4F,0xD0,0x0B,
  0x48,0xAF,0xFA,0x5F,0x7E,0xA8,0x8F,0xF8,0x5F,0x7E,0x68,
  0x22,...long(original),0x6B,
 ]);
}
export function convertedTeamNameOam(raw,expectedFrames=56,plane=TEAM_NAME_CACHE_PLANE){
 const count=raw[1]|raw[2]<<8,frames=raw[0],header=3+frames;
 if(frames!==expectedFrames||count*2>plane||raw.length!==header+count*4)throw Error('Nomes: cache de objetos divergente.');
 const out=new Uint8Array(plane*4);let index=0;
 for(let f=0;f<frames;f++)for(let i=0;i<raw[3+f];i++,index++){
  const at=index*2,x=raw[header+index],y=raw[header+count+index],tile=raw[header+count*2+index],prop=raw[header+count*3+index];
  out[at]=i===0?raw[3+f]:0;out[at+1]=prop&16?255:0;
  out[plane+at]=x;out[plane+at+1]=x&128?255:0;
  out[plane*2+at]=y;out[plane*2+at+1]=y&128?255:0;
  out[plane*3+at]=tile;out[plane*3+at+1]=prop&0xEF;
 }
 if(index!==count)throw Error('Nomes: quantidade do cache divergente.');return out;
}
export function teamNameHookWrites(base,nameRaw){
 const writes=[],slot=new Uint8Array(TEAM_NAME_HOOK_SIZE).fill(255);
 slot.set(wrapper(0x80947E),0);slot.set(wrapper(0x809482),0x40);
 // Team selection and stadium initializers run after their native OAM
 // load; their gap must stay at 5A00 even when the loader is cached.
 const init=[0x08,0xC2,0x30,0x48,0xA3,7];
 for(const ret of [0xAC3E,0xAC2F,0x9E8A])init.push(0xC9,ret&255,ret>>8,0xF0,0);
 const jumps=[10,15,20];init.push(0xA9,0x80,0x52,0x80,3);const stadium=init.length;init.push(0xA9,0,0x5A);for(const at of jumps)init[at]=stadium-at-1;
 init.push(0x8F,0xFA,0x5F,0x7E,0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0x120)),0x68,0x28,0x9C,0x66,0x14,0x22,0x82,0x9E,0x85,0x6B);slot.set(init,0x80);
 if([0x9C,0x66,0x14,0x22,0x82,0x9E,0x85].some((v,i)=>base[0x2A756+i]!==v))throw Error('Nomes altos: inicializador de tela divergente.');
 writes.push([0x2A756,Uint8Array.from([0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0x80)),0xEA,0xEA,0xEA])]);
 // The penalty loader converts the ball's 557A..55D8 objects first,
 // then loads the team names (descriptor cursor 96B8). A field arrival
 // leaves the menu name gap at 5280, overlapping those live ball frames.
 // Select the stadium gap before that name conversion, even without a
 // screen initializer; keep the native ball and its four planes intact.
 const penalty=[0x08,0xC2,0x30,0x48,0xC0,0x02,0x4F,0xD0,0x10,0xE0,0xB8,0x96,0xD0,0x0B,0xA9,0,0x5A,0x8F,0xFA,0x5F,0x7E,0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0x120)),0x68,0x28,0x6B];
 slot.set(penalty,0xC0);
 // Recreate names from an immutable ROM cache on every transition. Later
 // menus may overwrite both WRAM gaps; moving stale WRAM copies is unsafe.
 const move=[0x08,0xC2,0x30,0x8B,0x48,0xDA,0x5A];
 for(let p=0;p<4;p++){
  move.push(0xA2,...long(cpu(TEAM_NAME_CACHE_SLOT+p*TEAM_NAME_CACHE_PLANE)).slice(0,2),0xAF,0xFA,0x5F,0x7E);
  if(p)move.push(0x18,0x69,(p*0x2000)&255,(p*0x2000)>>8);
  move.push(0xA8,0xA9,0xF5,0x05,0x54,0x7E,cpu(TEAM_NAME_CACHE_SLOT)>>16);
 }
 move.push(0xAF,0xFA,0x5F,0x7E,0x8F,0xF8,0x5F,0x7E,0xC9,0x80,0x52,0xD0,6,0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0x1B0)),0x80,4,0x22,...long(cpu(STADIUM_RESTORE_SLOT)),0x7A,0xFA,0x68,0xAB,0x28,0x6B);
 if(move.length>0x90)throw Error('Nomes: rotina de restauração excede a reserva.');slot.set(move,0x120);
 writes.push([TEAM_NAME_CACHE_SLOT,convertedTeamNameOam(nameRaw)]);
 const restore=[0x08,0xC2,0x30,0x8B,0x48,0xDA,0x5A];
 for(let p=0;p<4;p++)restore.push(0xA2,...long(cpu(MENU_OAM_CACHE_SLOT+p*MENU_OAM_PLANE_SIZE)).slice(0,2),0xA0,(0x5876+p*0x2000)&255,(0x5876+p*0x2000)>>8,0xA9,(MENU_OAM_PLANE_SIZE-1)&255,(MENU_OAM_PLANE_SIZE-1)>>8,0x54,0x7E,cpu(MENU_OAM_CACHE_SLOT)>>16);
 // Substitution sprites originally live at 57D2..5846, inside expanded names.
 // Relocate them immediately after the shared menu objects, and reconstruct
 // both datasets together even when the native loader skips a cached screen.
 const squadCache=new Uint8Array(SQUAD_OAM_CACHE_SIZE);
 for(const [pc,frames,plane,offset]of [[0xC3332,3,12,0],[0xC3348,11,104,12]]){
  const decoded=konamiLzDecompress(base,pc).data;
  const converted=convertedTeamNameOam(decoded,frames,plane);
  for(let p=0;p<4;p++)squadCache.set(converted.slice(p*plane,(p+1)*plane),p*SQUAD_OAM_PLANE+offset);
 }
 for(const [pc,original,next]of [[0x111F4,0x57D2,SQUAD_OAM_DEST],[0x111F9,0xD7DE,SQUAD_OAM_DEST+12|0x8000]]){
  if((base[pc]|base[pc+1]<<8)!==original)throw Error('Substituições: destino nativo divergente.');
  writes.push([pc,Uint8Array.of(next&255,next>>8)]);
 }
 for(const pc of SQUAD_OAM_POINTERS){const original=base[pc]|base[pc+1]<<8;
  if(original<0x57D2||original>=0x5846)throw Error('Substituições: ponteiro nativo divergente.');
  const next=original+SQUAD_OAM_DEST-0x57D2;writes.push([pc,Uint8Array.of(next&255,next>>8)]);
 }
 for(let p=0;p<4;p++)restore.push(0xA2,...long(cpu(SQUAD_OAM_CACHE_SLOT+p*SQUAD_OAM_PLANE)).slice(0,2),0xA0,(SQUAD_OAM_DEST+p*0x2000)&255,(SQUAD_OAM_DEST+p*0x2000)>>8,0xA9,SQUAD_OAM_PLANE-1,0,0x54,0x7E,cpu(SQUAD_OAM_CACHE_SLOT)>>16);
 restore.push(0x7A,0xFA,0x68,0xAB,0x28,0x6B);
 if(restore.length>SQUAD_RESTORE_SIZE)throw Error('Substituições: restauração excede a reserva.');
 const squadCode=new Uint8Array(SQUAD_RESTORE_SIZE).fill(255);squadCode.set(restore);
 writes.push([SQUAD_OAM_CACHE_SLOT,squadCache],[SQUAD_RESTORE_SLOT,squadCode]);
 slot.set([0x5C,...long(cpu(SQUAD_RESTORE_SLOT))],0x1B0);
 const stadiumRestore=[0x08,0xC2,0x30,0x8B,0x48,0xDA,0x5A];
 for(let p=0;p<4;p++)stadiumRestore.push(0xA2,...long(cpu(STADIUM_OAM_CACHE_SLOT+p*STADIUM_OAM_PLANE)).slice(0,2),0xA0,(0x5600+p*0x2000)&255,(0x5600+p*0x2000)>>8,0xA9,0xD1,1,0x54,0x7E,cpu(STADIUM_OAM_CACHE_SLOT)>>16);
 stadiumRestore.push(0x7A,0xFA,0x68,0xAB,0x28,0x6B);const stadiumCode=new Uint8Array(STADIUM_RESTORE_SIZE).fill(255);stadiumCode.set(stadiumRestore);
 const stadiumRaw=konamiLzDecompress(base,0xC2817).data;
 writes.push([STADIUM_OAM_CACHE_SLOT,convertedTeamNameOam(stadiumRaw,61,STADIUM_OAM_PLANE)],[STADIUM_RESTORE_SLOT,stadiumCode]);
 writes.push([MENU_OAM_CACHE_SLOT,convertedMenuOam(base)]);
 slot.set([0x08,0xBF,0xC4,0xFB,0x82,0x18,0x6F,0xF8,0x5F,0x7E,0x28,0x09,0,0,0x6B],0x100);
 for(const [pc,original,offset]of [[0x3B00,0x80947E,0],[0x3B59,0x809482,0x40]]){
  if(base[pc]!==0x22||long(original).some((v,i)=>base[pc+1+i]!==v))throw Error('Nomes altos: conversor OAM divergente.');
  writes.push([pc,Uint8Array.from([0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+offset))])]);
 }
 for(const pc of TEAM_NAME_POINTER_READS){if([0xBF,0xC4,0xFB,0x82].some((v,i)=>base[pc+i]!==v))throw Error('Nomes altos: referência de nomes divergente em '+pc.toString(16));writes.push([pc,Uint8Array.from([0x22,...long(cpu(TEAM_NAME_HOOK_SLOT+0x100))])]);}
 writes.push([TEAM_NAME_HOOK_SLOT,slot]);return writes;
}
