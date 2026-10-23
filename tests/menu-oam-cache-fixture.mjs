import {konamiLzCompress} from '../src/core/konami-lz.mjs';
export function seedMenuOamCacheFixture(base){
 const raw=new Uint8Array(24+798*4);raw.set([21,0x1E,3]);raw.fill(38,3,24);for(let i=24;i<raw.length;i++)raw[i]=i*13&255;
 base.set(konamiLzCompress(raw),0xC30B9);base.set([0xB9,0xB0,0x98,0x76,0x58],0x10E3F);const stadium=new Uint8Array(64+233*4);stadium.set([61,233,0]);stadium.fill(4,3,53);stadium.fill(3,53,64);for(let i=64;i<stadium.length;i++)stadium[i]=i*19&255;base.set(konamiLzCompress(stadium),0xC2817);
 for(const [pc,frames,count]of [[0xC3332,3,6],[0xC3348,11,52]]){
  const raw=new Uint8Array(3+frames+count*4);raw.set([frames,count,0]);
  for(let f=0,left=count;f<frames;f++){const n=Math.ceil(left/(frames-f));raw[3+f]=n;left-=n;}
  for(let i=3+frames;i<raw.length;i++)raw[i]=i*11&255;base.set(konamiLzCompress(raw),pc);
 }
 base.set([0xD2,0x57],0x111F4);base.set([0xDE,0xD7],0x111F9);
 for(const [i,pc]of [0x175EE,0x175F0,0x175F2,...Array.from({length:11},(_,i)=>0x174F4+i*2)].entries()){const v=i<3?0x57D2+i*4:0x57DE+(i-3)*2;base.set([v&255,v>>8],pc);}
 return base;
}
