import {CURSOR_HELP_FIELDS} from './cursor-text-fields.mjs';
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
 return rom;
}
