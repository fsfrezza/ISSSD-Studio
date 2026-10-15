import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
const PC=0x108162, ORIGINAL_COMP=390, RAWLEN=496, KEY='controller.', LEGACY_KEY='controller.v621.';
export const CONTROLLER_SLOTS=[
 ['high','HIGH',0,19],['ball','BALL',19,40],['pass','PASS',40,61],['shoot','SHOOT',61,93],['dash','DASH',93,129],
 ['keeper','KEEPER',129,152],['semiauto','SEMI AUTO',152,189],['auto','AUTO',189,219],['manual','MANUAL',219,248]
];
const FONT={
 A:['010','101','101','111','101','101','101'],B:['110','101','101','110','101','101','110'],C:['011','100','100','100','100','100','011'],D:['110','101','101','101','101','101','110'],E:['111','100','100','110','100','100','111'],F:['111','100','100','110','100','100','100'],G:['011','100','100','101','101','101','011'],H:['101','101','101','111','101','101','101'],I:['1','1','1','1','1','1','1'],J:['001','001','001','001','101','101','010'],K:['101','101','110','100','110','101','101'],L:['100','100','100','100','100','100','111'],M:['1001','1111','1111','1011','1001','1001','1001'],N:['101','111','111','111','111','101','101'],O:['010','101','101','101','101','101','010'],P:['110','101','101','110','100','100','100'],Q:['010','101','101','101','101','011','001'],R:['110','101','101','110','101','101','101'],S:['011','100','100','010','001','001','110'],T:['111','010','010','010','010','010','010'],U:['101','101','101','101','101','101','111'],V:['101','101','101','101','101','101','010'],W:['1001','1001','1001','1111','1111','1111','1001'],X:['101','101','010','010','010','101','101'],Y:['101','101','101','010','010','010','010'],Z:['111','001','001','010','100','100','111'],
 '0':['010','101','101','101','101','101','010'],'1':['1','1','1','1','1','1','1'],'2':['110','001','001','010','100','100','111'],'3':['110','001','001','010','001','001','110'],'4':['101','101','101','111','001','001','001'],'5':['111','100','100','110','001','001','110'],'6':['011','100','100','110','101','101','010'],'7':['111','001','001','010','010','010','010'],'8':['010','101','101','010','101','101','010'],'9':['010','101','101','011','001','001','110'],'-':['000','000','000','111','000','000','000']};
const norm=s=>String(s??'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 -]/g,'').replace(/\s+/g,' ').trim();
function decode2(raw){const pix=new Uint8Array(248*8);for(let t=0;t<31;t++)for(let y=0;y<8;y++){const a=raw[t*16+y*2],b=raw[t*16+y*2+1];for(let x=0;x<8;x++){const bit=7-x;pix[y*248+t*8+x]=((a>>bit)&1)|(((b>>bit)&1)<<1)}}return pix}
function encode2(pix){const raw=new Uint8Array(RAWLEN);for(let t=0;t<31;t++)for(let y=0;y<8;y++){let a=0,b=0;for(let x=0;x<8;x++){const v=pix[y*248+t*8+x]&3,bit=7-x;a|=(v&1)<<bit;b|=((v>>1)&1)<<bit}raw[t*16+y*2]=a;raw[t*16+y*2+1]=b}return raw}
function controllerGlyphAtlas(pix){
 const atlas={};
 // Aprende os glifos diretamente do gráfico ORIGINAL da própria ROM.
 // Assim altura, largura e desenho vêm do ISS Deluxe, não de uma fonte inventada pelo Studio.
 for(const [id,orig,x0,x1] of CONTROLLER_SLOTS){
  const chars=orig.replace(/ /g,'').split('');
  const cols=[]; let on=false,a=0;
  for(let x=x0;x<=x1;x++){
   let ink=false;if(x<x1)for(let y=0;y<8;y++)if(pix[y*248+x]){ink=true;break}
   if(ink&&!on){a=x;on=true}
   if(!ink&&on){cols.push([a,x]);on=false}
  }
  if(cols.length!==chars.length)continue;
  cols.forEach(([a,b],i)=>{const w=b-a,rows=[];for(let y=0;y<8;y++){let row='';for(let x=a;x<b;x++)row+=pix[y*248+x]?'1':'0';rows.push(row)};atlas[chars[i]]={rows,w}})
 }
 return atlas
}
function controllerInk(pix,x0,x1){
 const count=[0,0,0,0];for(let y=0;y<8;y++)for(let x=x0;x<x1;x++){const v=pix[y*248+x]&3;if(v)count[v]++}
 let best=1;for(let v=2;v<=3;v++)if(count[v]>count[best])best=v;return count[best]?best:1
}
function glyphFor(c,atlas){if(atlas?.[c])return atlas[c];const g=FONT[c];return g?{rows:g,w:g[0].length}:null}
function width(text,atlas){const q=norm(text);if(!q)return 0;let n=0;for(const c of q){if(c===' '){n+=2;continue}const g=glyphFor(c,atlas);n+=(g?g.w:3)+1}return Math.max(0,n-1)}
function drawText(pix,text,x0,x1,atlas){
 const ink=controllerInk(pix,x0,x1); // preserva o índice de cor usado pelo texto original desta faixa
 for(let y=0;y<8;y++)for(let x=x0;x<x1;x++)pix[y*248+x]=0;
 const q=norm(text),w=Math.max(0,width(q,atlas));if(w>x1-x0)throw Error('“'+q+'” precisa de '+w+' px; este campo possui '+(x1-x0)+' px.');
 let x=x0+Math.floor((x1-x0-w)/2);
 for(const c of q){if(c===' '){x+=2;continue}const g=glyphFor(c,atlas);if(!g)continue;for(let yy=0;yy<Math.min(8,g.rows.length);yy++)for(let xx=0;xx<g.w;xx++)if(g.rows[yy][xx]==='1')pix[yy*248+x+xx]=ink;x+=g.w+1}
}

export function plusControllerTextWriter(rom,state={},base=rom){
 const values=state?.textWorkspaceV2?.sections?.graphicIntents?.values||{};
 const changed=CONTROLLER_SLOTS.filter(([id,original])=>Object.hasOwn(values,KEY+id)&&norm(values[KEY+id])!==original);
 if(!changed.length)return rom;
 const raw=konamiLzDecompress(base,PC).data;if(raw.length!==RAWLEN)throw new Error('Controller native block must decode to 496 bytes');
 const pix=decode2(raw),atlas=controllerGlyphAtlas(pix);
 for(const [id,,x0,x1] of changed)drawText(pix,values[KEY+id],x0,x1,atlas);
 const result=encode2(pix),comp=konamiLzCompress(result);
 if(comp.length>ORIGINAL_COMP)throw new Error('Controller compressed block exceeds native capacity');
 const round=konamiLzDecompress(comp).data;if(round.length!==result.length||round.some((v,i)=>v!==result[i]))throw new Error('Controller round-trip failed');
 rom.set(comp,PC);return rom;
}
