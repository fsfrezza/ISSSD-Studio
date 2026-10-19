import {konamiLzCompress} from '../src/core/konami-lz.mjs';
export function seedMenuOamCacheFixture(base){
 const raw=new Uint8Array(24+798*4);raw.set([21,0x1E,3]);raw.fill(38,3,24);for(let i=24;i<raw.length;i++)raw[i]=i*13&255;
 base.set(konamiLzCompress(raw),0xC30B9);base.set([0xB9,0xB0,0x98,0x76,0x58],0x10E3F);return base;
}
