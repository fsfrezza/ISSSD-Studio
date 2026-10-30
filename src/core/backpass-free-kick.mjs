// Validated backpass free kick v2: native pose reset and goal-line wall.
// Native flow: A4:DD45 -> 84:E4A7 -> 84:E4FE -> 84:DA2B.
import {buildExperimentalBackpassFreeKick,BACKPASS_STATE,BACKPASS_STATE_MAGIC,experimentalBackpassHooks} from './experimental-backpass-penalty.mjs';
import {writeFinalSnesChecksum} from './plus-export-finalizer.mjs';
const offset=a=>((a>>>16)&127)*32768+(a&32767),long=a=>[a&255,a>>>8&255,a>>>16&255];
export const WALL_MARKER=BACKPASS_STATE+18,NEAR_GOAL=BACKPASS_STATE+20,WALL_HELPER=0xFFFE00,WALL_ARRIVAL=0xFFFF00;
function code(){const b=[],labels={},refs=[];return{put(...v){b.push(...v);},label(n){labels[n]=b.length;},branch(op,n){b.push(op,0);refs.push([b.length-1,n]);},finish(){for(const[at,n]of refs){const d=labels[n]-at-1;if(d< -128||d>127)throw Error('Wall branch out of range');b[at]=d&255;}return Uint8Array.from(b);}};}
export function backpassWallHelper(){
 const c=code(),e=(...v)=>c.put(...v);
 // A holds transverse Y, X holds longitudinal wall target. Preserve A/Y ABI.
 e(0xA8,0x08,0x48,0xAF,...long(WALL_MARKER),0xC9,0xCC,0xBA);c.branch(0xD0,'restore');
 e(0xAF,...long(0xC2),0xC9,5,0);c.branch(0xD0,'restore');
 e(0xAF,...long(NEAR_GOAL),0xC9,1,0);c.branch(0xF0,'left');e(0xC9,2,0);c.branch(0xF0,'right');
 e(0x8A,0x29,0,0x80);c.branch(0xF0,'upper');
 c.label('left');e(0xA2,0,0);c.branch(0x80,'restore');
 c.label('upper');e(0x8A,0xCF,...long(0x12A2));c.branch(0x90,'restore');c.label('right');e(0xAF,...long(0x12A2),0xAA);
 c.label('restore');e(0x68,0x28);
 // Replay displaced TAY / LDA $00C0 / BEQ. TAY was executed at entry.
 e(0xAF,...long(0xC0));c.branch(0xF0,'continue');e(0xA9,0x7C,0xAF,0x85,0x6A);
 c.label('continue');e(0x5C,...long(0x84E509));return c.finish();
}

// The native penalty spot is 0100 world units from either goal line (A4:DE9F).
export function backpassWallMark(){
 const c=code(),e=(...v)=>c.put(...v);
 e(0xA9,0,0,0x8F,...long(NEAR_GOAL),0xAF,...long(0x11F0),0xC9,0,1);c.branch(0x90,'left');
 e(0xAF,...long(0x12A2),0x38,0xEF,...long(0x11F0),0xC9,0,1);c.branch(0xB0,'mark');
 e(0xA9,2,0);c.branch(0x80,'store');c.label('left');e(0xA9,1,0);
 c.label('store');e(0x8F,...long(NEAR_GOAL));c.label('mark');e(0xA9,0xCC,0xBA,0x8F,...long(WALL_MARKER),0xA9,0,0,0x8F,...long(0x19D0),0x22,0x45,0xDD,0xA4,0x6B);
 return c.finish();
}
export function backpassWallArrival(){
 const c=code(),e=(...v)=>c.put(...v);
 e(0x08,0x48,0xDA,0x5A,0xAF,...long(WALL_MARKER),0xC9,0xCC,0xBA);c.branch(0xD0,'restore');
 e(0xAF,...long(0xC2),0xC9,5,0);c.branch(0xD0,'restore');
 e(0xAF,...long(NEAR_GOAL));c.branch(0xF0,'restore');
 // Native arrival accepts a tolerance around the target. Put the actual feet
 // on the line before initializing the wall's standing action.
 e(0xA5,0x50,0x85,0x2A,0xA9,0,0,0x85,6,0x85,0x0A,0x22,0xAF,0xE1,0x80);
 c.label('restore');e(0x7A,0xFA,0x68,0x28,0xA9,0x78,4,0x22,0x44,0x85,0x84,0x5C,0x8A,0xAF,0x84);return c.finish();
}

export function buildBackpassFreeKickRom(base){
 const rom=buildExperimentalBackpassFreeKick(base),native=[0xA8,0xAD,0xC0,0,0xF0,5];
 if(native.some((v,i)=>base[offset(0x84E4FE)+i]!==v))throw Error('Native wall target routine differs');
 for(let p=0x3FFE00;p<0x400000;p++)if(rom[p]!==255)throw Error('Wall experiment reservation occupied');
 // Reinitialize through native action zero. Jumping straight to field idle
 // (0010) leaves the keeper's old animation descriptor active during DMA.
 const resetPattern=[0xA9,0x10,0,0x22,0x44,0x85,0x84];
 const resetAt=rom.findIndex((_,i)=>i>=0x3FF200&&i<0x3FF400&&resetPattern.every((v,j)=>rom[i+j]===v));
 if(resetAt<0)throw Error('Keeper reset sequence missing');rom[resetAt+1]=0;
 const hook=experimentalBackpassHooks({punishment:'free-kick'}),restart=hook.restart;
 const find=needle=>{const at=restart.findIndex((_,i)=>needle.every((v,j)=>restart[i+j]===v));if(at<0)throw Error('Backpass dispatch instruction missing');return offset(hook.dispatch)+at;};
 // Marker starts only on the private foul. Every ordinary restart clears it.
 const mark=backpassWallMark();
 const clear=[0xA9,0,0,0x8F,...long(WALL_MARKER),0x8F,...long(NEAR_GOAL),0x5C,0x03,0xDC,0xA4];
 rom.set([0x22,0xA0,0xFE,0xFF],find([0x22,0x45,0xDD,0xA4]));
 rom.set([0x5C,0x80,0xFE,0xFF],find([0x5C,0x03,0xDC,0xA4]));
 rom.set(backpassWallHelper(),offset(WALL_HELPER));rom.set(mark,0x3FFEA0);rom.set(clear,0x3FFE80);rom.set(backpassWallArrival(),offset(WALL_ARRIVAL));
 // Clear the additional private word when starting a new match, too.
 rom.set([0xA9,0,0,0x8F,...long(WALL_MARKER),0x8F,...long(NEAR_GOAL),...hook.reset],offset(hook.resetEntry));
 rom.set([0x5C,...long(WALL_HELPER),0xEA,0xEA],offset(0x84E4FE));
 if([0xA9,0x78,4,0x20,0x4E,0x85].some((v,i)=>base[offset(0x84AF84)+i]!==v))throw Error('Native wall arrival differs');
 if(backpassWallHelper().length>0x80||mark.length>0x60||backpassWallArrival().length>0x100)throw Error('Wall helper exceeds reservation');
 rom.set([0x5C,...long(WALL_ARRIVAL),0xEA,0xEA],offset(0x84AF84));
 writeFinalSnesChecksum(rom);return rom;
}

export const BACKPASS_FREE_KICK_RANGES=Object.freeze([
 ...experimentalBackpassHooks({punishment:'free-kick'}).writes.map(([off,bytes])=>[off,off===0x3FF000?0x400000:off+bytes.length]),
 [offset(0x84E4FE),offset(0x84E4FE)+6],
 [offset(0x84AF84),offset(0x84AF84)+6],
 [0x7FD8,0x7FD9],
]);
