// Native USA number-tile DMA sources (LoROM bank 98), excluding uniform
// pattern tiles and the sentinel blank tile at F014.
export const SHIRT_NUMBER_TILE_START=0xc65d4;
export const SHIRT_NUMBER_TILE_END=0xc7034;
export const SHIRT_NUMBER_NATIVE_INDEX=12;
export function remapShirtNumberTiles(base,index){
 if(!Number.isInteger(index)||index<1||index>15)throw Error('Índice de cor do número inválido.');
 const source=base.slice(SHIRT_NUMBER_TILE_START,SHIRT_NUMBER_TILE_END);
 if(source.length!==SHIRT_NUMBER_TILE_END-SHIRT_NUMBER_TILE_START)throw Error('ROM de números incompatível.');
 const result=new Uint8Array(source.length);
 for(let t=0;t<source.length;t+=32)for(let y=0;y<8;y++){
  const p=t+y*2,mask=source[p+16];
  // Every native opaque pixel is index 12 = planes 2 and 3.
  if(source[p]||source[p+1]||source[p+17]!==mask)throw Error('Tile de número incompatível em '+(SHIRT_NUMBER_TILE_START+t).toString(16));
  for(let plane=0;plane<4;plane++)if(index&(1<<plane))result[p+(plane>>1)*16+(plane&1)]=mask;
 }
 return result;
}
