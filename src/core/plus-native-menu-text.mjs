import {NATIVE_MENU_FONTS,NATIVE_MENU_TEXT_SECTIONS} from './native-menu-text-fields.mjs';
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
  const line=lines[i]??'',capacity=segment.original.length;
  if(line.length>capacity)throw Error(options.label+': linha '+(i+1)+' excede '+capacity+' células.');
  return Uint8Array.from([...line.padEnd(capacity)],c=>{if(!Object.hasOwn(table,c))throw Error(options.label+': caractere indisponível na fonte: '+JSON.stringify(c));return table[c];});
 });
}
export function plusNativeMenuTextWriter(rom,state={},base=rom,selectedAreas=null){
 const data=state.additionalScreenTextsV1;if(data?.schema!=='isssd-additional-screen-texts-v1')return rom;
 const writes=[];
 for(const section of NATIVE_MENU_TEXT_SECTIONS){
  if(selectedAreas&&!selectedAreas.includes(section.area))continue;
  const values=data.values?.[section.id]||{};
  for(const field of section.fields){
   if(!Object.hasOwn(values,field[0]))continue;
   const expected=encodeNativeMenuField(field,field[1]),next=encodeNativeMenuField(field,values[field[0]]);
   field[3].pool.segments.forEach((segment,i)=>{
    if(expected[i].some((v,j)=>base[segment.pc+j]!==v))throw Error(section.title+' · '+field[3].label+': ROM-base diverge do texto nativo verificado.');
    writes.push([segment.pc,next[i]]);
   });
  }
 }
 // Validate all fields before writing any bytes.
 for(const [pc,bytes] of writes)rom.set(bytes,pc);
 return rom;
}
