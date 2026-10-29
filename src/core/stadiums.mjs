export const STADIUMS=Object.freeze(['Japão','Estados Unidos','Espanha','Itália','Inglaterra','Alemanha','Brasil','Nigéria'].map((name,id)=>Object.freeze({id,name,loader:[0x88BE,0x88DB,0x88E3,0x88EB,0x88F3,0x8902,0x8911,0x8919][id],palette:[0x4937A,0x497E0,0x49BDC,0x49DEE,0x4A426,0x4A698,0x4A8A4,0x4AAD8][id]})));
export function readStadiums(bytes){
 if(!(bytes instanceof Uint8Array))throw Error('Abra uma ROM Plus.');
 const hs=bytes.length%0x8000===0x200?0x200:0;
 if(bytes.length-hs<0x200000)throw Error('ROM incompleta para identificar estádios.');
 const word=p=>bytes[hs+p]|bytes[hs+p+1]<<8;
 return STADIUMS.map(s=>{
  const p=hs+s.loader,ptr=0x8000+(s.palette-0x48000);
  if(word(0xEF81+s.id*2)!==s.loader||bytes[p]!==0x28||bytes[p+1]!==0||bytes[p+2]!==0||bytes[p+3]!==0x10||word(s.loader+4)!==ptr||bytes[p+6]!==0x89||word(s.palette)!==0x1F)throw Error('Mapeamento de estádios incompatível com esta ROM.');
  const colors=Array.from({length:16},(_,i)=>word(s.palette+2+i*2));
  if(colors.some(c=>c>0x7FFF))throw Error('Paleta nativa de estádio inválida.');
  return {...s,colors};
 });
}
export function validateStadiums(value){
 const out={schema:'isssd-stadiums-v1',stadiums:{}};
 if(value==null)return out;
 if(value.schema!==out.schema||!value.stadiums||typeof value.stadiums!=='object')throw Error('Configuração de estádios inválida.');
 for(const [id,entry]of Object.entries(value.stadiums)){
  if(!/^[0-7]$/.test(id)||!Array.isArray(entry.colors)||entry.colors.length!==16||entry.colors.some(c=>!Number.isInteger(c)||c<0||c>0x7FFF))throw Error('Cores de estádio inválidas.');
  out.stadiums[id]={colors:entry.colors.slice()};
 }
 return out;
}
export function stadiumsWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('partida'))return rom;
 const value=validateStadiums(state.stadiumsV1),keys=Object.keys(value.stadiums);
 if(!keys.length)return rom;
 const catalog=readStadiums(base),hs=rom.length%0x8000===0x200?0x200:0;
 // Preflight every edit before changing a single byte.
 for(const key of keys){const s=catalog[Number(key)];for(let i=0;i<16;i++){const p=hs+s.palette+2+i*2;if(p+1>=rom.length||(rom[p]|rom[p+1]<<8)!==s.colors[i])throw Error('Conflito na paleta do estádio '+s.name);}}
 for(const key of keys){const s=catalog[Number(key)];value.stadiums[key].colors.forEach((c,i)=>{rom[hs+s.palette+2+i*2]=c&255;rom[hs+s.palette+3+i*2]=c>>8;});}
 return rom;
}
