import {konamiLzDecompress} from './konami-lz.mjs';
import {transformLabelPlanes} from './plus-graphical-labels.mjs';
export const TEAM_PHOTO_WIDTH=96,TEAM_PHOTO_HEIGHT=64,TEAM_PHOTO_SCHEMA='isssd-team-photos-v1';
const word=(a,p)=>a[p]|a[p+1]<<8,pc=a=>((a>>16)&127)*32768+(a&32767);
export function validateTeamPhotos(value){
 if(value==null)return {schema:TEAM_PHOTO_SCHEMA,version:1,teams:{}};
 if(value.schema!==TEAM_PHOTO_SCHEMA||value.version!==1||!value.teams||Array.isArray(value.teams))throw Error('Fotos das equipes: formato inválido.');
 const out={schema:TEAM_PHOTO_SCHEMA,version:1,teams:{}};
 for(const [key,v]of Object.entries(value.teams)){const t=Number(key);if(!Number.isInteger(t)||t<0||t>=60||String(t)!==key)throw Error('Foto: equipe inválida.');if(!Array.isArray(v.pixels)||v.pixels.length!==6144||v.pixels.some(c=>!Number.isInteger(c)||c<0||c>15)||!Array.isArray(v.palette)||v.palette.length!==16||v.palette.some(c=>!Number.isInteger(c)||c<0||c>32767))throw Error('Foto: pixels ou paleta inválidos.');out.teams[key]={pixels:v.pixels.slice(),palette:v.palette.slice()};}
 return out;
}
export function quantizeTeamPhoto(rgba){
 if(rgba.length!==6144*4)throw Error('Foto: ajuste a imagem para 96 × 64 antes de converter.');
 const counts=new Map(),codes=[];for(let i=0;i<6144;i++){const p=i*4;if(rgba[p+3]<128){codes.push(-1);continue;}const c=(rgba[p]>>3)|((rgba[p+1]>>3)<<5)|((rgba[p+2]>>3)<<10);codes.push(c);counts.set(c,(counts.get(c)||0)+1);}
 let boxes=[[...counts].map(([c,n])=>({c,n,v:[c&31,c>>5&31,c>>10&31]}))].filter(b=>b.length);
 while(boxes.length<15){let best=-1,score=-1,axis=0;for(let i=0;i<boxes.length;i++){const b=boxes[i];if(b.length<2)continue;for(let a=0;a<3;a++){const range=Math.max(...b.map(q=>q.v[a]))-Math.min(...b.map(q=>q.v[a])),s=range*b.reduce((n,q)=>n+q.n,0);if(s>score){score=s;best=i;axis=a;}}}if(best<0)break;const b=boxes.splice(best,1)[0].sort((a,b)=>a.v[axis]-b.v[axis]),half=b.reduce((n,q)=>n+q.n,0)/2;let at=1,n=b[0].n;while(at<b.length-1&&n<half)n+=b[at++].n;boxes.push(b.slice(0,at),b.slice(at));}
 const palette=[0,...boxes.map(b=>{const n=b.reduce((n,q)=>n+q.n,0),v=[0,1,2].map(a=>Math.round(b.reduce((n,q)=>n+q.v[a]*q.n,0)/n));return v[0]|v[1]<<5|v[2]<<10;})];while(palette.length<16)palette.push(0);
 const nearest=new Map();for(const c of counts.keys()){let best=1,score=Infinity;for(let i=1;i<=boxes.length;i++){const p=palette[i],d=((c&31)-(p&31))**2+((c>>5&31)-(p>>5&31))**2+((c>>10&31)-(p>>10&31))**2;if(d<score){score=d;best=i;}}nearest.set(c,best);}
 return {pixels:codes.map(c=>c<0?0:nearest.get(c)),palette};
}
export function packTeamPhoto(photo){
 const v=validateTeamPhotos({schema:TEAM_PHOTO_SCHEMA,version:1,teams:{0:photo}}).teams[0],out=new Uint8Array(3104);
 for(let y=0;y<64;y++)for(let x=0;x<96;x++){const tile=(y>>3)*12+(x>>3),c=v.pixels[y*96+x];for(let p=0;p<4;p++)out[tile*32+(p>>1)*16+(y&7)*2+(p&1)]|=(c>>p&1)<<(7-(x&7));}
 v.palette.forEach((c,i)=>{out[3072+i*2]=c&255;out[3073+i*2]=c>>8;});return out;
}
export function teamPhotoRgba(photo){const out=new Uint8ClampedArray(6144*4);photo.pixels.forEach((v,i)=>{if(!v)return;const c=photo.palette[v];out[i*4]=(c&31)*255/31;out[i*4+1]=(c>>5&31)*255/31;out[i*4+2]=(c>>10&31)*255/31;out[i*4+3]=255;});return out;}
function rawAsset(rom,cpu){const at=pc(cpu),a=konamiLzDecompress(rom,at).data;return rom[at+1]&128?transformLabelPlanes(a):a;}
export function nativeTeamPhotoResources(rom){
 const vram=new Uint8Array(65536),source=rawAsset(rom,0xA1904E),oam=new Map();let at=0x10EE2;
 for(let n=0;n<32&&rom[at]!==255;n++,at+=5){const dest=word(rom,at),cpu=rom[at+2]|rom[at+3]<<8|rom[at+4]<<16;vram.set(rawAsset(rom,cpu),dest*2);}
 const raw=konamiLzDecompress(rom,0xC2817).data,count=word(raw,1),h=3+raw[0];let index=0;
 for(let f=0;f<raw[0];f++){const frame=[];const start=index;for(let j=0;j<raw[3+f];j++,index++)frame.push(Array.from({length:4},(_,p)=>raw[h+p*count+index]));oam.set(0x5600+start*2,frame);}
 return {vram,source,oam};
}
export function renderNativeTeamPhoto(rom,team,{resources=nativeTeamPhotoResources(rom),photo=null}={}){
 if(!Number.isInteger(team)||team<0||team>=56&&!photo)throw Error('Foto nativa da equipe indisponível.');
 const meta=photo||{bodyType:rom[0xFD5E+team],faceType:rom[0xFB99+team],overlayType:rom[0xFBD1+team],extraType:rom[0xFC09+team],accessory:word(rom,0x17970+team*2),formationFlags:rom[0xFE78+team]};
 const vram=resources.vram.slice(),cgram=new Uint16Array(256),record=(pointer)=>{const at=0x48000+(pointer&32767),n=(word(rom,at)+1)/2;return Array.from({length:n},(_,i)=>word(rom,at+2+i*2));};
 const palettes=meta.palettes?meta.palettes.map(a=>a?Array.from({length:(a.length-2)/2},(_,i)=>word(a,2+i*2)):[]):[...([0xFA49,0xFAB9,0xFD96].map(at=>record(word(rom,at+team*2)))),...[0,1].map(i=>record(word(rom,0x17945+rom[0xFB29+team*2+i])))];
 [0xE1,0xF1,0xB1,0xA1,0xC1].forEach((dest,i)=>palettes[i].forEach((v,j)=>cgram[dest+j]=v));
 let body=meta.bodyType*4;if(body&512)body+=512;
 for(let i=0;i<10;i+=2){let src=body+(i===4?body:0)+word(rom,0x1781F+i);if(src&512)src+=512;const dest=0x7820+(i<6?i:i+2)*16,size=i===4?128:64;vram.set(resources.source.slice(src-0xA000,src-0xA000+size),dest*2);vram.set(resources.source.slice(src-0xA000+512,src-0xA000+512+size),(dest+256)*2);}
 const face=meta.faceType,parts=[[0x1240,meta.extraType===255?0:word(rom,0x17670+meta.extraType),4],[0x1280,meta.accessory===65535?0:meta.accessory,2],[0x12A0,meta.formationFlags&1?0:word(rom,0x17600+face),3],[0x12C0,word(rom,0x175F8+face),6],[0x12E0,meta.formationFlags&1?0:word(rom,0x17610+face),3],[0x1300,word(rom,0x17608+face),6],[0x1320,word(rom,0x17618+meta.overlayType),7]],out=new Uint8ClampedArray(6144*4),signed=v=>v>=128?v-256:v;
 for(const[,pointer,palette]of parts.reverse()){const objects=resources.oam.get(pointer)||[];for(const o of objects.slice().reverse()){const size=o[3]&16?16:8,x=signed(o[0])-size/2,y=signed(o[1])-size/2;for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++){const dx=x+xx,dy=y+yy;if(dx<0||dy<0||dx>=96||dy>=64)continue;const sx=o[3]&64?size-1-xx:xx,sy=o[3]&128?size-1-yy:yy,tile=o[2]+((o[3]&1)?256:0)+(sy>>3)*16+(sx>>3),at=0xC000+tile*32;let v=0;for(let p=0;p<4;p++)v|=((vram[at+(p>>1)*16+(sy&7)*2+(p&1)]>>(7-(sx&7)))&1)<<p;if(!v)continue;const c=cgram[128+palette*16+v],i=(dy*96+dx)*4;out[i]=(c&31)*255/31;out[i+1]=(c>>5&31)*255/31;out[i+2]=(c>>10&31)*255/31;out[i+3]=255;}}}
 return out;
}
