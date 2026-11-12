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
 const plan=plusMainMenuWriteRegions({texts:{...PLUS_MAIN_MENU_ORIGINAL,...value.texts},style:{items:PLUS_MAIN_MENU_IDS.map(()=>({scale}))},nativeCommitted:true});
 // All native button states share the OBJ lettering. BG2 is the wallpaper
 // reused by subsequent screens; writing preview labels there leaks them.
 plan.regions=plan.regions.filter(r=>r.pc!==PLUS_MAIN_MENU_REGIONS.background.pc&&r.pc!==PLUS_MAIN_MENU_REGIONS.tilemap.pc);return plan;
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
 const pixels=new Uint8Array(256*224),raw=data.oam,frames=raw[0],count=raw[1]|raw[2]<<8,header=3+frames;
 if(frames!==8||raw.length!==header+count*4)throw Error('Menu principal: objetos de seleção incompatíveis');
 const order=[0,2,4,6,1,3,5,7],tiles=new Map();let offset=0;const signed=v=>v>127?v-256:v;
 for(let frame=0;frame<8;frame++){const size=raw[3+frame];for(let i=offset;i<offset+size;i++){const id=raw[header+count*2+i];if(!tiles.has(id))tiles.set(id,decodePlusMainMenuTile(data.sprite.slice(id*32,id*32+32)));const tile=tiles.get(id),x0=signed(raw[header+i])+128,y0=signed(raw[header+count+i])+120;for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(tile[y*8+x]===1&&x0+x>=0&&x0+x<256&&y0+y>=0&&y0+y<224)pixels[(y0+y)*256+x0+x]=order[frame]===selected?17:1;}offset+=size;}
 return {pixels,width:256,height:224,regions:plan?.regions??[]};
}
