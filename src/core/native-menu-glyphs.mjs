import {konamiLzDecompress} from './konami-lz.mjs';
import {NATIVE_MENU_FONTS} from './native-menu-text-fields.mjs';
// The same shaded native alphabet is loaded at different VRAM addresses by
// training and match-statistics menus. Read its artwork, never infer tile IDs.
export function nativeMenuGlyphReader(base){
 const tall=konamiLzDecompress(base,0xD8337).data,small=konamiLzDecompress(base,0xD81FA).data;
 return (c,short=false)=>{
  const height=short?8:16,out=new Uint8Array(8*height);if(c===' ')return out;
  if(!/^[A-Z]$/.test(c))return null;
  const code=NATIVE_MENU_FONTS.TallMenuText[c];
  for(let y=0;y<height;y++){
   const tile=short?c.charCodeAt(0)-65:base[0x3BE6A+code*2+(y>>3)]-0x90,font=short?small:tall;
   if(tile<0||tile*16+15>=font.length)throw Error('Fonte nativa: caractere fora do atlas '+c);
   for(let x=0;x<8;x++){const at=tile*16+(y%8)*2,bit=7-x;out[y*8+x]=(font[at]>>bit&1)|(font[at+1]>>bit&1)<<1;}
  }return out;
 };
}
