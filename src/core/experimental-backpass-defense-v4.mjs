// Experimental only. Never selected by the Editor's gameplay writer.
// 80:E1AF projects field coordinates as screenX = worldX + worldY - cameraX.
// Choose the side by the ball's projection relative to the goal center;
// raw worldY alone can put a near-goal wall on the opposite visible side.
import {buildBackpassFreeKickRom,backpassWallArrival,WALL_ARRIVAL} from './backpass-free-kick.mjs';
import {BACKPASS_STATE} from './experimental-backpass-penalty.mjs';
import {goalkeeperSetPiecesWriter} from './goalkeeper-set-pieces.mjs';
import {writeFinalSnesChecksum} from './plus-export-finalizer.mjs';
const marker=BACKPASS_STATE+18,near=BACKPASS_STATE+20,long=a=>[a&255,a>>8&255,a>>16&255];
function code(){const b=[],labels={},refs=[];return {e(...v){b.push(...v);},label(n){labels[n]=b.length;},br(op,n){b.push(op,0);refs.push([b.length-1,n]);},end(){for(const[a,n]of refs){const d=labels[n]-a-1;if(d< -128||d>127)throw Error('v4 branch exceeds range');b[a]=d&255;}return Uint8Array.from(b);}};}
export function experimentalDefenseCenter(){const c=code(),e=(...v)=>c.e(...v);
 e(0xAF,...long(0x11F6),0x0A,0x85,0x40,0x0A,0x18,0x65,0x40,0x85,0x40,0xA9,40,0,0x38,0xE5,0x40,0x85,0x42);
 e(0xAF,...long(0x11F0),0x18,0x6F,...long(0x11F2),0x38,0xEF,...long(0x12D8),0x48,0xAF,...long(near),0xC9,2,0);c.br(0xF0,'right');e(0x68);c.br(0x80,'divide');c.label('right');e(0x68,0x38,0xEF,...long(0x12A2));
 c.label('divide');for(let i=0;i<2;i++)e(0xC9,0,0x80,0x6A);c.br(0x30,'negative');e(0xC5,0x42);c.br(0x90,'done');e(0xA5,0x42);c.br(0x80,'done');c.label('negative');e(0x49,255,255,0x1A,0xC5,0x42);c.br(0x90,'negate');e(0xA5,0x42);c.label('negate');e(0x49,255,255,0x1A);c.label('done');e(0x85,0x44,0x6B);return c.end();}
export function experimentalDefenseWall(){const c=code(),e=(...v)=>c.e(...v);
 e(0x08,0x48,0xAF,...long(marker),0xC9,0xCC,0xBA);c.br(0xD0,'native');e(0xAF,...long(0xC2),0xC9,5,0);c.br(0xD0,'native');e(0xAF,...long(near));c.br(0xF0,'native');
 e(0x22,...long(0xFFF620),0xA5,0x68,0x3A,0x0A,0x85,0x46,0x0A,0x18,0x65,0x46,0x0A,0x38,0xE5,0x40,0x18,0x65,0x44,0x18,0x6F,...long(0x12D8),0xA8,0xAF,...long(near),0xC9,1,0);c.br(0xF0,'left');e(0xAF,...long(0x12A2),0xAA);c.br(0x80,'continue');c.label('left');e(0xA2,0,0);c.label('continue');e(0x68,0x28,0xAF,...long(0xC0));c.br(0xF0,'jump');e(0xA9,0x7C,0xAF,0x85,0x6A);c.label('jump');e(0x5C,...long(0x84E509));c.label('native');e(0x68,0x28,0x5C,...long(0xFFFE00));return c.end();}
export function buildExperimentalBackpassDefenseV4(base){
 const rom=buildBackpassFreeKickRom(base),center=experimentalDefenseCenter(),wall=experimentalDefenseWall();if(center.length>0x60||wall.length>0x180)throw Error('v4 reservation exceeded');
 rom.set(center,0x3FF620);rom.set(wall,0x3FF480);rom.set(backpassWallArrival({lateralSnap:true,allNear:true}),0x3FFF00);
 goalkeeperSetPiecesWriter(rom,{goalkeeperFreeKickTaker:true,goalkeeperCornerKickTaker:true},base);writeFinalSnesChecksum(rom);return rom;
}
