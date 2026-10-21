import {PLAYER_BODY_CATALOG} from './player-body-catalog.mjs';
import {decodeNativeHairTile} from './player-appearance.mjs';
import {encodeHairTile} from './plus-custom-hair.mjs';
export {PLAYER_BODY_CATALOG};
const records=new Map(PLAYER_BODY_CATALOG.map(r=>[r.id,r]));
export function spriteFrameKey(ref){
 if(ref?.kind==='hair'&&Number.isInteger(ref.style)&&ref.style>=1&&ref.style<=15&&Number.isInteger(ref.frame)&&ref.frame>=0&&ref.frame<24)return ref.style+':'+ref.frame;
 if(ref?.kind==='body'&&records.has(ref.id))return ref.id;
 throw Error('Quadro de jogador inválido.');
}
function tilePixels(raw,t){const a=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++){let v=0;for(let z=0;z<4;z++)v|=(raw[t*32+(z>>1)*16+y*2+(z&1)]>>(7-x)&1)<<z;a.push(v);}return a;}
function geometry(ref){
 spriteFrameKey(ref);if(ref.kind==='hair')return{width:8,height:8};const r=records.get(ref.id),tiles=(r.top+r.bottom)/32;
 return{width:r.mounted?16:64,height:r.mounted?48:Math.ceil(tiles/8)*8,record:r,tiles};
}
function coord(g,t,x,y){if(g.record?.mounted){const half=t>=6?1:0;return[((t%6)>>1)*16+half*8+y,t%2*8+x];}return[Math.floor(t/8)*8+y,t%8*8+x];}
export function validateSpritePixels(ref,pixels){
 const g=geometry(ref);if(!Array.isArray(pixels)&&!(pixels instanceof Uint8Array))throw Error('Pixels inválidos.');
 if(pixels.length!==g.width*g.height||Array.from(pixels).some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Preserve as dimensões e os índices 0–15 do quadro.');
 if(g.record&&!g.record.mounted){for(let t=g.tiles;t<g.width*g.height/64;t++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(pixels[(Math.floor(t/8)*8+y)*g.width+t%8*8+x])throw Error('Não desenhe fora dos tiles existentes.');}
 return g;
}
export function readPlayerSprite(rom,ref,edits){
 const key=spriteFrameKey(ref),g=geometry(ref),saved=edits?.[ref.kind]?.[key];
 if(saved!==undefined){validateSpritePixels(ref,saved);return{...g,pixels:Array.from(saved)};}
 if(ref.kind==='hair')return{...g,pixels:Array.from(decodeNativeHairTile(rom,ref.style,ref.frame))};
 const r=g.record,p=r.pc,q=p+2+r.top;if(rom[p]!== (r.top&255)||rom[p+1]!==r.top>>8||rom[q]!== (r.bottom&255)||rom[q+1]!==r.bottom>>8)throw Error('Bloco do corpo divergente da Plus: '+ref.id);
 const raw=new Uint8Array(r.top+r.bottom);raw.set(rom.slice(p+2,q));raw.set(rom.slice(q+2,q+2+r.bottom),r.top);const pixels=Array(g.width*g.height).fill(0);
 for(let t=0;t<g.tiles;t++){const a=tilePixels(raw,t);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const [dy,dx]=coord(g,t,x,y);pixels[dy*g.width+dx]=a[y*8+x];}}
 return{...g,pixels};
}
export function setPlayerSprite(edits,ref,pixels){validateSpritePixels(ref,pixels);const next=JSON.parse(JSON.stringify(edits||{version:1,hair:{},body:{}}));next.version=1;next[ref.kind]||={};next[ref.kind][spriteFrameKey(ref)]=Array.from(pixels);return next;}
export function restorePlayerSprite(edits,ref){const next=JSON.parse(JSON.stringify(edits||{version:1,hair:{},body:{}}));delete next[ref.kind]?.[spriteFrameKey(ref)];return next;}
export function effectiveProjectHairFrames(frames,edits){const out={14:frames[14].map(a=>Array.from(a)),15:frames[15].map(a=>Array.from(a))};for(const [key,pixels]of Object.entries(edits?.hair||{})){const [style,frame]=key.split(':').map(Number),ref={kind:'hair',style,frame};validateSpritePixels(ref,pixels);if(style>=14)out[style][frame]=Array.from(pixels);}return out;}
export function playerSpriteWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('jogadores'))return rom;const edits=state?.teamsV1?.spriteEdits;if(!edits)return rom;
 if(edits.version!==1)throw Error('Versão dos desenhos de jogador incompatível.');const writes=[];
 for(const [id,pixels]of Object.entries(edits.body||{})){
  const ref={kind:'body',id},g=validateSpritePixels(ref,pixels);readPlayerSprite(base,ref);const raw=new Uint8Array(g.record.top+g.record.bottom);
  for(let t=0;t<g.tiles;t++){const a=new Uint8Array(64);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const [dy,dx]=coord(g,t,x,y);a[y*8+x]=pixels[dy*g.width+dx];}raw.set(encodeHairTile(a),t*32);}
  writes.push({pc:g.record.pc+2,data:raw.slice(0,g.record.top)},{pc:g.record.pc+4+g.record.top,data:raw.slice(g.record.top)});
 }
 for(const [key,pixels]of Object.entries(edits.hair||{})){
  const [style,frame]=key.split(':').map(Number),ref={kind:'hair',style,frame};if(spriteFrameKey(ref)!==key)throw Error('Índice de cabelo inválido.');validateSpritePixels(ref,pixels);
  if(style<=13){const at=0xED6D+(style-1)*4,cpu=base[at]|base[at+1]<<8|base[at+2]<<16;if(cpu>>>16!==0x97)throw Error('Ponteiro de cabelo nativo divergente.');writes.push({pc:((cpu>>>16)&127)*32768+(cpu&32767)+frame*32,data:encodeHairTile(pixels)});}
 }
 for(const w of writes){if(w.pc<0||w.pc+w.data.length>rom.length)throw Error('Desenho fora da ROM.');}
 for(const w of writes)rom.set(w.data,w.pc);return rom;
}
