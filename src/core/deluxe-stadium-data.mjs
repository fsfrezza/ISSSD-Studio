import {konamiLzDecompress} from './konami-lz.mjs';
import {STADIUMS} from './stadiums.mjs';

export const yardsToMeters=yards=>Math.round(yards*0.9144);
// The original table is read only by CODE_A4A003 (the selection and match
// announcement renderer). Physics and stadium loaders use separate tables.
export function applyDeluxeStadiumUnits(out,base,units){
 if(units===undefined||units==='yards')return out;
 if(units!=='meters')throw Error('Unidade de medida do estádio inválida.');
 const table=0x17aed,suffix=0x3ca46,expected=[114,74,118,82,126,90,130,82,122,82,122,74,114,90,138,90];
 if(expected.some((v,i)=>base[table+i]!==v||out[table+i]!==v)||base[suffix]!==0x42||out[suffix]!==0x42)throw Error('Medidas de estádio: dados originais divergentes.');
 out.set(expected.map(yardsToMeters),table);out[suffix]=0x36; // SmallMenuText: m
 return out;
}

// Native stadium selection: 8 × 12 tiles (32 bytes/tile, planar),
// with the shared 32×32 tilemap and the four native field colors.
export function readDeluxeStadiumData(rom,id){
 if(!STADIUMS[id]||!Number.isInteger(id))throw Error('Estádio inválido.');
 const word=pc=>rom[pc]|rom[pc+1]<<8;
 const data=konamiLzDecompress(rom,0x108a0a).data,map=konamiLzDecompress(rom,0x1083f6).data;
 const offset=word(0x17add+id*2)-0x2280;
 if(data.length!==3072||map.length!==2048||offset<0||offset%384||offset+384>data.length||word(0x4dfe0)!==7)throw Error('Gráficos nativos de estádio incompatíveis.');
 const length=rom[0x17aed+id*2],width=rom[0x17aee+id*2],colors=Array.from({length:4},(_,i)=>word(0x4dfe2+i*2));
 const rgba=new Uint8ClampedArray(64*48*4);
 for(let y=0;y<48;y++)for(let x=0;x<64;x++){
  const cell=((y>>3)+8)*32+15+(x>>3),entry=map[cell*2]|map[cell*2+1]<<8,tile=(entry&1023)-0x30;
  if(tile<0||tile>=12)throw Error('Mapa de imagem do estádio inválido.');
  const xx=entry&0x4000?7-(x&7):x&7,yy=entry&0x8000?7-(y&7):y&7,at=offset+tile*32;
  let index=0;for(let p=0;p<4;p++)index|=((data[at+p*8+yy]>>(7-xx))&1)<<p;
  if(index<8||index>11)throw Error('Índice de cor do estádio inválido.');
  const c=colors[index-8],rgb=[c&31,(c>>5)&31,(c>>10)&31].map(v=>(v<<3)|(v>>2));rgba.set([...rgb,255],(y*64+x)*4);
 }
 return {id,name:STADIUMS[id].name,length,width,unit:'yd',imageWidth:64,imageHeight:48,rgba};
}
