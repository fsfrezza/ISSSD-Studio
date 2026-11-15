import {quantizeRgba} from './pixel-editor.mjs';

export const TEAM_PHOTO_WIDTH=96,TEAM_PHOTO_HEIGHT=64;
const channels=c=>[c&31,c>>5&31,c>>10&31];

// Prepare an independent indexed draft; actual formation sprites are not yet
// replaced by these bytes. Index zero is reserved for transparency.
export function encodeTeamPhotoDraft(rgba){
 if(rgba.length!==TEAM_PHOTO_WIDTH*TEAM_PHOTO_HEIGHT*4)throw Error('Dimensões da foto inválidas');
 const hist=new Map();for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]<128)continue;const c=(rgba[i]>>3)|((rgba[i+1]>>3)<<5)|((rgba[i+2]>>3)<<10);hist.set(c,(hist.get(c)??0)+1);}
 let boxes=hist.size?[[...hist.keys()]]:[];
 while(boxes.length<15){let best=-1,axis=0,score=0;for(let j=0;j<boxes.length;j++){const b=boxes[j];if(b.length<2)continue;for(let a=0;a<3;a++){const v=b.map(c=>channels(c)[a]),s=(Math.max(...v)-Math.min(...v))*b.reduce((n,c)=>n+hist.get(c),0);if(s>score){best=j;axis=a;score=s;}}}if(best<0)break;const b=boxes.splice(best,1)[0].sort((c,d)=>channels(c)[axis]-channels(d)[axis]),total=b.reduce((n,c)=>n+hist.get(c),0);let k=1,sum=hist.get(b[0]);while(k<b.length-1&&sum<total/2)sum+=hist.get(b[k++]);boxes.push(b.slice(0,k),b.slice(k));}
 const colors=[0,...boxes.map(b=>[0,1,2].reduce((v,a)=>v|(Math.round(b.reduce((n,c)=>n+channels(c)[a]*hist.get(c),0)/b.reduce((n,c)=>n+hist.get(c),0))<<(a*5)),0))];while(colors.length<16)colors.push(0);
 const pixels=quantizeRgba(rgba,colors.map(c=>channels(c).map(v=>v*255/31)));return{width:TEAM_PHOTO_WIDTH,height:TEAM_PHOTO_HEIGHT,pixels,colors};
}
export function validateTeamPhotoDrafts(value){
 if(value===undefined)return [];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>60)throw Error('Rascunhos de fotos inválidos');
 for(const [id,row] of Object.entries(value)){if(!/^(?:[0-9]|[1-5][0-9])$/.test(id)||!row||row.width!==TEAM_PHOTO_WIDTH||row.height!==TEAM_PHOTO_HEIGHT||!Array.isArray(row.pixels)||row.pixels.length!==TEAM_PHOTO_WIDTH*TEAM_PHOTO_HEIGHT||row.pixels.some(v=>!Number.isInteger(v)||v<0||v>15)||!Array.isArray(row.colors)||row.colors.length!==16||row.colors.some(v=>!Number.isInteger(v)||v<0||v>32767)||row.colors[0]!==0)throw Error('Rascunho de foto inválido: '+id);}
 return Object.keys(value).map(Number);
}
