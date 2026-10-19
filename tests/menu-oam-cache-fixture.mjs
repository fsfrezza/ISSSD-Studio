import {konamiLzCompress} from '../src/core/konami-lz.mjs';
export function seedMenuOamCacheFixture(base){
 const raw=new Uint8Array(24+798*4);raw.set([21,0x1E,3]);raw.fill(38,3,24);for(let i=24;i<raw.length;i++)raw[i]=i*13&255;
 base.set(konamiLzCompress(raw),0xC30B9);base.set([0xB9,0xB0,0x98,0x76,0x58],0x10E3F);const stadium=new Uint8Array(64+233*4);stadium.set([61,233,0]);stadium.fill(4,3,53);stadium.fill(3,53,64);for(let i=64;i<stadium.length;i++)stadium[i]=i*19&255;base.set(konamiLzCompress(stadium),0xC2817);return base;
}
