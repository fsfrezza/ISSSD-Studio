import {NATIVE_SCREEN_TEXT_FIELDS as ALL_NATIVE_SCREEN_TEXT_FIELDS} from './plus-native-screen-text.mjs';
import {CURSOR_HELP_FIELDS} from './cursor-text-fields.mjs';
import {encodeCursorText,decodeCursorText} from './cursor-text-codec.mjs';
import {readStadiums,stadiumsWriter} from './stadiums.mjs';
// Five short labels live inside Cursor help records. Give the complete record
// one owner so an edit cannot silently overwrite another field's data.
export const NATIVE_SCREEN_TEXT_FIELDS=Object.freeze(ALL_NATIVE_SCREEN_TEXT_FIELDS.filter(f=>!CURSOR_HELP_FIELDS.some(field=>{
 const n=field[3].native,end=n.pc+n.width*n.rowCount;
 return f.pc<end&&f.pc+f.capacity>n.pc;
})));
export {CURSOR_HELP_FIELDS,readStadiums};
function map(value,label){
 if(value===undefined)return {};
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(label+': objeto inválido');
 return value;
}
function knownKeys(value,ids,label){for(const id of Object.keys(value))if(!ids.includes(id))throw Error(label+': campo desconhecido '+id);}
export function readNativeField(rom,field){
 return Array.from(rom.slice(field.pc,field.pc+field.capacity),b=>{
  if(b===0)return ' ';if(b>=11&&b<=36)return String.fromCharCode(b+54);
  throw Error('Glifo nativo não suportado em '+field.name);
 }).join('').trim();
}
export function encodeNativeField(value,field){
 if(typeof value!=='string')throw Error(field.name+': texto deve ser string');
 const text=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
 if(!/^[A-Z ]*$/.test(text))throw Error(field.name+': use letras A–Z e espaços');
 if(text.length>field.capacity)throw Error(field.name+': máximo de '+field.capacity+' caracteres');
 return Uint8Array.from(text.padEnd(field.capacity),c=>c===' '?0:c.charCodeAt(0)-54);
}
export function readCursorHelp(rom,field){
 const n=field[3].native,expected=encodeCursorText(field,field[1]);
 if((rom[n.pointerPc]|rom[n.pointerPc+1]<<8)!==n.pointerWord||
    (n.terminator!==null&&rom[n.pc+expected.length]!==n.terminator))throw Error('Mapeamento do Cursor incompatível: '+field[0]);
 return decodeCursorText(field,rom.slice(n.pc,n.pc+expected.length));
}
export function applyDeluxeNativeChanges(out,base,changes){
 const texts=map(changes.nativeTexts,'Textos nativos');
 knownKeys(texts,NATIVE_SCREEN_TEXT_FIELDS.map(f=>String(f.pc)),'Textos nativos');
 const help=map(changes.cursorHelp,'Cursor');knownKeys(help,CURSOR_HELP_FIELDS.map(f=>f[0]),'Cursor');
 // Plan all text edits before writing. Untouched values preserve native padding.
 const writes=[];
 for(const f of NATIVE_SCREEN_TEXT_FIELDS){
  const value=texts[f.pc];if(value===undefined)continue;
  const encoded=encodeNativeField(value,f);
  if(value!==readNativeField(base,f))writes.push([f.pc,encoded]);
 }
 for(const f of CURSOR_HELP_FIELDS){
  if(!Object.hasOwn(help,f[0]))continue;
  const value=help[f[0]];if(typeof value!=='string')throw Error('Cursor: texto deve ser string');
  const original=readCursorHelp(base,f),encoded=encodeCursorText(f,value);
  if(value!==original)writes.push([f[3].native.pc,encoded]);
 }
 const stadiums=map(changes.stadiums,'Estádios');knownKeys(stadiums,['0','1','2','3','4','5','6','7'],'Estádios');
 for(const [id,colors]of Object.entries(stadiums)){
  if(!Array.isArray(colors)||colors.length!==16||colors.some(c=>!Number.isInteger(c)||c<0||c>32767))throw Error('Estádio '+id+': paleta inválida');
 }
 // Reuse the existing Plus reader, validator and writer on the verified mapping.
 if(Object.keys(stadiums).length)stadiumsWriter(out,{stadiumsV1:{schema:'isssd-stadiums-v1',stadiums:Object.fromEntries(Object.entries(stadiums).map(([id,colors])=>[id,{colors}]))}},base);
 for(const [pc,bytes]of writes)out.set(bytes,pc);
 return out;
}
