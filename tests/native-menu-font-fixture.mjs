import {konamiLzCompress} from '../src/core/konami-lz.mjs';
// Procedural glyphs exercise native tile lookups without including ROM art.
export function seedNativeMenuFontFixture(base){
 for(const [pc,size]of [[0xD8337,768],[0xD81FA,496]]){
  const raw=new Uint8Array(size);for(let t=0;t<size/16;t++)for(let y=0;y<8;y++){raw[t*16+y*2]=y===1?0x7C:1<<(t%5+2);raw[t*16+y*2+1]=y===7?0x7C:0;}
  base.set(konamiLzCompress(raw),pc);
 }
 for(let i=0;i<26;i++)base.set([0x90+(i%24)*2,0x91+(i%24)*2],0x3BE6A+(0x68+i)*2);
 return base;
}
