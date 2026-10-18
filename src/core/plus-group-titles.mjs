import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {COMPACT_MENU_FONT} from './plus-controller-text.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {PLUS_GROUP_ORDER,PLUS_GROUP_TITLES} from './plus-group-identity.mjs';
export const GROUP_TITLE_ASSET={pc:0xF6C78,size:0x2B3,pointer:0x10EEE,cpu:0x9EEC78};
const PHYSICAL_LABELS=['EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA','AFRICA','AMERICA 1','AMERICA 2','AMERICA 3','ALL STARS'];
export const normalizeGroupTitle=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
function bitmap(text){
 const normalized=normalizeGroupTitle(text);
 if(!normalized)throw new Error('Grupos: o nome não pode ficar vazio.');
 if(/[^A-Z0-9 .-]/.test(normalized))throw new Error('Grupos: use letras, números, espaço, ponto ou hífen.');
 const makeFont=compact=>[...normalized].map(c=>c===' '?{width:3,rows:Array(7).fill('000')}:compact?{width:COMPACT_MENU_FONT[c]?.[0].length,rows:COMPACT_MENU_FONT[c]}:{width:5,rows:(PLUS_MAIN_MENU_GLYPHS[c]?.map(v=>Array.from({length:5},(_,x)=>v&(1<<(6-x))?'1':'0').join(''))??COMPACT_MENU_FONT[c]?.map(r=>r.padEnd(5,'0')))});
 let glyphs=makeFont(false),width=glyphs.reduce((n,g)=>n+g.width+1,0)-1;
 if(width>64){glyphs=makeFont(true);width=glyphs.reduce((n,g)=>n+g.width+1,0)-1;}
 if(glyphs.some(g=>!g.rows)||width>64)throw new Error('Grupos: “'+normalized+'” excede a largura de 64 pixels. Encurte o nome.');
 const pix=new Uint8Array(64*16);let pen=Math.floor((64-width)/2);
 for(const g of glyphs){for(let y=0;y<7;y++)for(let x=0;x<g.width;x++)if(g.rows[y][x]==='1')pix[(y+1)*64+pen+x]=1;pen+=g.width+1;}
 return pix;
}
export function planPlusGroupTitles(base,state){
 const s=state?.plusGroups;if(!Array.isArray(s?.labels))return [];
 if(s.labels.length!==10)throw new Error('Grupos: informe dez nomes.');
 const pointers=s.titlePointers??[...PLUS_GROUP_ORDER,9].map(p=>PLUS_GROUP_TITLES[p]);
 if(!s.labels.some((name,i)=>normalizeGroupTitle(name)!==PHYSICAL_LABELS[PLUS_GROUP_TITLES.indexOf(pointers[i])]))return [];
 const a=GROUP_TITLE_ASSET,d=konamiLzDecompress(base,a.pc);
 if(d.compressedSize>a.size||d.data.length!==992||[0x78,0xEC,0x9E].some((v,i)=>base[a.pointer+i]!==v))throw new Error('Grupos: asset de títulos não corresponde à ROM Plus verificada.');
 const tiles=[],ids=new Map(),descriptors=[];
 const tileId=bytes=>{const key=Array.from(bytes).join(',');if(!ids.has(key)){if(tiles.length>=64)throw new Error('Grupos: atlas de títulos excedido.');ids.set(key,0xB2+tiles.length);tiles.push(bytes);}return ids.get(key);};
 for(let logical=0;logical<10;logical++){
  const pix=bitmap(s.labels[logical]),desc=new Uint8Array(16);
  for(let ty=0;ty<2;ty++)for(let tx=0;tx<8;tx++){
   const tile=new Uint8Array(16);for(let y=0;y<8;y++){let bits=0;for(let x=0;x<8;x++)bits|=pix[(ty*8+y)*64+tx*8+x]<<(7-x);tile[y*2]=bits;}
   desc[ty*8+tx]=tileId(tile);
  }
  const physical=logical===9?9:PLUS_GROUP_ORDER[logical];descriptors.push({pc:0x30000+PLUS_GROUP_TITLES[physical],bytes:desc});
 }
 const raw=new Uint8Array(tiles.length*16);tiles.forEach((t,i)=>raw.set(t,i*16));
 const packed=konamiLzCompress(raw);
 if(packed.length>a.size)throw new Error('Grupos: títulos excedem a capacidade gráfica nativa ('+packed.length+'/'+a.size+'). Encurte os nomes.');
 const bytes=new Uint8Array(a.size).fill(255);bytes.set(packed);
 const pointersOut=new Uint8Array(20);PLUS_GROUP_TITLES.forEach((v,i)=>{pointersOut[i*2]=v&255;pointersOut[i*2+1]=v>>8;});
 return [{pc:a.pc,bytes},{pc:0x3FAC8,bytes:pointersOut},...descriptors];
}
export function plusGroupTitlesWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('selecao-equipes'))return rom;
 const plan=planPlusGroupTitles(base,state);for(const {pc,bytes} of plan)rom.set(bytes,pc);return rom;
}
