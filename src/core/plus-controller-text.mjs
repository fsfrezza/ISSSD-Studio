import {CONTROLLER_ACTIONS,CONTROLLER_NATIVE_DESCRIPTORS,resolveControllerActions,normalizeControllerText} from './plus-controller-actions.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
const PC=0x108162, ORIGINAL_COMP=390, RAWLEN=496;
const FONT={
 A:['010','101','101','111','101','101','101'],B:['110','101','101','110','101','101','110'],C:['011','100','100','100','100','100','011'],D:['110','101','101','101','101','101','110'],E:['111','100','100','110','100','100','111'],F:['111','100','100','110','100','100','100'],G:['011','100','100','101','101','101','011'],H:['101','101','101','111','101','101','101'],I:['1','1','1','1','1','1','1'],J:['001','001','001','001','101','101','010'],K:['101','101','110','100','110','101','101'],L:['100','100','100','100','100','100','111'],M:['1001','1111','1111','1011','1001','1001','1001'],N:['101','111','111','111','111','101','101'],O:['010','101','101','101','101','101','010'],P:['110','101','101','110','100','100','100'],Q:['010','101','101','101','101','011','001'],R:['110','101','101','110','101','101','101'],S:['011','100','100','010','001','001','110'],T:['111','010','010','010','010','010','010'],U:['101','101','101','101','101','101','111'],V:['101','101','101','101','101','101','010'],W:['1001','1001','1001','1111','1111','1111','1001'],X:['101','101','010','010','010','101','101'],Y:['101','101','101','010','010','010','010'],Z:['111','001','001','010','100','100','111'],
 '0':['010','101','101','101','101','101','010'],'1':['1','1','1','1','1','1','1'],'2':['110','001','001','010','100','100','111'],'3':['110','001','001','010','001','001','110'],'4':['101','101','101','111','001','001','001'],'5':['111','100','100','110','001','001','110'],'6':['011','100','100','110','101','101','010'],'7':['111','001','001','010','010','010','010'],'8':['010','101','101','010','101','101','010'],'9':['010','101','101','011','001','001','110'],'-':['000','000','000','111','000','000','000']};
const norm=normalizeControllerText;
function decode2(raw){const pix=new Uint8Array(248*8);for(let t=0;t<31;t++)for(let y=0;y<8;y++){const a=raw[t*16+y*2],b=raw[t*16+y*2+1];for(let x=0;x<8;x++){const bit=7-x;pix[y*248+t*8+x]=((a>>bit)&1)|(((b>>bit)&1)<<1)}}return pix}
function encode2(pix){const raw=new Uint8Array(RAWLEN);for(let t=0;t<31;t++)for(let y=0;y<8;y++){let a=0,b=0;for(let x=0;x<8;x++){const v=pix[y*248+t*8+x]&3,bit=7-x;a|=(v&1)<<bit;b|=((v>>1)&1)<<bit}raw[t*16+y*2]=a;raw[t*16+y*2+1]=b}return raw}
function controllerGlyphAtlas(pix){
 const atlas={};
 // Native foreground is 1 (white) / 2 (edge shading); 3 is the black outline.
 // Explicit bounds avoid treating outlines and joined antialias pixels as letters.
 const ranges={H:[1,4],I:[5,6],G:[7,10],B:[20,23],A:[24,27],L:[28,31],
  D:[94,98],K:[130,133],E:[134,136],P:[140,143],R:[147,150],M:[220,223],
  N:[228,231],U:[232,235],S:[153,156],T:[200,203],O:[180,183]};
 for(const [c,[a,b]] of Object.entries(ranges)){
  const rows=[],colors=[];
  for(let y=0;y<8;y++){let row='';const line=[];for(let x=a;x<b;x++){
   const v=pix[y*248+x];row+=(v===1||v===2)?'1':'0';line.push(v===1||v===2?v:0)
  }rows.push(row);colors.push(line)}
  if(colors.some(row=>row.some(Boolean)))atlas[c]={rows,colors,w:b-a};
 }
 // C shares the native G's left/top/bottom strokes, without its inner bar.
 const g=atlas.G;if(!g)return atlas;const colors=g.colors.map(row=>row.slice());
 for(let y=2;y<=5;y++)for(let x=1;x<g.w;x++)colors[y][x]=0;
 atlas.C={w:g.w,colors,rows:colors.map(row=>row.map(v=>v?'1':'0').join(''))};
 return atlas
}
function glyphFor(c,atlas){if(atlas?.[c])return atlas[c];const g=FONT[c];return g?{rows:g,w:g[0].length}:null}
function width(text,atlas){const q=norm(text);if(!q)return 0;let n=0;for(const c of q){if(c===' '){n+=2;continue}const g=glyphFor(c,atlas);n+=(g?g.w:3)+1}return Math.max(0,n-1)}
function drawText(pix,text,x0,x1,atlas,offset=null){
 const ink=1; // native white foreground; index 3 is outline, never ink
 for(let y=0;y<8;y++)for(let x=x0;x<x1;x++)pix[y*248+x]=0;
 const q=norm(text),w=Math.max(0,width(q,atlas));if(w>x1-x0)throw Error('“'+q+'” precisa de '+w+' px; este campo possui '+(x1-x0)+' px.');
 let x=x0+(offset??Math.min(1,x1-x0-w));
 const strokes=[];
 for(const c of q){if(c===' '){x+=2;continue}const g=glyphFor(c,atlas);if(!g)continue;
  for(let yy=0;yy<Math.min(8,g.rows.length);yy++)for(let xx=0;xx<g.w;xx++)
   if(g.rows[yy][xx]==='1')strokes.push([x+xx,yy,g.colors?.[yy]?.[xx]||ink]);
  x+=g.w+1
 }
 // Draw outline first so neighboring letters cannot erase the white strokes.
 for(const [xx,yy] of strokes)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const nx=xx+dx,ny=yy+dy;if(nx>=x0&&nx<x1&&ny>=0&&ny<8)pix[ny*248+nx]=3
 }
 for(const [xx,yy,v] of strokes)pix[yy*248+xx]=v;

}

export function plusControllerTextWriter(rom,state={},base=rom){
 const values=resolveControllerActions(state);
 if(CONTROLLER_ACTIONS.every(a=>values[a.id]===a.original))return rom;
 for(const [pc,bytes] of CONTROLLER_NATIVE_DESCRIPTORS)
  if(bytes.some((v,i)=>base[pc+i]!==v))throw new Error('Controller native action descriptor mismatch at '+pc.toString(16));
 const raw=konamiLzDecompress(base,PC).data;if(raw.length!==RAWLEN)throw new Error('Controller native block must decode to 496 bytes');
 const atlas=controllerGlyphAtlas(decode2(raw)),pix=new Uint8Array(248*8),layout=[];
 let tile=0;
 for(const action of CONTROLLER_ACTIONS){
  const text=values[action.id],w=width(text,atlas),tiles=text?Math.ceil((w+2)/8):0;
  if(tiles>action.cells)throw new Error(action.id+': “'+text+'” precisa de '+(w+2)+' px; este campo possui '+(action.cells*8)+' px.');
  if(tile+tiles>31)throw new Error('Os textos dos controles excedem os 31 tiles disponíveis. Reduza uma das inscrições.');
  layout.push({...action,text,x0:tile*8,x1:(tile+tiles)*8,tile,tiles});
  if(tiles)drawText(pix,text,tile*8,(tile+tiles)*8,atlas);
  tile+=tiles;
 }
 let result=encode2(pix),comp=konamiLzCompress(result);
 if(comp.length>ORIGINAL_COMP)for(let pass=0;pass<2;pass++)for(const a of layout){
  if(!a.tiles)continue;
  const slack=a.x1-a.x0-width(a.text,atlas);
  for(let offset=1;offset<slack;offset++){
   const candidate=pix.slice();drawText(candidate,a.text,a.x0,a.x1,atlas,offset);
   const bytes=encode2(candidate),packed=konamiLzCompress(bytes);
   if(packed.length<comp.length){pix.set(candidate);result=bytes;comp=packed}
  }
 }
 if(comp.length>ORIGINAL_COMP)throw new Error('Controller compressed block exceeds native capacity: '+comp.length);
 const round=konamiLzDecompress(comp).data;if(round.length!==result.length||round.some((v,i)=>v!==result[i]))throw new Error('Controller round-trip failed');
 rom.set(comp,PC);
 for(const a of layout)for(let i=0;i<a.cells;i++)rom[a.pc+i]=i<a.tiles?0x72+a.tile+i:0;
 return rom;
}
