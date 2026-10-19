import {NATIVE_MENU_FONTS,NATIVE_MENU_TEXT_SECTIONS} from './native-menu-text-fields.mjs';
export const TRAINING_SELECTOR_POSITIONS=Object.freeze([[0x3BDBB,0x0108,0x010D],[0x3BDC1,0x0168,0x016D],[0x3BDC7,0x0111,0x0108],[0x3BDCD,0x0172,0x0168]]);
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
 // MODE is shared with other training screens: only reorder this selector.
 if((!selectedAreas||selectedAreas.includes('pre-partida'))&&String(data.values?.['training-native']?.data_87df61??'').toUpperCase()==='MODO'){
  for(const [pc,original,next]of TRAINING_SELECTOR_POSITIONS){
   if((base[pc]|base[pc+1]<<8)!==original)throw Error('Treinamento: posição original do seletor divergente.');
   writes.push([pc,Uint8Array.of(next&255,next>>8)]);
  }
 }
 // Validate all fields before writing any bytes.
 for(const [pc,bytes] of writes)rom.set(bytes,pc);
 return rom;
}
