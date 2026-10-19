import {konamiLzDecompress} from './konami-lz.mjs';
export const MENU_OAM_CACHE_SLOT=0x3E3C00;
export const MENU_OAM_PLANE_SIZE=0x63C;
export const MENU_OAM_CACHE_SIZE=MENU_OAM_PLANE_SIZE*4;
// Recreate CODE_80947E's four native planes from the immutable shared menu
// dataset. Its resident 5876..5EB2 objects overlap the stadium name gap.
export function convertedMenuOam(base){
 if([0xB9,0xB0,0x98,0x76,0x58].some((v,i)=>base[0x10E3F+i]!==v))throw Error('Nomes: fonte dos objetos compartilhados divergente.');
 const raw=konamiLzDecompress(base,0xC30B9).data,count=raw[1]|raw[2]<<8,frames=raw[0],header=3+frames;
 if(frames!==21||count*2!==MENU_OAM_PLANE_SIZE||raw.length!==header+count*4)throw Error('Nomes: objetos compartilhados divergentes.');
 const out=new Uint8Array(MENU_OAM_CACHE_SIZE);let index=0;
 for(let f=0;f<frames;f++)for(let i=0;i<raw[3+f];i++,index++){
  const at=index*2,x=raw[header+index],y=raw[header+count+index],tile=raw[header+count*2+index],prop=raw[header+count*3+index];
  out[at]=i===0?raw[3+f]:0;out[at+1]=prop&16?255:0;
  out[MENU_OAM_PLANE_SIZE+at]=x;out[MENU_OAM_PLANE_SIZE+at+1]=x&128?255:0;
  out[MENU_OAM_PLANE_SIZE*2+at]=y;out[MENU_OAM_PLANE_SIZE*2+at+1]=y&128?255:0;
  out[MENU_OAM_PLANE_SIZE*3+at]=tile;out[MENU_OAM_PLANE_SIZE*3+at+1]=prop&0xEF;
 }
 if(index!==count)throw Error('Nomes: contagem de objetos compartilhados divergente.');return out;
}
