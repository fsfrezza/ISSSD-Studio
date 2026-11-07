// Shared text-only codec from Plus bcd70db. Graphics and relocation excluded.
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
