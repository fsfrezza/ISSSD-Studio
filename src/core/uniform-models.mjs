// Prototype models for the native eight-tile jersey overlay. These do not
// replace body sprites or number tiles; side/back poses keep their native art.
export const UNIFORM_MODEL_PRESETS=Object.freeze([
 Object.freeze({id:'white-green-sleeves',label:'Corpo branco · mangas verdes (protótipo)'}),
 Object.freeze({id:'navy-red-halves',label:'Metades azul-marinho/vermelha (protótipo)'})
]);
export const UNIFORM_MODEL_FRAME_LABELS=Object.freeze(['Frente','Diagonal de frente','Diagonal inclinada','Frente inclinada','Tronco inclinado','Deitado 1','Deitado 2','Frente em movimento']);
const modelColor=(hex,factor=1)=>[1,3,5].reduce((v,p,i)=>v|Math.max(0,Math.min(31,Math.round(parseInt(hex.slice(p,p+2),16)*factor/255*31)))<<(i*5),0);
// Masks decoded from the canonical Plus full-shirt and sleeve/cuff overlays.
const MODEL_MASKS=[[0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,0,1,0,1,1,0,1,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0]];
const MODEL_SLEEVES=[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
export function uniformModelPixels(id){
 if(!UNIFORM_MODEL_PRESETS.some(p=>p.id===id))throw Error('Modelo de camisa desconhecido.');
 return MODEL_MASKS.flatMap((mask,frame)=>mask.map((v,i)=>{
  const x=i%8,y=i>>3;if(!v&&!MODEL_SLEEVES[frame][i])return 0;
  if(id==='white-green-sleeves')return MODEL_SLEEVES[frame][i]||((x<2||x>5)&&y<4)?12:(x<2?7:x<4?8:9);
  // Front facing the viewer: the wearer's left is the viewer's right.
  const edge=frame===1?3:frame===2?2:4;
  return x<edge?9:8;
 }));
}
export function applyUniformModel(team,id){
 const pixels=uniformModelPixels(id),out=structuredClone(team);out.data.pattern=Array(256).fill(0);
 for(let f=0;f<8;f++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let p=0;p<4;p++)out.data.pattern[f*32+(p>>1)*16+y*2+(p&1)]|=(pixels[f*64+y*8+x]>>p&1)<<(7-x);
 const colors=id==='white-green-sleeves'?[...([.55,.8,1].map(f=>modelColor('#FFFFFF',f))),...([.5,.75,1].map(f=>modelColor('#008040',f))),modelColor('#008040',.65),modelColor('#008040'),0x120]:[modelColor('#001840',.65),modelColor('#001840'),modelColor('#D82020'),...([.5,.75,1].map(f=>modelColor('#FFFFFF',f))),modelColor('#001840',.65),modelColor('#001840'),0x120];
 for(let i=0;i<9;i++){out.data.palettes.home[16+i*2]=colors[i]&255;out.data.palettes.home[17+i*2]=colors[i]>>8;}
 out.uniformModelV1={id,version:1,scope:'native-eight-frame-overlay',kit:0,experimental:true};return out;
}

// Transparent pixels retain the predominant shirt color from the body.
export function stripedUniformPixels(direction='vertical',width=2,index=15){
 if(!['vertical','horizontal'].includes(direction)||!Number.isInteger(width)||width<1||width>4||!Number.isInteger(index)||index<7||index>15)throw Error('Listras inválidas.');
 return MODEL_MASKS.flatMap((mask,f)=>mask.map((v,i)=>(v||MODEL_SLEEVES[f][i])&&Math.floor((direction==='vertical'?i%8:i>>3)/width)%2===0?index:0));
}
