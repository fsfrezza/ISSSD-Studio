import {PLUS_MAIN_MENU_IDS,PLUS_MAIN_MENU_ORIGINAL} from './plus-main-menu-state.mjs';
import {PLUS_MAIN_MENU_REGIONS,plusMainMenuWriteRegions,renderPlusMainMenu,decodePlusMainMenuTile} from './plus-main-menu-renderer.mjs';
import {konamiLzDecompress} from './konami-lz.mjs';
export {PLUS_MAIN_MENU_IDS,PLUS_MAIN_MENU_ORIGINAL};
function exactKeys(value,allowed,label){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(label+': objeto inválido');
 for(const key of Object.keys(value))if(!allowed.includes(key))throw Error(label+': campo desconhecido '+key);
}
export function planDeluxeMainMenu(value){
 if(value===undefined)return null;
 exactKeys(value,['texts','scale'],'Menu principal');
 exactKeys(value.texts,PLUS_MAIN_MENU_IDS,'Textos do menu principal');
 const scale=value.scale??80;
 if(!Number.isInteger(scale)||scale<80||scale>160)throw Error('Menu principal: tamanho deve ser de 80 a 160');
 for(const [id,text]of Object.entries(value.texts)){
  if(typeof text!=='string'||!text.trim())throw Error('Menu principal: texto vazio ou inválido '+id);
  if(!/^[A-ZÀ-Ýa-zà-ÿ0-9 \n]+$/.test(text))throw Error('Menu principal: use letras, números, espaços e quebras de linha');
 }
 const changed=Object.entries(value.texts).some(([id,text])=>text!==PLUS_MAIN_MENU_ORIGINAL[id]);
 // A restored menu must keep original graphics and compression byte-for-byte.
 if(!changed&&scale===80)return null;
 return plusMainMenuWriteRegions({texts:{...PLUS_MAIN_MENU_ORIGINAL,...value.texts},style:{items:PLUS_MAIN_MENU_IDS.map(()=>({scale}))},nativeCommitted:true});
}
export function applyDeluxeMainMenu(out,base,value){
 const plan=planDeluxeMainMenu(value);if(!plan)return out;
 // Hash verification belongs to the project builder; preflight native assets as well.
 for(const [key,r]of Object.entries(PLUS_MAIN_MENU_REGIONS)){
  if(r.capacity){const decoded=konamiLzDecompress(base,r.pc);if(decoded.compressedSize>r.capacity||(r.rawLength&&decoded.data.length!==r.rawLength))throw Error('Menu principal: bloco original incompatível '+key);}
 }
 for(const region of plan.regions){if(region.pc<0||region.pc+region.bytes.length>out.length)throw Error('Menu principal: região fora da ROM');}
 for(const region of plan.regions)out.set(region.bytes,region.pc);
 return out;
}
export function deluxeMainMenuPreview(base,value,selected=0,nativeSource=false){
 if(!Number.isInteger(selected)||selected<0||selected>7)throw Error('Seleção do menu inválida');
 const plan=planDeluxeMainMenu(value);
 const data=plan?.rendered??(!nativeSource?renderPlusMainMenu({texts:PLUS_MAIN_MENU_ORIGINAL,style:{items:PLUS_MAIN_MENU_IDS.map(()=>({scale:80}))}}):Object.fromEntries(['sprite','background','tilemap','oam'].map(key=>[key,konamiLzDecompress(base,PLUS_MAIN_MENU_REGIONS[key].pc).data])));
 const pixels=new Uint8Array(256*224),tiles=new Map();
 const tile=(raw,id,kind)=>{const key=kind+id;if(!tiles.has(key))tiles.set(key,decodePlusMainMenuTile(raw.slice(id*32,id*32+32)));return tiles.get(key);};
 for(let y=0;y<28;y++)for(let x=0;x<32;x++){
  const at=(y*32+x)*2,word=data.tilemap[at]|data.tilemap[at+1]<<8,id=(word&1023)-0x180;
  if(id<0||id*32+32>data.background.length)continue;
  const t=tile(data.background,id,'b');
  for(let py=0;py<8;py++)for(let px=0;px<8;px++){const sx=word&0x4000?7-px:px,sy=word&0x8000?7-py:py;pixels[(y*8+py)*256+x*8+px]=t[sy*8+sx];}
 }
 const raw=data.oam,frames=raw[0],count=raw[1]|raw[2]<<8,header=3+frames;
 if(frames!==8||raw.length!==header+count*4)throw Error('Menu principal: objetos de seleção incompatíveis');
 // Highlight the selected label in the static BG typography preview. OBJ timing,
 // palettes and the animated selection are left to the emulator, not simulated.
 const column=selected%2,row=Math.floor(selected/2),x0=column?136:8,y0=24+row*48;
 for(let y=y0;y<Math.min(y0+48,224);y++)for(let x=x0;x<x0+112;x++)if(pixels[y*256+x])pixels[y*256+x]=17;

 return {pixels,width:256,height:224,regions:plan?.regions??[]};
}
