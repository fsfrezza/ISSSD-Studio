import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
export const PREMATCH_GRAPHIC_MAPS=[{pc:0xDBEF7,size:553},{pc:0xDC120,size:474},{pc:0xDC2FA,size:585},{pc:0xDC543,size:350},{pc:0xDC6A1,size:267}];
export const PREMATCH_GRAPHIC_LABELS=[
 ['gameStart','GAME START','kickOff'],['selectSquad','SELECT SQUAD','substitution'],['formationChange','FORMATION CHANGE','formation'],['adjustStrategy','ADJUST STRATEGY','teamStrategy'],['manToMan','MAN TO MAN','markChange'],
 ['keyConfiguration','KEY CONFIGURATION'],['changeController','CHANGE CONTROLLER'],['numberPlayers','NUMBER OF PLAYERS'],['editPlayers','EDIT PLAYER SKILLS'],['teamColors','TEAM COLORS'],
];
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const read=(a,i)=>a[i*2]|a[i*2+1]<<8;
const set=(a,i,v)=>{a[i*2]=v&255;a[i*2+1]=v>>8;};
function renderLabel(text){
 const q=normalize(text),width=[...q].reduce((n,c)=>n+(c===' '?3:6),0)-1;
 if(width>112)throw Error('Pré-partida: “'+q+'” excede os 112 px da linha.');
 const tiles=Math.max(1,Math.ceil(width/8)),raw=new Uint8Array(tiles*2*16),pix=new Uint8Array(tiles*8*16),w=tiles*8;let x=Math.floor((w-width)/2);
 for(const c of q){if(c===' '){x+=3;continue;}const glyph=PLUS_MAIN_MENU_GLYPHS[c];if(!glyph)throw Error('Pré-partida: caractere indisponível '+c);
  for(let y=0;y<7;y++)for(let xx=0;xx<5;xx++)if((glyph[y]>>(6-xx))&1)for(let dy=0;dy<2;dy++)pix[(y*2+dy+1)*w+x+xx]=1;x+=6;
 }
 for(let t=0;t<tiles*2;t++)for(let y=0;y<8;y++){let a=0;for(let xx=0;xx<8;xx++)a|=pix[(Math.floor(t/tiles)*8+y)*w+(t%tiles)*8+xx]<<(7-xx);raw[t*16+y*2]=a;}
 return {raw,tiles};
}
function signature(map,y){const row=Array.from({length:32},(_,x)=>read(map,y*32+x)&1023),xs=row.flatMap((v,x)=>v>512&&v<710?[x]:[]);if(!xs.length)return '';return row.slice(xs[0],xs.at(-1)+1).join(',');}
export function plusPrematchGraphicsWriter(rom,state={},base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('pre-partida'))return rom;
 const screen=state.screenTextsV1?.values?.['match-options']||{},extra=state.additionalScreenTextsV1?.values?.['pre-match-labels']||{};
 const requested=PREMATCH_GRAPHIC_LABELS.map(([id,en,legacy])=>extra[id]??(legacy?screen[legacy]:undefined));
 if(!requested.some((v,i)=>v!==undefined&&normalize(v)!==PREMATCH_GRAPHIC_LABELS[i][1]))return rom;
 const original=konamiLzDecompress(base,0xF631C).data;if(original.length!==3168)throw Error('Pré-partida: stream nativo não reconhecido.');
 const maps=PREMATCH_GRAPHIC_MAPS.map(m=>{const d=konamiLzDecompress(base,m.pc);if(d.data.length!==2048||d.compressedSize>m.size)throw Error('Pré-partida: mapa nativo divergente.');return d.data.slice();});
 const reference=maps[0].slice();
 const starts=[0x201,0x20F,0x221,0x234,0x28E,0x248,0x256,0x26A,0x27E,0x206];
 for(let i=0;i<starts.length;i++){const first=Array.from({length:32},(_,x)=>read(reference,(4+i*2)*32+x)&1023).find(v=>v>512&&v<710);if(first!==starts[i])throw Error('Pré-partida: ordem dos rótulos diverge da Plus verificada.');}
 const patterns=PREMATCH_GRAPHIC_LABELS.map((_,i)=>signature(reference,4+i*2));
 const tiles=Array.from({length:198},(_,i)=>original.slice(i*16,i*16+16));
 for(let i=0;i<requested.length;i++){
  if(requested[i]===undefined||normalize(requested[i])===PREMATCH_GRAPHIC_LABELS[i][1])continue;
  const rendered=renderLabel(requested[i]),first=tiles.length;for(let t=0;t<rendered.raw.length/16;t++)tiles.push(rendered.raw.slice(t*16,t*16+16));
  let count=0;for(const map of maps)for(let y=0;y<31;y++)if(signature(map,y)===patterns[i]){
   const palette=read(map,y*32+11)&0xFC00,left=10+Math.floor((14-rendered.tiles)/2);
   for(let row=0;row<2;row++){for(let x=10;x<=23;x++)set(map,(y+row)*32+x,palette|512);for(let x=0;x<rendered.tiles;x++)set(map,(y+row)*32+left+x,palette|512+first+row*rendered.tiles+x);}
   count++;y++;
  }
  if(!count)throw Error('Pré-partida: ocorrência não encontrada: '+PREMATCH_GRAPHIC_LABELS[i][0]);
 }
 // Only retain referenced tiles. Deduplication prevents shared English glyphs
 // from being overwritten and keeps the native 2153-byte stream capacity.
 const packedTiles=[],lookup=new Map(),remap=new Map();
 for(const map of maps)for(let i=0;i<1024;i++){
  const cell=read(map,i),t=(cell&1023)-512;if(t<0||t>=tiles.length)continue;
  if(!remap.has(t)){const key=[...tiles[t]].join(',');let n=lookup.get(key);if(n===undefined){n=packedTiles.length;lookup.set(key,n);packedTiles.push(tiles[t]);}remap.set(t,n);}
  set(map,i,(cell&0xFC00)|512+remap.get(t));
 }
 if(packedTiles.length>512)throw Error('Pré-partida: atlas excede o charset nativo.');
 const atlas=new Uint8Array(packedTiles.length*16);packedTiles.forEach((t,i)=>atlas.set(t,i*16));const compressed=konamiLzCompress(atlas),writes=[[0xF631C,2153,compressed]];
 maps.forEach((map,i)=>writes.push([PREMATCH_GRAPHIC_MAPS[i].pc,PREMATCH_GRAPHIC_MAPS[i].size,konamiLzCompress(map)]));
 for(const [pc,capacity,data] of writes)if(data.length>capacity)throw Error('Pré-partida: bloco '+pc.toString(16)+' excede capacidade '+data.length+'/'+capacity);
 for(const [pc,capacity,data] of writes){rom.fill(255,pc,pc+capacity);rom.set(data,pc);}return rom;
}
