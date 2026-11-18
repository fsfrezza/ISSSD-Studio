import {MATCH_ANNOUNCEMENTS} from './match-announcement-fields.mjs';
import {normalizeAnnouncement,renderMatchAnnouncements,plusMatchAnnouncementsWriter} from './plus-match-announcements.mjs';
export {MATCH_ANNOUNCEMENTS,renderMatchAnnouncements};

export function applyDeluxeMatchAnnouncements(input,base,values){
 if(values===undefined)return input;
 if(!values||typeof values!=='object'||Array.isArray(values)||Object.entries(values).some(([id,v])=>!MATCH_ANNOUNCEMENTS.some(f=>f[0]===id)||typeof v!=='string'||!v.trim()))throw Error('Avisos: campos inválidos.');
 if(!MATCH_ANNOUNCEMENTS.some(([id,en])=>Object.hasOwn(values,id)&&normalizeAnnouncement(values[id])!==en))return input;
 const out=new Uint8Array(0x400000).fill(255);out.set(input);out[0x7fd7]=12;
 plusMatchAnnouncementsWriter(out,{additionalScreenTextsV1:{values:{'match-announcements':values}}},base);
 return out;
}

// Decode the exact generated 2bpp tiles and descriptor transfers, rather
// than approximating the lettering with a browser font.
export function announcementPreview(rendered,index){
 const pixels=new Uint8ClampedArray(256*32*4),large=index===0,bytes=rendered.descriptors[index][1],lo=rendered.raw[large?0:2],hi=rendered.raw[large?1:3],font=large?rendered.goalFont:rendered.font,first=large?0x1a0:0x190;
 const colors=[[0,0,0,0],[255,239,112,255],[38,24,12,255],[255,255,255,255]];
 for(let at=0;at<bytes.length-2;at+=4){const x=((bytes[at]|bytes[at+1]<<8)-0x80)*4,source=((bytes[at+2]|bytes[at+3]<<8)-(large?0xc000:0xc200))/2;
  for(let ty=0;ty<4;ty++)for(let tx=0;tx<4;tx++){const cell=source+ty*4+tx,tile=((lo[cell]|hi[cell]<<8)&0x3ff)-first;
   for(let y=0;y<8;y++)for(let px=0;px<8;px++){const pos=tile*16+y*2,bit=7-px,v=tile<0||pos>=font.length?0:((font[pos]>>bit)&1)|(((font[pos+1]>>bit)&1)<<1),dx=x+tx*8+px;if(dx>=0&&dx<256)pixels.set(colors[v],((ty*8+y)*256+dx)*4);}
  }
 }return pixels;
}
