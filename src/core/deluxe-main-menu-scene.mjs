import {deluxeMainMenuPreview} from './deluxe-main-menu.mjs';
import {konamiLzDecompress} from './konami-lz.mjs';
import {decodePlusMainMenuTile} from './plus-main-menu-renderer.mjs';
// Original USA wallpaper and palette. The scroll is a static frame matching the supplied game capture.
export function deluxeMenuWallpaper(base){
 const raw=konamiLzDecompress(base,0xf58ab).data,map=konamiLzDecompress(base,0x1169d0).data;
 if(raw.length!==4032||map.length!==2048)throw Error('Fundo do menu incompatível');
 const tiles=Array.from({length:126},(_,i)=>decodePlusMainMenuTile(raw.slice(i*32,i*32+32)));
 const colors=Array.from({length:16},(_,i)=>{const p=0x4e49e+i*2,w=base[p]|base[p+1]<<8;return [0,5,10].map(s=>(w>>s&31)*8);});
 const rgba=new Uint8ClampedArray(256*224*4);
 for(let y=0;y<224;y++)for(let x=0;x<256;x++){
  const sx=(x+174)&255,sy=(y+3)&255,at=((sy>>3)*32+(sx>>3))*2,w=map[at]|map[at+1]<<8,t=tiles[(w&1023)-384];
  const px=w&0x4000?7-(sx&7):sx&7,py=w&0x8000?7-(sy&7):sy&7,index=t?.[py*8+px]??8;rgba.set([...colors[index],255],(y*256+x)*4);
 }return rgba;
}
export function deluxeMainMenuScene(base,value,selected=0){
 const preview=deluxeMainMenuPreview(base,value,selected),rgba=deluxeMenuWallpaper(base);
 const put=(x,y,c)=>{if(x>=0&&x<256&&y>=0&&y<224)rgba.set([...c,255],(y*256+x)*4);};
 // Pixel panels approximate the native translucent frames and football motif.
 for(let item=0;item<8;item++){
  const left=item%2?136:8,top=32+Math.floor(item/2)*48,w=112,h=34;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if((x<2||x>=w-2)&&(y<2||y>=h-2))continue;
   const border=x===0||x===w-1||y===0||y===h-1,edge=x===1||x===w-2||y===1||y===h-2;
   if(border){put(left+x,top+y,[0,152,248]);continue;}if(edge){put(left+x,top+y,[16,24,72]);continue;}
   let shade=[24,16,72];const bx=((x+1)%22)-11,by=((y+2)%19)-9,dist=bx*bx+by*by;
   if(dist<64){const angle=Math.atan2(by,bx),sector=Math.round((angle+Math.PI/2)/(Math.PI*2/5))*(Math.PI*2/5)-Math.PI/2;const seam=Math.sqrt(dist)>4&&Math.abs(Math.sin(angle-sector)*Math.sqrt(dist))<0.7;const pentagon=by>=-4&&by<=3&&Math.abs(bx)<=(by<0?4+by/2:4-by/3);shade=dist>49||seam||pentagon?[24,16,64]:[72,40,120];}
   const at=((top+y)*256+left+x)*4;put(left+x,top+y,shade.map((v,k)=>Math.floor((v+rgba[at+k])/(2*8))*8));
  }
 }
 const ink=(x,y)=>x>=0&&x<256&&y>=0&&y<224&&preview.pixels[y*256+x]!==0;
 // Shadow/outline first so neighboring glyph pixels never erase one another.
 for(let y=0;y<224;y++)for(let x=0;x<256;x++)if(ink(x,y)){
  const active=preview.pixels[y*256+x]===17;
  put(x+1,y+2,[8,8,40]);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(!ink(x+dx,y+dy))put(x+dx,y+dy,active?[216,24,0]:[24,8,56]);
 }
 for(let y=0;y<224;y++)for(let x=0;x<256;x++)if(ink(x,y)){
  const active=preview.pixels[y*256+x]===17,top=!ink(x,y-1);
  put(x,y,active?(top?[248,248,240]:[248,232,72]):(top?[152,64,176]:[96,32,128]));
 }
 return {...preview,rgba};
}
