import {TITLE_LOGO_LAYOUT} from './title-logo-layout.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {decodePlusMainMenuTile,encodePlusMainMenuTile} from './plus-main-menu-renderer.mjs';
export const TITLE_LOGO_BOUNDS={x:Math.max(0,Math.min(...TITLE_LOGO_LAYOUT.map(s=>s.x))-4),y:Math.max(0,Math.min(...TITLE_LOGO_LAYOUT.map(s=>s.y))-4),right:Math.min(256,Math.max(...TITLE_LOGO_LAYOUT.map(s=>s.x+s.size))+4),bottom:Math.min(240,Math.max(...TITLE_LOGO_LAYOUT.map(s=>s.y+s.size))+4)};
export function readTitleLogo(base){
 const desc=0x1198b,ptr=base[desc]|base[desc+1]<<8|base[desc+2]<<16;
 if((ptr&32768)===0||(ptr>>>16)<128)throw Error('Letreiro: ponteiro inválido');
 const pc=((ptr>>>16)&127)*32768+(ptr&32767),decoded=konamiLzDecompress(base,pc);
 if(decoded.data.length!==3840||pc+decoded.compressedSize>base.length)throw Error('Letreiro: formato não reconhecido');
 return {pc,capacity:decoded.compressedSize,tiles:decoded.data};
}
function eachPixel(fn){
 for(const s of TITLE_LOGO_LAYOUT)for(let ty=0;ty<s.size/8;ty++)for(let tx=0;tx<s.size/8;tx++){
  const tile=s.tile+ty*16+tx;
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
   const screenX=s.x+(s.flipX?s.size-8-tx*8:tx*8)+x-TITLE_LOGO_BOUNDS.x,screenY=s.y+(s.flipY?s.size-8-ty*8:ty*8)+y-TITLE_LOGO_BOUNDS.y;
   fn(tile,(s.flipY?7-y:y)*8+(s.flipX?7-x:x),screenX,screenY);
  }
 }
}
const rgb=v=>[0,5,10].map(s=>Math.round((v>>s&31)*255/31));
export function titleLogoPixels(base,changes={}){
 const native=readTitleLogo(base),raw=changes.logoTiles?Uint8Array.from(changes.logoTiles):native.tiles;
 if(raw.length!==3840)throw Error('Letreiro: tiles inválidos');
 const colors=changes.palettes?.logo??Array.from({length:16},(_,i)=>base[0x4c318+i*2]|base[0x4c319+i*2]<<8);
 const width=TITLE_LOGO_BOUNDS.right-TITLE_LOGO_BOUNDS.x,height=TITLE_LOGO_BOUNDS.bottom-TITLE_LOGO_BOUNDS.y,rgba=new Uint8ClampedArray(width*height*4),tiles=Array.from({length:120},(_,i)=>decodePlusMainMenuTile(raw.slice(i*32,i*32+32)));
 eachPixel((tile,index,x,y)=>{if(tile>=tiles.length||x<0||y<0||x>=width||y>=height)return;const v=tiles[tile][index];if(v)rgba.set([...rgb(colors[v]),255],(y*width+x)*4);});
 return {rgba,width,height,colors,tiles,native};
}
export function importTitleLogo(base,changes,rgba,width,height){
 const current=titleLogoPixels(base,changes);
 if(width!==current.width||height!==current.height||rgba.length!==width*height*4)throw Error('Letreiro: use uma imagem de '+current.width+' × '+current.height+' pixels');
 if(current.rgba.every((v,i)=>v===rgba[i]))return Uint8Array.from(changes.logoTiles??current.native.tiles);
 const assignments=new Map(),covered=new Set(),palette=current.colors.map(rgb);
 eachPixel((tile,index,x,y)=>{if(tile>=120||x<0||y<0||x>=width||y>=height)return;
  const offset=(y*width+x)*4;covered.add(y*width+x);let value=0;
  if(rgba[offset+3]>=128){const original=current.tiles[tile][index];if(original&&palette[original].every((v,i)=>v===rgba[offset+i]))value=original;
   else{let distance=Infinity;for(let c=1;c<16;c++){const d=palette[c].reduce((n,v,i)=>n+(v-rgba[offset+i])**2,0);if(d<distance){distance=d;value=c;}}}
  }
  const key=tile*64+index;if(assignments.has(key)&&assignments.get(key)!==value)throw Error('A imagem conflita com pixels compartilhados do letreiro. Ajuste a imagem para a estrutura original.');assignments.set(key,value);
 });
 for(let i=0;i<width*height;i++)if(rgba[i*4+3]>=128&&!covered.has(i))throw Error('A imagem ocupa uma área sem sprites no letreiro original');
 const tiles=current.tiles.map(t=>t.slice());for(const [key,value]of assignments)tiles[Math.floor(key/64)][key%64]=value;
 const out=new Uint8Array(3840);tiles.forEach((t,i)=>out.set(encodePlusMainMenuTile(Array.from({length:8},(_,y)=>Array.from(t.slice(y*8,y*8+8)))),i*32));return out;
}
export function applyTitleLogo(out,base,tiles){
 if(tiles===undefined)return out;
 if(!Array.isArray(tiles)||tiles.length!==3840||tiles.some(b=>!Number.isInteger(b)||b<0||b>255))throw Error('Letreiro: tiles inválidos');
 const native=readTitleLogo(base);if(native.tiles.every((b,i)=>b===tiles[i]))return out;
 const compressed=konamiLzCompress(Uint8Array.from(tiles));if(compressed.length>native.capacity)throw Error('Letreiro: gráficos excedem o bloco original ('+compressed.length+'/'+native.capacity+' bytes)');
 const verify=konamiLzDecompress(compressed).data;if(!verify.every((b,i)=>b===tiles[i])||verify.length!==3840)throw Error('Letreiro: falha na conversão');
 out.set(compressed,native.pc);return out;
}
