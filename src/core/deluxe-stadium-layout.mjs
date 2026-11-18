import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {announcementTallTiles} from './deluxe-match-announcement-layout.mjs';

export const STADIUM_LAYOUT_ID='stadium-layout';
// Extend the native rectangle table without changing its existing entries.
// The additional rectangle spans both rows of the tall hour label.
export function applyDeluxeHourCursor(out,base,optimized){
 // Keep the HORARIO: caption outside the active box. The value starts at tile column 16.
 const row=optimized?24:25,col=15,width=11,at=0x3fca0,table=new Uint8Array(244);
 table.set(out.slice(0x3ac80,0x3ad6f));
 const addr=0xd000+row*64+col*2;
 table.set([addr&255,addr>>8,width,optimized?1:0],240);
 const reserve=(pc,data)=>{if(out.slice(pc,pc+data.length).some(v=>v!==255))throw Error('Cursor de horário: reserva ocupada.');out.set(data,pc);};
 reserve(at,table);
 for(const pc of [0x29129,0x2913c,0x2914b,0x2915a,0x29171,0x291a7,0x291ef,0x29208,0x2921a,0x29229,0x29250,0x29293]){
  const offset=base[pc+1]-0x80;if(base[pc+2]!==0xac||offset<0||offset>3)throw Error('Cursor de horário: referência divergente.');
  out.set([0xa0+offset,0xfc],pc+1);
 }
 const map=konamiLzDecompress(out,0x1083f6),tiles=new Uint16Array(map.data.buffer);
 for(let x=col;x<=col+width;x++){
  tiles[row*32+x]=x===col?0x1c0a:x===col+width?0x5c0a:0x9c08;
  tiles[(row+(optimized?3:2))*32+x]=x===col?0x9c0a:x===col+width?0xdc0a:0x9c0c;
 }
 for(let y=row+1;y<row+(optimized?3:2);y++){tiles[y*32+col]=0x5c09;tiles[y*32+col+width]=0x1c09;}
 const packed=konamiLzCompress(new Uint8Array(tiles.buffer)),dest=0x177400;
 if(packed.length>0x200)throw Error('Cursor de horário: mapa excede reserva.');
 reserve(dest,packed);out.set([0x00,0xf4,0xae],0x112d7);
}
// Only the selection screen's own maps, text positions and weather indicators.
export function applyDeluxeStadiumLayout(out,base,withHour){
 const write=(at,expected,replacement)=>{
  if(expected.some((v,i)=>base[at+i]!==v||out[at+i]!==v))throw Error('Layout de estádio incompatível em '+at.toString(16));
  out.set(replacement,at);
 };
 const move=(at,src,oldSize,ref,reserve)=>{
  const packed=konamiLzCompress(new Uint8Array(src.buffer));
  if(packed.length<=oldSize){write(at,base.slice(at,at+oldSize),packed);return;}
  if(!reserve||packed.length>0x200||out.slice(reserve,reserve+packed.length).some(v=>v!==255))throw Error('Reserva do layout de estádio ocupada.');
  const cpu=0x800000|((reserve>>15)<<16)|0x8000|(reserve&32767);
  write(ref,base.slice(ref,ref+3),[cpu&255,(cpu>>8)&255,cpu>>16]);out.set(packed,reserve);
 };
 const a=konamiLzDecompress(base,0x1083f6),b=konamiLzDecompress(base,0x13e3d3);
 const m=new Uint16Array(a.data.buffer),n=m.slice(),p=new Uint16Array(b.data.buffer),q=p.slice();
 if(m.length!==1024||p.length!==1024||m[8*32+15]!==0x1830)throw Error('Mapas de estádio incompatíveis.');
 for(let y=8;y<14;y++){n.fill(0,y*32+15,y*32+19);n.set(m.slice(y*32+15,y*32+23),y*32+18);}
 for(let y=16;y<27;y++)n.set(m.slice(y*32+4,y*32+28),(y-2)*32+4);
 for(let y=25;y<27;y++)n.fill(0,y*32+4,y*32+28);
 // Static upper border uses exactly the same outer columns and corner
 // orientation as the weather cards. Their top edge is the shared divider.
 for(let x=4;x<=27;x++)n[4*32+x]=x===4?0x1c0a:x===27?0x5c0a:0x9c08;
 for(let y=5;y<14;y++){n[y*32+4]=0x5c09;n[y*32+27]=0x1c09;}
 for(let y=17;y<24;y++)q.set(p.slice(y*32+4,y*32+28),(y-2)*32+4);
 for(let y=22;y<24;y++)q.fill(0x2000,y*32+4,y*32+28);
 if(withHour){
  for(const [i,c] of [...'HORARIO: ALEATORIO'].entries())for(let h=0;h<2;h++)q[(25+h)*32+7+i]=0x2000+announcementTallTiles(base,c)[h];
 }
 move(0x1083f6,n,a.compressedSize);
 move(0x13e3d3,q,b.compressedSize,0x112dd,0x177200);
 // $87B162 script: dimension suffixes and weather captions.
 const script=0x3b162;
 // Native window bounds, not the country-name backdrop. Align with weather.
 write(0xd5a7,[0x31,0xce],[0x27,0xd8]);
 // HDMA dark window starts at the actual blue top edge and stops at the weather divider.
 write(0xd5a3,[0x21],[0x26]);
 write(0xd5a6,[0x56],[0x50]);
 // Rectangle 8 is exclusive to the stadium's Op3E; 9–11 are its weather cards.
 write(0x3aca0,[0x0c,0xd1,0x13,0x08],[0x08,0xd1,0x17,0x08]);
 write(script+15,[8],[0]); // Skip the old dynamic frame; the tilemap owns it.
 for(const at of [0x3aca4,0x3aca8,0x3acac])write(at,[base[at],base[at+1]],[base[at]|0x80,base[at+1]-1]);
 // L/R indicators flank the enlarged panel without covering the pitch.
 write(0x3a60d,[0x1a,0x40,0xe4,0x40],[0x0a,0x40,0xf4,0x40]);
 for(const [from,to] of [[0x00f4,0x00f7],[0x016e,0x0171],[0x0326,0x02e6]]){
  const at=base.subarray(script,script+0x3d).findIndex((v,i)=>v===(from&255)&&base[script+i+1]===(from>>8));
  if(at<0)throw Error('Posição de legenda de estádio ausente.');
  write(script+at,[from&255,from>>8],[to&255,to>>8]);
 }
 write(0x122001,[0x12,0x07],[0x15,0x07]);
 // $879FA3 / $879FBF are TEAM flag positions. Leave them untouched.
 return out;
}
