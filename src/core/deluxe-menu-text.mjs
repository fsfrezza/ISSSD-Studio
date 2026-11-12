import {DELUXE_SUBMENU_FIELDS} from './deluxe-submenu-fields.mjs';
import {SPECIAL_MENU_FIELDS} from './deluxe-special-menu-fields.mjs';
import {DELUXE_MENU_SECTIONS as BASIC_MENU_SECTIONS,NATIVE_MENU_FONTS} from './deluxe-menu-fields.mjs';
export const DELUXE_MENU_SECTIONS=[...BASIC_MENU_SECTIONS,DELUXE_SUBMENU_FIELDS].map(s=>({...s,fields:[...s.fields,...SPECIAL_MENU_FIELDS.filter(f=>f.section===s.id).map(f=>f.field)]}));
export function encodeNativeMenuField(field,value){
 const options=field[3],{segments,font}=options.pool,table=NATIVE_MENU_FONTS[font];
 const text=String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\r\n?/g,'\n').replace(/[‘’]/g,"'");
 let lines=text.split('\n');
 // Regular help rectangles support normal paragraph wrapping; irregular native
 // fragments retain explicit line boundaries and never overwrite control bytes.
 if(segments.length>1&&segments.every(s=>s.original.length===segments[0].original.length)){
  const width=segments[0].original.length;lines=lines.flatMap(line=>{
   const out=[];while(line.length>width){const at=line.lastIndexOf(' ',width);if(at<=0)throw Error(options.label+': palavra excede '+width+' células.');out.push(line.slice(0,at));line=line.slice(at+1);}return [...out,line];
  });
 }
 if(lines.length>segments.length)throw Error(options.label+': texto excede as '+segments.length+' linhas disponíveis.');
 return segments.map((segment,i)=>{
  const line=lines[i]??'',capacity=options.pool.capacity??segment.original.length;
  if(line.length>capacity)throw Error(options.label+': linha '+(i+1)+' excede '+capacity+' células.');
  return Uint8Array.from([...line.padEnd(segment.original.length)],c=>{if(!Object.hasOwn(table,c))throw Error(options.label+': caractere indisponível na fonte: '+JSON.stringify(c));return table[c];});
 });
}

export function applyDeluxeMenuTexts(out,base,values){
 if(values===undefined)return out;
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Textos de menus: objeto inválido');
 const sections=new Map(DELUXE_MENU_SECTIONS.map(s=>[s.id,s]));
 const writes=[];
 for(const [id,items]of Object.entries(values)){
  const section=sections.get(id);
  if(!section)throw Error('Textos de menus: seção desconhecida '+id);
  if(!items||typeof items!=='object'||Array.isArray(items))throw Error('Textos de menus: seção inválida '+id);
  const fields=new Map(section.fields.map(f=>[f[0],f]));
  for(const [key,value]of Object.entries(items)){
   const field=fields.get(key);
   if(!field)throw Error('Textos de menus: campo desconhecido '+key);
   if(typeof value!=='string')throw Error('Textos de menus: valor deve ser string');
   const expected=encodeNativeMenuField(field,field[1]),next=encodeNativeMenuField(field,value);
   field[3].pool.segments.forEach((segment,i)=>{
    if(expected[i].some((v,j)=>base[segment.pc+j]!==v))throw Error(section.title+': texto-base divergente');
    if(value===field[1])return;
    const relocation=field[3].pool.relocation;
    if(relocation){
     const {pc,ref}=relocation,capacity=field[3].pool.capacity;
     if(base.slice(pc,pc+capacity).some(v=>v!==255)||out.slice(pc,pc+capacity).some(v=>v!==255))throw Error('Texto especial: reserva ocupada');
     if((base[ref]|base[ref+1]<<8)!==(segment.pc&65535)||base[ref+4]!==segment.original.length)throw Error('Texto especial: referência original divergente');
     const bytes=new Uint8Array(capacity);bytes.set(next[i]);writes.push([pc,bytes],[ref,Uint8Array.of(pc&255,pc>>8&255)],[ref+4,Uint8Array.of(next[i].length)]);
    }else writes.push([segment.pc,next[i]]);
   });
  }
 }
 const stadium=values['stadium-native'];
 if(stadium&&Object.hasOwn(stadium,'data_87cad3')&&stadium.data_87cad3!=='STADIUM'){
  if((base[0x3B1BE]|base[0x3B1BF]<<8)!==0x0131||(base[0x3448F]|base[0x34490]<<8)!==0x0128)throw Error('Estádio: posições nativas divergentes');
  writes.push([0x3B1BE,Uint8Array.of(0x28,1)],[0x3448F,Uint8Array.of(0x31,1)]);
 }
 const training=values['training-native'];
 if(String(training?.data_87df61??'').trim().toUpperCase()==='MODO'){
  for(const [pc,expected,next]of [[0x3BDBB,0x0108,0x010D],[0x3BDC1,0x0168,0x016D],[0x3BDC7,0x0111,0x0108],[0x3BDCD,0x0172,0x0168]]){
   if((base[pc]|base[pc+1]<<8)!==expected)throw Error('Treino: posição original divergente');writes.push([pc,Uint8Array.of(next&255,next>>8)]);
  }
 }
 if(training&&['data_87df39','data_87df3d','data_87df52','data_87df5b'].some(id=>Object.hasOwn(training,id)&&training[id]!==SPECIAL_MENU_FIELDS.find(f=>f.field[0]===id).field[1])){
  if(base[0x3BE05]!==0x1C||base[0x3BE06]!==0x77)throw Error('Treino: sufixos originais divergentes');writes.push([0x3BE05,Uint8Array.of(0x2A,0xFF)]);
 }
 for(const [pc,bytes]of writes)out.set(bytes,pc);
 return out;
}
