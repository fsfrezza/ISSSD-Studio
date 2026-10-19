import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {transformLabelPlanes} from './plus-graphical-labels.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {NATIVE_MENU_FONTS} from './native-menu-text-fields.mjs';
export const EXTRA_MENU_GRAPHIC_REGIONS=[[0x525D8,0x525DC],[0x3EE01,0x3EE0B],[0x176500,0x177900],[0x1193D,0x11940],[0x3DF44,0x3DF52],[0x3DF7A,0x3DF88],[0x3DF93,0x3DF9F],[0x3DFA7,0x3DFB3],[0x157469,0x157647],[0x185000,0x187000],...[0x10510,0x10535,0x1055F,0x10567].map(p=>[p,p+3])];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ª/g,'A').toUpperCase().trim();
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),long=n=>Uint8Array.of(n&255,n>>8&255,n>>16&255);
const word=(b,p)=>b[p]|b[p+1]<<8,set=(b,p,v)=>{b[p]=v&255;b[p+1]=v>>8;};
function verifyPointer(base,pc,target){if(long(cpu(target)).some((v,i)=>base[pc+i]!==v))throw Error('Texto gráfico: carregador divergente em '+pc.toString(16));}
function reserve(rom,base,pc,capacity,data,writes){if(data.length>capacity||pc+capacity>rom.length)throw Error('Texto gráfico: capacidade excedida em '+pc.toString(16));if(base.slice(pc,pc+capacity).some(v=>v!==255)||rom.slice(pc,pc+capacity).some(v=>v!==255))throw Error('Texto gráfico: reserva ocupada em '+pc.toString(16));const padded=new Uint8Array(capacity).fill(255);padded.set(data);writes.push([pc,padded]);}
function tall(base,text,columns){
 // Match the native DRIBBLE/PASS/SHOOT alphabet, including its shaded edge.
 const font=konamiLzDecompress(base,0xD8337).data,s=norm(text),w=columns*8;
 const advance=s.length*8<=w?8:6;if(s.length*advance>w)throw Error('Texto gráfico: “'+s+'” excede '+w+' pixels.');
 const out=new Uint8Array(columns*32);let left=Math.floor((w-s.length*advance)/2);
 for(const c of s){
  if(c!==' '){const code=NATIVE_MENU_FONTS.TallMenuText[c];if(code===undefined)throw Error('Desafio: caractere não suportado '+c);
   for(let y=0;y<16;y++){const tile=base[0x3BE6A+code*2+(y>>3)]-0x90;if(tile<0||tile*16+15>=font.length)throw Error('Desafio: letra fora da fonte nativa '+c);
    for(let x=0;x<advance;x++){const at=tile*16+(y%8)*2;let v=0;
     // Cover every source column: nearest-neighbour shrink drops the N diagonal.
     for(let source=Math.floor(x*8/advance);source<Math.ceil((x+1)*8/advance);source++){const bit=7-source;const sample=(font[at]>>bit&1)|(font[at+1]>>bit&1)<<1;if(sample)v=v?Math.min(v,sample):sample;}
     const dest=((y>>3)*columns+((left+x)>>3))*16+(y%8)*2,shift=7-(left+x)%8;out[dest]|=(v&1)<<shift;out[dest+1]|=(v>>1)<<shift;
    }
   }
  }left+=advance;
 }return out;
}
function password(base,values,writes){
 const value=values?.enterPassword;if(value===undefined||norm(value)==='ENTER PASSWORD!')return;
 const d=konamiLzDecompress(base,0x157469);if(d.data.length!==2048||d.compressedSize!==478)throw Error('Senha: mapa original divergente.');
 const map=d.data.slice(),letters=new Map();for(const [i,c]of [...'ENTER PASSWORD!'].entries())if(c!==' ')letters.set(c,[word(map,(2*32+9+i)*2),word(map,(3*32+9+i)*2)]);
 for(const [c,a,b]of [['G',0x9B,0x9C],['H',0x9D,0x9E],['I',0x9F,0xA0]])letters.set(c,[0x2800|a,0x2800|b]);letters.set(' ',[0,0]);
 const text=norm(value);if(!text||text.length>24)throw Error('Senha: máximo de 24 células no cabeçalho.');
 for(let y=2;y<4;y++)for(let x=4;x<28;x++)set(map,(y*32+x)*2,0);
 const left=Math.floor((32-text.length)/2);for(const [i,c]of [...text].entries()){const pair=letters.get(c);if(!pair)throw Error('Senha: letra não mapeada no cabeçalho: '+c);for(let row=0;row<2;row++)set(map,((2+row)*32+left+i)*2,pair[row]);}
 const packed=konamiLzCompress(map);if(packed.length>478)throw Error('Senha: mapa traduzido excede o bloco nativo.');const out=new Uint8Array(478).fill(255);out.set(packed);writes.push([0x157469,out]);
}
function challenge(rom,base,values,writes){
 const requests=[['cornerKick','CORNER KICK',7],['freeKick','FREE KICK',6],['bestTime','BEST TIME',6],['bestScore','BEST SCORE',6]],changed=requests.some(([id,en])=>values?.[id]!==undefined&&norm(values[id])!==en);if(!changed)return;
 verifyPointer(base,0x1193D,0x173CA4);const d=konamiLzDecompress(base,0x173CA4);if(d.data.length!==608||d.compressedSize!==459)throw Error('Desafio: fonte original divergente.');
 const raw=new Uint8Array(1408);raw.set(d.data);let tile=38;
 for(const [id,en,columns]of requests){
  const text=values?.[id];if(text===undefined||norm(text)===en)continue;
  const bytes=tall(base,text,columns),code=0x72+tile;raw.set(bytes,tile*16);tile+=columns*2;
  const descriptor=id!=='freeKick'?Uint8Array.from(Array.from({length:columns*2},(_,i)=>code+i)):Uint8Array.from([...Array.from({length:columns},(_,i)=>code+i),0,...Array.from({length:columns},(_,i)=>code+columns+i),0]);
  const originals={cornerKick:[0x3DF7A,[0x72,0x74,0x76,0x78,0x80,0x82,0x84,0x73,0x75,0x77,0x79,0x81,0x83,0x85]],freeKick:[0x3DF44,[0x7A,0x7C,0x7E,0x80,0x82,0x84,0,0x7B,0x7D,0x7F,0x81,0x83,0x85,0]],bestTime:[0x3DF93,[0x86,0x88,0x8A,0x8C,0x8E,0x90,0x87,0x89,0x8B,0x8D,0x8F,0x91]],bestScore:[0x3DFA7,[0x86,0x88,0x8A,0x92,0x94,0x96,0x87,0x89,0x8B,0x93,0x95,0x97]]};
  const [pc,expected]=originals[id];if(expected.some((v,i)=>base[pc+i]!==v))throw Error('Desafio: descritor original divergente '+id);writes.push([pc,descriptor]);
 }
 reserve(rom,base,0x176500,0x800,konamiLzCompress(raw),writes);writes.push([0x1193D,long(cpu(0x176500))]);
}
function splash(rom,base,values,writes){
 const requested=['worldSeries','firstSeason','secondSeason','international'].some(id=>values?.[id]!==undefined&&norm(values[id])!==({worldSeries:'WORLD SERIES',firstSeason:'1ST SEASON',secondSeason:'2ND SEASON',international:'INTERNATIONAL'})[id]);if(!requested)return;
 verifyPointer(base,0x10510,0x13680A);const source=konamiLzDecompress(base,0x13680A);if(source.data.length!==4512||source.compressedSize!==1099)throw Error('Campeonatos: fonte original divergente.');
 const font=transformLabelPlanes(source.data),tiles=Array.from({length:font.length/32},(_,i)=>font.slice(i*32,i*32+32)),tileIds=new Map(tiles.map((t,i)=>[t.join(','),i])),glyphs=new Map();
 const decode=pc=>{const d=konamiLzDecompress(base,pc);if(d.data.length!==2048)throw Error('Campeonatos: mapa original divergente.');return d.data.slice();};
 const maps={first:decode(0x13DDA2),second:decode(0x13DB46),international:decode(0x8F79C)};
 const pixel=(map,x,y)=>{const cell=word(map,((y>>3)*32+(x>>3))*2),t=cell&1023,xx=cell&0x4000?7-x%8:x%8,yy=cell&0x8000?7-y%8:y%8;let v=0;for(let p=0;p<4;p++)v|=((font[t*32+(p>>1)*16+yy*2+(p&1)]>>(7-xx))&1)<<p;return v;};
 function learn(map,row,text){const spans=[];let start=null;for(let x=0;x<=256;x++){const ink=x<256&&Array.from({length:32},(_,y)=>pixel(map,x,row*8+y)).some(v=>v!==1);if(ink&&start===null)start=x;if(!ink&&start!==null){spans.push([start,x]);start=null;}}const chars=[...text.replace(/ /g,'')];if(chars.length!==spans.length)throw Error('Campeonatos: alfabeto original divergente ('+text+').');chars.forEach((c,i)=>{if(glyphs.has(c))return;const [a,b]=spans[i],pixels=Uint8Array.from({length:(b-a)*32},(_,j)=>pixel(map,a+j%(b-a),row*8+Math.floor(j/(b-a))));glyphs.set(c,{width:b-a,pixels});});}
 learn(maps.first,6,'WORLD SERIES');learn(maps.first,14,'1ST SEASON');learn(maps.second,14,'2ND SEASON');learn(decode(0x136C55),10,'CHAMPIONSHIP');learn(decode(0x8F925),10,'SHORT LEAGUE');
 function paint(map,row,text){
  const s=norm(text),width=[...s].reduce((n,c)=>{if(c===' ')return n+10;const g=glyphs.get(c);if(!g)throw Error('Campeonatos: letra não disponível '+c);return n+g.width+2;},0)-2;if(width>224||!s)throw Error('Campeonatos: título excede 224 pixels.');
  const cells=Array.from({length:32*256},()=>1),left=Math.floor((256-width)/2);let x=left;for(const c of s){if(c===' '){x+=10;continue;}const g=glyphs.get(c);for(let y=0;y<32;y++)for(let xx=0;xx<g.width;xx++)cells[y*256+x+xx]=g.pixels[y*g.width+xx];x+=g.width+2;}
  const main=word(map,(row*32+16)*2)&0x3C00,reflection=word(map,((row+4)*32+16)*2)&0x3C00;
  for(let ty=0;ty<4;ty++)for(let tx=0;tx<32;tx++){
   const bytes=new Uint8Array(32);for(let y=0;y<8;y++)for(let xx=0;xx<8;xx++){const v=cells[(ty*8+y)*256+tx*8+xx];for(let p=0;p<4;p++)bytes[(p>>1)*16+y*2+(p&1)]|=((v>>p)&1)<<(7-xx);}
   const key=bytes.join(',');let index=tileIds.get(key);if(index===undefined){index=tiles.length;tiles.push(bytes);tileIds.set(key,index);}set(map,((row+ty)*32+tx)*2,main|index);set(map,((row+7-ty)*32+tx)*2,reflection|0x8000|index);
  }
 }
 if(values.worldSeries!==undefined&&norm(values.worldSeries)!=='WORLD SERIES'){paint(maps.first,6,values.worldSeries);paint(maps.second,6,values.worldSeries);}
 if(values.firstSeason!==undefined&&norm(values.firstSeason)!=='1ST SEASON')paint(maps.first,14,values.firstSeason);
 if(values.secondSeason!==undefined&&norm(values.secondSeason)!=='2ND SEASON')paint(maps.second,14,values.secondSeason);
 if(values.international!==undefined&&norm(values.international)!=='INTERNATIONAL')paint(maps.international,10,values.international);
 if(tiles.length>512)throw Error('Campeonatos: fonte excede a reserva de VRAM.');const atlas=new Uint8Array(tiles.length*32);tiles.forEach((t,i)=>atlas.set(t,i*32));const packed=konamiLzCompress(transformLabelPlanes(atlas,true));packed[1]|=128;reserve(rom,base,0x185000,0x2000,packed,writes);writes.push([0x10510,long(cpu(0x185000))]);
 for(const [id,source,pointer,slot]of [['international',0x8F79C,0x10535,0x176D00],['first',0x13DDA2,0x1055F,0x177100],['second',0x13DB46,0x10567,0x177500]]){verifyPointer(base,pointer,source);reserve(rom,base,slot,0x400,konamiLzCompress(maps[id]),writes);writes.push([pointer,long(cpu(slot))]);}
}
export function plusExtraMenuGraphicsWriter(rom,state={},base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('pre-partida'))return rom;
 const v=state.additionalScreenTextsV1?.values||{},writes=[];
 const remaining=v['scenario-graphics']?.timeRemaining;
 if(remaining!==undefined&&norm(remaining)!=='TIME REMAINING'){
  if([0x97,0x99,0x9B,0x9D,0x9F,0x98,0x9A,0x9C,0x9E,0xA0].some((x,i)=>base[0x3EE01+i]!==x))throw Error('Cenários: legenda original divergente.');
  const text=norm(remaining);if(text.length>5)throw Error('Cenários: a legenda auxiliar tem cinco células; deixe vazia para ocultá-la.');
  if(text===''){
   // Clearing the rectangle would erase the time already drawn underneath.
   // Skip only the redundant legend; the following routine resets X/A/Y.
   if([0x22,0xA4,0x8D,0x85].some((x,i)=>base[0x525D8+i]!==x))throw Error('Cenários: chamada da legenda divergente.');writes.push([0x525D8,Uint8Array.of(0xEA,0xEA,0xEA,0xEA)]);
  }else{const bytes=new Uint8Array(10);[...text].forEach((c,i)=>{if(NATIVE_MENU_FONTS.SmallMenuText[c]===undefined)throw Error('Cenários: caractere indisponível '+c);bytes[i]=NATIVE_MENU_FONTS.SmallMenuText[c];});writes.push([0x3EE01,bytes]);}
 }
 password(base,v['password-graphics'],writes);challenge(rom,base,v['challenge-graphics-extra'],writes);splash(rom,base,v['competition-graphics'],writes);for(const [pc,bytes]of writes)rom.set(bytes,pc);return rom;
}
