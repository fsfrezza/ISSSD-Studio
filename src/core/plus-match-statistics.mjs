import {nativeMenuGlyphReader} from './native-menu-glyphs.mjs';
import {MATCH_STATISTICS_FIELDS} from './match-statistics-fields.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
export const MATCH_STATISTICS_SLOT=0x184800;
export const MATCH_STATISTICS_CORNER_SLOT=0x187400;
export const MATCH_STATISTICS_CORNER_HOOK=0x187440;
export const MATCH_STATISTICS_REGIONS=[[MATCH_STATISTICS_CORNER_SLOT,MATCH_STATISTICS_CORNER_SLOT+0x80],[0x5A3C6,0x5A3CA],[MATCH_STATISTICS_SLOT,MATCH_STATISTICS_SLOT+2048],[0x17B60,0x17B77],[0x5A35C,0x5A35E],[0xF1EB,0xF285],[0xE865,0xE86B],[0xE86D,0xE873],[0x4E8B,0x4EE7]];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const word=n=>[n&255,n>>8&255],long=n=>[n&255,n>>8&255,n>>16&255];
function labelPixels(text,width=56,height=16,readGlyph=null){
 const pixels=new Uint8Array(width*height),words=text.split(' ');let lines=[text];
 if(text.length*5-1>width&&words.length>1){let best=1;for(let i=1;i<words.length;i++)if(Math.max(words.slice(0,i).join(' ').length,words.slice(i).join(' ').length)<Math.max(words.slice(0,best).join(' ').length,words.slice(best).join(' ').length))best=i;lines=[words.slice(0,best).join(' '),words.slice(best).join(' ')];}
 if(lines.length===1&&text.length*5-1>width&&words.length===1&&height===16){const mid=Math.ceil(text.length/2);lines=[text.slice(0,mid),text.slice(mid)];}
 if(readGlyph&&/^[A-Z ]+$/.test(text)){
  for(let line=0;line<lines.length;line++){
   const str=lines[line],short=height===8||lines.length===2,h=short?8:16,step=Math.min(8,Math.floor(width/str.length));
   if(step<4)throw Error('Estatísticas: texto longo demais; abrevie o campo.');
   const left=Math.floor((width-str.length*step)/2);
   for(let i=0;i<str.length;i++){const glyph=readGlyph(str[i],short);for(let y=0;y<h;y++)for(let x=0;x<step;x++)pixels[(line*8+y)*width+left+i*step+x]=glyph[y*8+Math.floor(x*8/step)];}
  }return pixels;
 }
 const sy=height===8||lines.length===2?1:2;
 for(let line=0;line<lines.length;line++){
  const s=lines[line],gw=s.length*6-1<=width?5:4,advance=gw+1,total=s.length*advance-1;
  if(total>width)throw Error('Estatísticas: “'+text+'” excede '+width+' px; abrevie o campo.');
  const left=Math.floor((width-total)/2),top=height===8?0:lines.length===2?line*8:1;
  for(let i=0;i<s.length;i++){if(s[i]===' ')continue;const rows=s[i]==='.'?[0,0,0,0,0,0,16]:s[i]==='-'?[0,0,0,124,0,0,0]:PLUS_MAIN_MENU_GLYPHS[s[i]];if(!rows)throw Error('Estatísticas: caractere indisponível '+s[i]);for(let y=0;y<7*sy;y++)for(let x=0;x<gw;x++)if(rows[Math.floor(y/sy)]&(1<<(6-Math.floor(x*5/gw))))pixels[(top+y)*width+left+i*advance+x]=1;}
 }
 // Preserve the native two-color white/purple appearance.
 const ink=pixels.slice();for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(ink[y*width+x])for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height&&!ink[yy*width+xx])pixels[yy*width+xx]=2;}
 return pixels;
}
export function renderMatchStatistics(values={},base=null){
 const readGlyph=base?nativeMenuGlyphReader(base):null;
 const highFont=new Uint8Array((0x1FA-0x190)*16),lowFont=new Uint8Array(45*16),tiles=new Map(),labels={};let highCount=0,lowCount=0;
 function cells(text,width,height,high,own=false){let pixels=labelPixels(text,width,height,readGlyph);if(own){const split=text.indexOf(' ');if(split<0)throw Error('Histórico: informe duas partes para o gol contra.');pixels=new Uint8Array(64*16);for(const [s,x,w]of [[text.slice(0,split),0,24],[text.slice(split+1),32,32]]){const part=labelPixels(s,w,16,readGlyph);for(let y=0;y<16;y++)pixels.set(part.slice(y*w,(y+1)*w),y*64+x);}}const out=[];
  for(let ty=0;ty<height/8;ty++)for(let tx=0;tx<width/8;tx++){const bytes=new Uint8Array(16);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=pixels[(ty*8+y)*width+tx*8+x];bytes[y*2]|=(v&1)<<(7-x);bytes[y*2+1]|=(v>>1)<<(7-x);}const key=high+':'+bytes.join(',');if(!tiles.has(key)){if((high?highCount:lowCount)>=(high?83:45))throw Error('Estatísticas: os textos excedem os tiles livres.');const highIndex=highCount<16?0x190+highCount:highCount<71?0x1B3+highCount-16:0x1EE+highCount-71;const tile=high?(highCount++,highIndex):0xD0+lowCount++;(high?highFont:lowFont).set(bytes,(tile-(high?0x190:0xD0))*16);tiles.set(key,tile);}out.push(tiles.get(key));}
  return out;
 }
 for(const [id,en]of MATCH_STATISTICS_FIELDS){const text=norm(values[id]??en);if(!text||/[^A-Z0-9 .-]/.test(text))throw Error('Estatísticas: texto inválido em '+id);labels[id]=cells(text,id.endsWith('Half')?24:id==='ownGoal'?64:id==='cornerKicks'?88:56,id.endsWith('Half')?8:16,!['offsides','ownGoal','firstHalf','secondHalf'].includes(id),id==='ownGoal');}
 return {highFont,lowFont,labels,tileCount:tiles.size,highCount,lowCount};
}
export function plusMatchStatisticsWriter(rom,state,base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('partida'))return rom;
 const values=state?.additionalScreenTextsV1?.values?.['match-statistics'];if(!values||!MATCH_STATISTICS_FIELDS.some(([id,en])=>Object.hasOwn(values,id)&&norm(values[id])!==en))return rom;
 if(base[0x10B53]!==0xD9||base[0x10B54]!==0x80||base[0x10B55]!==0x9B)throw Error('Estatísticas: carregador da fonte divergente.');
 const numbers=konamiLzDecompress(base,0xD80D9);if(numbers.data.length!==304)throw Error('Estatísticas: fonte numérica divergente.');
 const rendered=renderMatchStatistics(values,base);
 // Keep the native digits between 1A0..1B2 and stop before the team names
 // at 1EA..1ED and 1FA..1FD. These are live, shared BG3 character tiles.
 rendered.highFont.set(numbers.data,(0x1A0-0x190)*16);
 const low=konamiLzCompress(rendered.lowFont),high=konamiLzCompress(rendered.highFont.slice(0,(0x1EA-0x190)*16)),tail=konamiLzCompress(rendered.highFont.slice((0x1EE-0x190)*16)),writes=[];
 if(low.length>512||high.length+tail.length>1536||rom.length<MATCH_STATISTICS_SLOT+2048||base.slice(MATCH_STATISTICS_SLOT,MATCH_STATISTICS_SLOT+2048).some(v=>v!==255)||rom.slice(MATCH_STATISTICS_SLOT,MATCH_STATISTICS_SLOT+2048).some(v=>v!==255))throw Error('Estatísticas: reserva da fonte indisponível.');
 for(const [index,[id,,,pc]]of MATCH_STATISTICS_FIELDS.slice(0,7).entries()){
  const at=pc;if((base[0xF1DB+index*2]|base[0xF1DC+index*2]<<8)!==pc||base[at+21]!==255)throw Error('Estatísticas: descritor divergente em '+id);
  const columns=id==='cornerKicks'?11:7,dest=0x58AC+index*0x40-(columns-7)/2,tiles=rendered.labels[id];
  writes.push([id==='cornerKicks'?MATCH_STATISTICS_CORNER_SLOT:at,Uint8Array.from([...word(dest),253,id==='offsides'?32:33,...tiles.slice(0,columns).map(v=>v&255),254,...word(dest+0x20),...tiles.slice(columns).map(v=>v&255),255])]);
 }
 // Keep the wider row in bank B0, which still mirrors low WRAM. Other
 // descriptors continue through the original decoder and native addresses.
 if([0x22,0x22,0xA0,0x80].some((v,i)=>base[0x5A3C6+i]!==v)||base.slice(MATCH_STATISTICS_CORNER_SLOT,MATCH_STATISTICS_CORNER_SLOT+0x80).some(v=>v!==255)||rom.slice(MATCH_STATISTICS_CORNER_SLOT,MATCH_STATISTICS_CORNER_SLOT+0x80).some(v=>v!==255))throw Error('Estatísticas: reserva do rótulo largo indisponível.');
 const hook=Uint8Array.from([0xE0,0x17,0xF2,0xD0,0x11,0x8B,0x48,0xF4,0,0xB0,0xAB,0xAB,0xA2,0,0xF4,0x68,0x22,0x22,0xA0,0x80,0xAB,0x6B,0x5C,0x22,0xA0,0x80]);
 writes.push([MATCH_STATISTICS_CORNER_HOOK,hook],[0x5A3C6,Uint8Array.from([0x22,0x40,0xF4,0xB0])]);
 const own=rendered.labels.ownGoal,operands=new Map();let immediate=null;
 for(let at=0x4E8A;at<0x4EE7;){if(base[at]===0xA9){immediate=at+1;at+=3;}else if(base[at]===0x99){const off=base[at+1]|base[at+2]<<8,index=(off>=16?8:0)+(off%16)/2,value=0x2000|own[index];if(operands.has(immediate)&&operands.get(immediate)!==value)throw Error('Histórico: coluna compartilhada incompatível.');operands.set(immediate,value);at+=3;}else throw Error('Histórico: rotina de gol contra divergente.');}
 for(const [pc,value]of operands)writes.push([pc,Uint8Array.from(word(value))]);
 for(const [id,pc]of [['firstHalf',0xE865],['secondHalf',0xE86D]]){if(base[pc+6]!==255||base[pc+7]!==255)throw Error('Histórico: descritor de período divergente.');writes.push([pc,Uint8Array.from(rendered.labels[id].flatMap(t=>word(0x2000|t)))]);}
 if(base[0x5A35B]!==0xA2||base[0x5A35C]!==0x4F||base[0x5A35D]!==0x8B||base.slice(0x17B60,0x17B77).some(v=>v!==255)||rom.slice(0x17B60,0x17B77).some(v=>v!==255))throw Error('Estatísticas: tabela de carregamento indisponível.');
 const slot=new Uint8Array(2048).fill(255);slot.set(low);slot.set(high,512);slot.set(tail,512+high.length);
 const table=Uint8Array.from([0,0,...word(0x5D00),...long(0x9B80D9),...word(0x5680),...long(0xB0C800),...word(0x5C80),...long(0xB0CA00),...word(0x5F70),...long(0xB0CA00+high.length),255]);
 writes.push([MATCH_STATISTICS_SLOT,slot],[0x17B60,table],[0x5A35C,Uint8Array.from(word(0xFB60))]);
 for(const [pc,data]of writes)rom.set(data,pc);return rom;
}
