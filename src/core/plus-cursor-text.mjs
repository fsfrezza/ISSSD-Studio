import {CURSOR_HELP_FIELDS} from './cursor-text-fields.mjs';
import {CURSOR_LABEL_GFX as GFX,CURSOR_LABEL_HELP} from './cursor-label-layout.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {COMPACT_MENU_FONT} from './plus-controller-text.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
const pairs=[[0,' '],...Array.from({length:10},(_,i)=>[i+1,String(i)]),...Array.from({length:26},(_,i)=>[i+11,String.fromCharCode(65+i)]),...Array.from({length:26},(_,i)=>[i+42,String.fromCharCode(97+i)]),...[...':-!%.'].map((c,i)=>[0x25+i,c]),[0x44,'('],[0x45,')'],...[...'+=<>$?*#~\'/,…'].map((c,i)=>[0x47+i,c])];
const ENCODE=new Map(pairs.map(([b,c])=>[c,b])),DECODE=new Map(pairs);
export function encodeCursorText(field,value){
 const options=field[3],{width,rowCount}=options.native;
 const text=String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\r\n?/g,'\n').replace(/[‘’]/g,"'").replace(/[“”]/g,'"');
 const lines=[];
 for(let line of text.split('\n')){
  while(line.length>width){const split=line.lastIndexOf(' ',width);if(split<=0)throw Error(options.label+': uma palavra ultrapassa '+width+' caracteres.');lines.push(line.slice(0,split));line=line.slice(split+1);}
  lines.push(line);
 }
 if(lines.length>rowCount)throw Error(options.label+': texto precisa de '+lines.length+' linhas; o espaço nativo possui '+rowCount+' linhas de '+width+' caracteres.');
 const bytes=new Uint8Array(width*rowCount);let at=0;
 for(let row=0;row<rowCount;row++)for(const char of (lines[row]||'').padEnd(width,' ')){
  if(!ENCODE.has(char))throw Error(options.label+': caractere não disponível na fonte nativa: '+JSON.stringify(char));
  bytes[at++]=ENCODE.get(char);
 }
 return bytes;
}
export function decodeCursorText(field,bytes){
 const {width,rowCount}=field[3].native;if(bytes.length!==width*rowCount)throw Error('Bloco de texto Cursor com tamanho incorreto');
 return Array.from({length:rowCount},(_,row)=>Array.from(bytes.slice(row*width,(row+1)*width),b=>{if(!DECODE.has(b))throw Error('Glifo Cursor não mapeado: '+b);return DECODE.get(b)}).join('').replace(/ +$/,'')).join('\n');
}
export function cursorTextValues(state={}){
 const data=state.additionalScreenTextsV1;if(data?.schema!=='isssd-additional-screen-texts-v1')return {};
 return {...data.values?.['control-labels'],...data.values?.['cursor-labels']};
}
export function plusCursorTextWriter(rom,state={},base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('pre-partida'))return rom;
 const values=cursorTextValues(state);
 for(const field of CURSOR_HELP_FIELDS){
  const [id,english,,options]=field;if(!Object.hasOwn(values,id))continue;
  const {pc,pointerPc,pointerWord,terminator}=options.native,original=encodeCursorText(field,english),next=encodeCursorText(field,values[id]);
  if((base[pointerPc]|base[pointerPc+1]<<8)!==pointerWord)throw Error(options.label+': ponteiro do Cursor diverge da ROM Plus verificada.');
  if(original.some((byte,i)=>base[pc+i]!==byte)||(terminator!==null&&base[pc+original.length]!==terminator))throw Error(options.label+': texto-base do Cursor diverge da ROM Plus verificada.');
  rom.set(next,pc);
 }
 writeCursorLabels(rom,values,base);
 return rom;
}

const normalizeLabel=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function paintLabel(raw,text,tiles,height){
 const width=tiles.length/height*8,pixels=new Uint8Array(width*height*8);
 const alphabet=height===1?COMPACT_MENU_FONT:null;
 let glyphs=[];
 for(const c of text){
  if(c===' '){glyphs.push({w:height===1?0:3,rows:[]});continue;}
  let rows=alphabet?.[c];
  if(!alphabet){const glyph=PLUS_MAIN_MENU_GLYPHS[c];if(glyph)rows=glyph.slice(0,7).map(n=>Array.from({length:5},(_,i)=>(n>>(6-i))&1).join(''));}
  if(!rows)throw Error('Cursor: caractere indisponível no rótulo: '+JSON.stringify(c));
  glyphs.push({w:rows[0].length,rows});
 }
 const needed=Math.max(0,glyphs.reduce((n,g)=>n+g.w+1,0)-1);
 if(needed>width)throw Error('Cursor: “'+text+'” precisa de '+needed+' px; este rótulo possui '+width+' px.');
 let x=Math.floor((width-needed)/2);const yScale=height===1?1:2;
 for(const g of glyphs){for(let y=0;y<g.rows.length;y++)for(let xx=0;xx<g.w;xx++)if(g.rows[y][xx]==='1')for(let sy=0;sy<yScale;sy++)pixels[(y*yScale+sy)*width+x+xx]=1;x+=g.w+1;}
 // Row-major descriptors may select interleaved top/bottom tiles in the stream.
 for(let i=0;i<tiles.length;i++)for(let y=0;y<8;y++){
  let byte=0;for(let xx=0;xx<8;xx++)byte|=pixels[(Math.floor(i/(width/8))*8+y)*width+(i%(width/8))*8+xx]<<(7-xx);
  raw[tiles[i]*16+y*2]=byte;raw[tiles[i]*16+y*2+1]=0;
 }
 return needed;
}
function writeCursorLabels(rom,values,base){
 for(const [id,helpId] of Object.entries(CURSOR_LABEL_HELP))if(Object.hasOwn(values,id)){
  const field=CURSOR_HELP_FIELDS.find(f=>f[0]===helpId),n=field[3].native,original=encodeCursorText(field,field[1]);
  if(original.some((v,i)=>base[n.pc+i]!==v)||(base[n.pointerPc]|base[n.pointerPc+1]<<8)!==n.pointerWord)throw Error('Cursor: cabeçalho-base divergente: '+id);
  const label=normalizeLabel(values[id]);if(label.length>26)throw Error('Cursor: cabeçalho excede 26 células: '+id);
  const english=(id.startsWith('type')?'TYPE-':'AREA-')+id.slice(-1);
  rom.set(label===english?original.slice(0,28):encodeCursorText(field,label?'-'+label+'-':'').slice(0,28),n.pc);
 }
 if(Object.hasOwn(values,'cursorAuto')){
  const original=[0x68,0x7c,0x7b,0x76,0]; // TallMenuText AUTO, five cells.
  if(original.some((v,i)=>base[0x3cafa+i]!==v))throw Error('Cursor: AUTO-base divergente.');
  const text=normalizeLabel(values.cursorAuto);if(!/^[A-Z ]{0,5}$/.test(text))throw Error('Cursor AUTO: use até 5 letras/espaços.');
  rom.set(Uint8Array.from(text.padEnd(5),c=>c===' '?0:0x68+c.charCodeAt(0)-65),0x3cafa);
 }
 const layouts={type:[[6,8,10,7,9,11],2],area:[[12,14,16,13,15,17],2],cursorChange:[[0,1,2,3,4,5],1],cursorManual:[[18,20,22,24,26,19,21,23,25,27],2]};
 const originals={type:'TYPE',area:'AREA',cursorChange:'CURSOR CHANGE',cursorManual:'MANUAL'};
 const selected=Object.keys(layouts).filter(id=>Object.hasOwn(values,id));if(!selected.length)return;
 const original=Uint8Array.from(GFX.rawHex.match(/../g),s=>parseInt(s,16));
 const source=konamiLzDecompress(base,GFX.pc).data;
 if(source.length!==original.length||source.some((v,i)=>v!==original[i])||[0xde,0xfa,0xac].some((v,i)=>base[GFX.pointerPc+i]!==v))throw Error('Cursor: gráficos ou ponteiro da ROM-base divergentes.');
 const raw=source.slice();let changed=false;
 for(const id of selected){
  let text=normalizeLabel(values[id]);if(text===originals[id])continue;
  const [tiles,height]=layouts[id];
  if(id==='cursorChange'){
   if(text==='TROCA DE CURSOR')text='CURSOR ALTERA'; // User-approved fallback for two native rows of 24 px.
   const width=q=>Math.max(0,[...q].reduce((n,c)=>n+(c===' '?1:(COMPACT_MENU_FONT[c]?.[0].length??3)+1),0)-1);
   const rows=[''];for(const word of text.split(' ')){
    if(width(word)>24)throw Error('Cursor: palavra excede 24 px: '+word);
    const i=rows.length-1,next=rows[i]?rows[i]+' '+word:word;
    if(width(next)>24)rows.push(word);else rows[i]=next;
   }
   if(rows.length>2)throw Error('Cursor: este rótulo possui duas linhas de 24 px.');
   paintLabel(raw,rows[0],tiles.slice(0,3),1);paintLabel(raw,rows[1]||'',tiles.slice(3),1);
  }else paintLabel(raw,text,tiles,height);changed=true;
 }
 if(!changed){rom.set(base.slice(GFX.relocatedPc,GFX.relocatedPc+GFX.relocatedCapacity),GFX.relocatedPc);rom.set(base.slice(GFX.pc,GFX.pc+GFX.capacity),GFX.pc);rom.set(base.slice(GFX.pointerPc,GFX.pointerPc+3),GFX.pointerPc);return;}
 const packed=konamiLzCompress(raw);
 if(packed.length>GFX.relocatedCapacity)throw Error('Cursor: gráfico excede a área reservada.');
 if(base.slice(GFX.relocatedPc,GFX.relocatedPc+GFX.relocatedCapacity).length!==GFX.relocatedCapacity||base.slice(GFX.relocatedPc,GFX.relocatedPc+GFX.relocatedCapacity).some(v=>v!==255))throw Error('Cursor: área livre $87FC00 ocupada na ROM-base.');
 const decoded=konamiLzDecompress(packed).data;if(decoded.length!==raw.length||decoded.some((v,i)=>v!==raw[i]))throw Error('Cursor: falha na verificação do gráfico comprimido.');
 rom.set(packed,GFX.relocatedPc);rom.set([0,0xfc,0x87],GFX.pointerPc);
}
