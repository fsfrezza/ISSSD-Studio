import {captureSelectionFlags,nativeFieldFlagPointer} from './independent-teams.mjs';
import {konamiLzDecompress} from './konami-lz.mjs';
import {independentFlagPixels,editIndependentFlag} from './independent-team-fields.mjs';
export const TEAM_FLAGS_SCHEMA='isssd-team-flags-v1';
export function validateTeamFlags(value){
 if(value==null)return{schema:TEAM_FLAGS_SCHEMA,teams:{}};
 if(value.schema!==TEAM_FLAGS_SCHEMA||!value.teams||Array.isArray(value.teams))throw Error('Bandeiras: projeto inválido.');
 const out={schema:TEAM_FLAGS_SCHEMA,teams:{}};
 for(const[id,flag]of Object.entries(value.teams)){
  if(!/^(0|[1-9]\d*)$/.test(id)||Number(id)>=54||!flag)throw Error('Bandeiras: equipe inválida.');
  if(!Array.isArray(flag.colors)||flag.colors.length!==4||flag.colors.some(v=>!Number.isInteger(v)||v<0||v>32767))throw Error('Bandeiras: quatro cores BGR555 necessárias.');
  const row={colors:flag.colors.slice()};for(const key of ['selectionPixels','fieldPixels']){const p=flag[key];if(!Array.isArray(p)||p.length!==384||p.some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Bandeiras: quadro de 24 × 16 inválido.');row[key]=p.slice();}out.teams[id]=row;
 }return out;
}
export function flagPixelsToStreams(pixels){return editIndependentFlag({data:{}},pixels,'fieldFlags').data.fieldFlags;}
export function captureTeamFlag(rom,id){
 if(!Number.isInteger(id)||id<0||id>=54||!(rom instanceof Uint8Array))throw Error('Bandeira nativa inválida.');
 const w=at=>rom[at]|rom[at+1]<<8,p=w(0xFE06+id*2),at=0x48000+(p&32767);
 if(p<0x8000||w(at)!==7)throw Error('Paleta nativa da bandeira divergente.');
 const fieldFlags=[0,1].map(h=>{const ptr=nativeFieldFlagPointer(rom,id*4+h*2),start=0xD0000+(ptr&32767);return{bytes:Array.from(konamiLzDecompress(rom,start).data),planar:!!(rom[start+1]&128)};});
 return{colors:Array.from({length:4},(_,i)=>w(at+2+i*2)),selectionPixels:independentFlagPixels({data:{selectionFlags:captureSelectionFlags(rom,id)}},'selectionFlags'),fieldPixels:independentFlagPixels({data:{fieldFlags}},'fieldFlags')};
}

// Images arrive resized by the UI to 24x16 RGBA. Index 0 is transparent;
// the four opaque flag colors occupy indices 12..15 in the native 4bpp data.
export function rgbaToTeamFlag(rgba,{preserveTransparency=true,background=32767}={}){
 if(!rgba||rgba.length!==1536||Array.from(rgba).some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Bandeira: imagem RGBA de 24 × 16 necessária.');
 if(!Number.isInteger(background)||background<0||background>32767)throw Error('Bandeira: fundo inválido.');
 const rgb=v=>[0,5,10].map(s=>(v>>s&31)*255/31),bg=rgb(background),hist=new Map(),samples=[];
 for(let i=0;i<384;i++){
  const a=rgba[i*4+3];if(preserveTransparency&&a<128){samples.push(null);continue;}
  const channels=[0,1,2].map(c=>Math.round((preserveTransparency?rgba[i*4+c]:rgba[i*4+c]*a/255+bg[c]*(1-a/255))*31/255));
  const value=channels[0]|channels[1]<<5|channels[2]<<10;samples.push(value);hist.set(value,(hist.get(value)||0)+1);
 }
 const channels=v=>[v&31,v>>5&31,v>>10&31];
 const boxes=hist.size?[[...hist].map(([value,count])=>({value,count,c:channels(value)}))]:[];
 const spread=box=>[0,1,2].map(c=>Math.max(...box.map(v=>v.c[c]))-Math.min(...box.map(v=>v.c[c])));
 while(boxes.length<4){
  let best=-1,score=-1,axis=0;
  boxes.forEach((box,i)=>{if(box.length<2)return;const ranges=spread(box),range=Math.max(...ranges),weight=box.reduce((n,v)=>n+v.count,0);if(range*weight>score){best=i;score=range*weight;axis=ranges.indexOf(range);}});
  if(best<0)break;
  const box=boxes[best].slice().sort((a,b)=>a.c[axis]-b.c[axis]||a.value-b.value),total=box.reduce((n,v)=>n+v.count,0);let count=0,split=1;
  for(let i=0;i<box.length-1;i++){count+=box[i].count;split=i+1;if(count>=total/2)break;}
  boxes.splice(best,1,box.slice(0,split),box.slice(split));
 }
 const colors=boxes.map(box=>{const count=box.reduce((n,v)=>n+v.count,0);return[0,1,2].reduce((v,c)=>v|(Math.round(box.reduce((n,p)=>n+p.c[c]*p.count,0)/count)<<(c*5)),0);});
 while(colors.length<4)colors.push(colors[0]??background);
 const distance=(a,b)=>channels(a).reduce((n,v,c)=>n+(v-channels(b)[c])**2,0);
 return{colors,pixels:samples.map(v=>v===null?0:12+colors.reduce((best,color,i)=>distance(v,color)<distance(v,colors[best])?i:best,0))};
}
