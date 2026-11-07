import {DELUXE_MENU_SECTIONS,NATIVE_MENU_FONTS} from './deluxe-menu-fields.mjs';
export {DELUXE_MENU_SECTIONS};
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
    if(value!==field[1])writes.push([segment.pc,next[i]]);
   });
  }
 }
 for(const [pc,bytes]of writes)out.set(bytes,pc);
 return out;
}
