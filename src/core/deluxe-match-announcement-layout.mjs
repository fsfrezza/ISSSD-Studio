import {DELUXE_MENU_SECTIONS} from './deluxe-menu-text.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {NATIVE_MENU_FONTS} from './deluxe-menu-fields.mjs';

const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/:+$/,'');
const fields=Object.fromEntries(DELUXE_MENU_SECTIONS.flatMap(s=>s.fields.map(f=>[f[0],f[1]])));
export const ANNOUNCEMENT_LAYOUT_ID='announcement-layout';
export const announcementLayoutEnabled=changes=>changes?.improvements?.includes(ANNOUNCEMENT_LAYOUT_ID)??false;
export function announcementPortugueseReference(changes){
 const teams=changes?.structure?.teams??[];
 return ['BRASIL','INGLATERRA'].every(name=>teams.some(t=>norm(t.name).toUpperCase()===name))&&changes?.buttonLabels?.confirm==='CONFIRMA'&&changes?.buttonLabels?.cancel==='CANCELA';
}
export function announcementReferenceId(changes){
 if(!announcementLayoutEnabled(changes))return 'match-announcement';
 return 'match-announcement-layout'+(announcementPortugueseReference(changes)?'-pt':'')+(changes.stadiumUnits==='meters'?'-meters':'');
}
export function announcementLines(values,stadium,time,weather,referee,duration){
 const country=norm((values.data_87ca9b??fields.data_87ca9b).split('\n')[stadium]??'');
 const rawCondition=norm((values.data_87ca80??fields.data_87ca80).split('\n')[weather]??'');
 const condition=rawCondition==='CHUV'||rawCondition==='CHUV.'?'CHUVA':rawCondition==='SOL'?'BOM':rawCondition;
 const label=id=>norm(values[id]??fields[id]);
 const hour=['13:00','16:00','19:00'][time];
 const minutes=[3,5,7,1][duration],judge='JUIZ: '+['HEINZ','CARLOS','HASEGA','CACHORRO'][referee];
 return [label('data_87cad3')+': '+country,judge,'CLIMA: '+condition,'DURACAO POR TEMPO: '+minutes+' min.','HOJE - '+hour];
}
export const announcementRow=(s,n=30)=>s.slice(0,n).padStart(Math.floor((n+s.slice(0,n).length)/2),' ').padEnd(n,' ');
// Actual BG3 tiles loaded by the announcement (not the encoded script alphabet).
export function announcementTile(c){
 if(c>='0'&&c<='9')return 0xd3+Number(c);
 if(c==='h')return 0x3c;
 if(c==='m')return 0x41;
 if(c==='i')return 0x3d;
 if(c==='n')return 0x42;
 if(c==='<')return 0x5c;
 if(c==='>')return 0x5d;
 if(c===':')return 0xfa;
 if(c==='-')return 0xfc;
 if(c==='.')return 0xdf;
 if(c==='!')return 0xde;
 if(c==="'")return 0xfb;
 c=c.toUpperCase();return c>='A'&&c<='Z'?0xe0+c.charCodeAt(0)-65:0;
}
// The tall native font has a dedicated punctuation tile in its bottom half.
// Use the same two tile identities in the ROM and preview.
export function announcementTallTiles(base,c){
 if(c==='<'||c==='>')return [0,announcementTile(c)];
 // The native tall '0' is C0/C0: both halves are the same tile.
 // Using BF/C0 was an invalid guess and produces corrupted graphics on the match announcement.
 // Use the loaded tall 'O' tiles (AB/AC), whose round silhouette serves as a safe zero fallback.
 // This avoids writing nonexistent glyph halves into BG3; verify appearance in ZSNES.
 if(c==='0'){const n=NATIVE_MENU_FONTS.TallMenuText.O;return [base[0x3be6a+n*2],base[0x3be6b+n*2]];}
 const n=NATIVE_MENU_FONTS.TallMenuText[c]??NATIVE_MENU_FONTS.TallMenuText[c.toUpperCase()]??0;
 return [base[0x3be6a+n*2],base[0x3be6b+n*2]];
}
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),long=n=>[n&255,n>>8&255,n>>16&255],word=n=>[n&255,n>>8&255];
export function applyDeluxeAnnouncementLayout(out,base,changes){
 if(!announcementLayoutEnabled(changes))return out;
 const values=Object.assign({},...Object.values(changes.menuTexts??{}));
 const table=(rows)=>Uint8Array.from(rows.flatMap(s=>[...announcementRow(s)].flatMap(c=>announcementTallTiles(base,c))));
 const stadium=table(Array.from({length:8},(_,i)=>announcementLines(values,i,0,0,0,0)[0]));
 const weather=table(Array.from({length:12},(_,i)=>announcementLines(values,0,0,Math.floor(i/4),0,i%4)[2]));
 const ref=table(Array.from({length:4},(_,i)=>announcementLines(values,0,0,0,i,0)[1]));
 const time=table(Array.from({length:4},(_,i)=>announcementLines(values,0,0,0,0,i)[3]));
 const title=table(Array.from({length:3},(_,i)=>announcementLines(values,0,i,0,0,0)[4]));
 // Separate native free areas, outside the main-menu, opening and stadium patches.
 const codePC=0x177600,stadiumPC=0x126900,weatherPC=0x177900,refPC=0x126ae0,timePC=0x177c00,titlePC=0x177d00;
 const code=[],emit=(...b)=>code.push(...b),ldy=n=>emit(0xa0,...word(n));
 const multiply60=()=>{emit(0x48,0x0a,0x0a,0x0a,0x0a,0x0a,0x38,0xe3,1,0x38,0xe3,1,0x0a,0xaa,0x68);};
 const row=(pc,y,col=1,width=30)=>{
  multiply60();ldy(y*64+col*2);
  // Draw 30 glyphs at BG3 row y, preserving the background layers.
  const loop=code.length;
  emit(0xbf,...long(cpu(pc+(col-1)*2)),0xda,0xbb,0x48,0x29,0xff,0x00,0x09,0x00,0x20,0x9f,0x00,0xe0,0x7f,0x68,0xeb,0x29,0xff,0,0x09,0,0x20,0x9f,0x40,0xe0,0x7f,0xfa,0xe8,0xe8,0xc8,0xc8,0xc0,...word(y*64+(col+width)*2),0xd0);emit((loop-(code.length+1))&255);
 };
 emit(0x08,0xc2,0x30,0xda,0x5a,0xa5,0x4c,0x29,7,0);row(stadiumPC,17);
 // The referee and game duration have already been resolved by native setup.
 emit(0xaf,0x54,0xd8,0x7e,0xf0,5,0xa9,3,0,0x80,6,0xad,0x58,0x1e,0x29,3,0);row(refPC,19);
 emit(0xad,0x5a,0x1e,0x29,3,0,0x48,0xa5,0x4e,0x0a,0x0a,0x18,0x63,1,0xfa);row(weatherPC,21);
 emit(0xad,0x5a,0x1e,0x29,3,0);row(timePC,23);
 emit(0xa5,0x50);row(titlePC,2,7,16);
 emit(0x7a,0xfa,0x28,0x6b);
 const reserve=(pc,data)=>{if(out.subarray(pc,pc+data.length).some(v=>v!==255)||base.subarray(pc,pc+data.length).some(v=>v!==255))throw Error('Anúncio: reserva ocupada em '+pc.toString(16));out.set(data,pc);};
 if(code.length>0x300)throw Error('Anúncio: código excede reserva.');
 reserve(codePC,code);reserve(stadiumPC,stadium);reserve(weatherPC,weather);reserve(refPC,ref);reserve(timePC,time);reserve(titlePC,title);
 // Remove the three original tall labels, but preserve the remaining menu script and title variants.
 out.set(base.slice(0x3b1c7,0x3b1ee),0x3b1b5);out.fill(0xff,0x3b1dc,0x3b1ee);
 // Pitch and its native dimension text move together by two tile rows.
 const map=konamiLzDecompress(base,0x1133a0),m=new Uint16Array(map.data.buffer),n=m.slice();
 for(let y=10;y<16;y++)n.set(m.slice((y+2)*32+12,(y+2)*32+20),y*32+12);
 for(let y=16;y<18;y++)n.fill(0,y*32+12,y*32+20);
 // Extend the blue panel down two tile rows to contain the fourth detail line.
 n.set(m.slice(23*32,24*32),25*32);
 for(let y=23;y<25;y++){n[y*32+1]=m[22*32+1];n[y*32+30]=m[22*32+30];for(let x=2;x<30;x++)n[y*32+x]=0;}
 const packed=konamiLzCompress(new Uint8Array(n.buffer));
 if(packed.length>map.compressedSize)throw Error('Mapa do anúncio excede a reserva original.');
 out.set(packed,0x1133a0);
 out[0xd5b8]=0x6f; // extend the second HDMA window segment by 16 pixels
 out[0x3b1f4]=0xff;out[0x3b1fb]=0xff; // native title must not overwrite dynamic hour
 out.set([0x31,0x01],0x3b1b8);out.set([0xab,0x01],0x3b1be);
 out[0x121ffa]=0x09;
 // Keep native random/hour override and $50 state for subsequent match setup.
 out.fill(0xea,0x34481,0x34498);
 out.fill(0xea,0x344a5,0x344cd);out.set([0x22,...long(cpu(codePC)),0x60],0x344a5);
 return out;
}
