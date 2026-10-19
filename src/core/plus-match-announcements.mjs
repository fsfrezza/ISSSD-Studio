import {MATCH_ANNOUNCEMENTS,MATCH_ANNOUNCEMENT_FALLBACKS} from './match-announcement-fields.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
export const MATCH_FONT_SLOT=0x3E0000;
export const MATCH_MAP_SLOT=0x184400;
export const MATCH_DESCRIPTOR_SLOT=0x3E3400;
export const MATCH_ANNOUNCEMENT_REGIONS=[[MATCH_FONT_SLOT,MATCH_FONT_SLOT+1536],[MATCH_MAP_SLOT,MATCH_MAP_SLOT+1024],[0x12038,0x1204D],[0xCF5C3,0xCFA63],[0x116D81,0x117162],[0x5E7F6,0x5E944],[0x5B703,0x5B70D],[MATCH_DESCRIPTOR_SLOT,MATCH_DESCRIPTOR_SLOT+0x800],...[0x1271F3,0x127200,0x12720D,0x12721A].map(p=>[p,p+13])];
const maps=[{pc:0x116D81,size:151,len:240},{pc:0x116E18,size:66,len:240},{pc:0x116E5A,size:509,len:656},{pc:0x117057,size:267,len:656}];
const mapCaps=[100,32,700,192],mapOffset=i=>mapCaps.slice(0,i).reduce((a,b)=>a+b,0);
const word=n=>[n&255,n>>8&255],long=n=>[n&255,n>>8&255,n>>16&255];
const cpu=pc=>0x800000|((pc>>15)<<16)|0x8000|(pc&32767);
export const normalizeAnnouncement=s=>String(s??'').normalize('NFC').toUpperCase().replace(/\s+/g,' ').trim();
function glyph(c){
 const base=c.normalize('NFD')[0];
 if(c==='!')return [16,16,16,16,16,0,16];
 const rows=PLUS_MAIN_MENU_GLYPHS[base];if(!rows)throw Error('Avisos: caractere indisponível “'+c+'”.');return rows.slice(0,7);
}
function tileBytes(pixels,width,height){
 const out=new Uint8Array(width/8*height/8*16);
 for(let ty=0;ty<height/8;ty++)for(let tx=0;tx<width/8;tx++)for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const v=pixels[(ty*8+y)*width+tx*8+x],at=(ty*width/8+tx)*16+y*2,bit=7-x;out[at]|=(v&1)<<bit;out[at+1]|=(v>>1&1)<<bit;
 }return out;
}
function letter(c,large=false){
 const width=large?32:16,height=32,pix=new Uint8Array(width*height),rows=glyph(c),strokes=[];
 const base=c.normalize('NFD')[0],accent=c!==base,mark=c.normalize('NFD')[1],origin=large?2:mark==='\u0327'?1:accent?3:2;
 const sx=large?5.2:2,sy=4;
 for(let y=0;y<7*sy;y++)for(let x=0;x<Math.floor(5*sx);x++)if(rows[Math.floor(y/sy)]&(1<<(6-Math.floor(x/sx))))strokes.push([x+(large?3:0),y+origin]);
 if(accent){const points=mark==='\u0327'?[[3,30],[2,31]]:mark==='\u0303'?[[1,1],[2,0],[3,0],[4,1],[5,0]]:mark==='\u0302'?[[2,1],[3,0],[4,1]]:[[3,1],[4,0]];strokes.push(...points.map(([x,y])=>[x+(large?12:2),y]));}
 for(const [x,y]of strokes)for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[1,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height)pix[yy*width+xx]=2;}
 for(const [x,y]of strokes)if(x<width&&y<height)pix[y*width+x]=1;
 return tileBytes(pix,width,height);
}
function renderExactAnnouncements(values={}){
 const texts=MATCH_ANNOUNCEMENTS.map(([id,en])=>normalizeAnnouncement(values[id]??en));
 if(texts.some(s=>!s||/[^A-ZÀ-Ý0-9 !.-]/.test(s)))throw Error('Avisos: informe letras, números, espaços e pontuação suportada.');
 const chars=[...new Set(texts.slice(1).join('').replace(/ /g,''))].sort();
 const font=new Uint8Array(1536),letters=new Map(),fontTiles=new Map();
 for(const c of chars){const bytes=letter(c),tiles=[[],[]];for(let y=0;y<4;y++)for(let x=0;x<2;x++){const tile=bytes.slice((y*2+x)*16,(y*2+x+1)*16),key=tile.join(',');if(!fontTiles.has(key)){if(fontTiles.size>=96)throw Error('Avisos: o alfabeto excede os 96 tiles reservados.');font.set(tile,fontTiles.size*16);fontTiles.set(key,0x1A0+fontTiles.size);}tiles[x].push(fontTiles.get(key));}letters.set(c,tiles);}
 const goalChars=[...new Set(texts[0].replace(/ /g,''))],goalFont=new Uint8Array(1184),goalLetters=new Map();
 if(goalChars.length*256>goalFont.length)throw Error('GOL!: alfabeto excede a reserva gráfica.');
 goalChars.forEach((c,i)=>{goalFont.set(letter(c,true),i*256);goalLetters.set(c,0x1A0+i*16);});
 const goalMap=new Uint16Array(240).fill(0x2000),otherMap=new Uint16Array(656).fill(0x2000),chunks=new Map(),descriptors=[];
 let cursor=MATCH_DESCRIPTOR_SLOT+0x40;
 for(let index=0;index<texts.length;index++){
  const [,original]=MATCH_ANNOUNCEMENTS[index],large=index===0,step=large?4:2,text=texts[index],width=text.length*step;
  if(width>28)throw Error(original+': tradução excede a largura nativa; abrevie o aviso.');
  const records=[],left=Math.floor((32-width)/2);
  if(large){
   const cells=[];for(const c of text){const tile=goalLetters.get(c);for(let x=0;x<4;x++)cells.push(c===' '?[0,0,0,0]:[tile+x,tile+4+x,tile+8+x,tile+12+x]);}
   for(let block=0;block<Math.ceil(cells.length/4);block++){const words=[];for(let y=0;y<4;y++)for(let x=0;x<4;x++){const tile=cells[block*4+x]?.[y]??0;words.push(tile?0x2800|tile:0x2000);}goalMap.set(words,block*16);records.push([left+block*4,0xC000+block*32]);}
  }else{
   // A native transfer copies four columns. Each letter occupies two; its
   // trailing blank columns are replaced by the next transfer from left to
   // right. Sharing one block per character keeps the original C200..C720 map.
   for(let i=0;i<text.length;i++){const tile=letters.get(text[i]),words=[];for(let y=0;y<4;y++)for(let x=0;x<4;x++)words.push(tile&&x<2?0x2800|tile[x][y]:0x2000);
    const key=words.join(',');if(!chunks.has(key)){if(chunks.size>=41)throw Error('Avisos: as frases excedem os 41 blocos nativos compartilhados.');chunks.set(key,chunks.size);otherMap.set(words,chunks.get(key)*16);}records.push([left+i*2,0xC200+chunks.get(key)*32]);
   }
  }
  const bytes=new Uint8Array(records.length*4+2);records.forEach(([x,source],i)=>bytes.set([...word(0x80+x*2),...word(source)],i*4));bytes.set([255,255],bytes.length-2);
  if(cursor+bytes.length>MATCH_DESCRIPTOR_SLOT+0x800)throw Error('Avisos: descritores excedem a reserva expandida.');
  descriptors.push([cursor,bytes]);cursor+=bytes.length;
 }
 // Reordering shared blocks can save the last few compressed bytes for mixed
 // English/Portuguese drafts. Repoint descriptors together; never truncate.
 const orders=[[...chunks.values()]],keys=[...chunks.keys()];
 const compare=(a,b)=>{const x=keys[a].split(',').map(Number),y=keys[b].split(',').map(Number);for(let i=0;i<16;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};
 orders.push(orders[0].slice().sort(compare),orders[0].slice().sort((a,b)=>compare(b,a)),orders[0].slice().reverse());
 let best=null;
 for(const order of orders){const map=new Uint16Array(656).fill(0x2000),indices=new Map();order.forEach((old,i)=>{map.set(otherMap.subarray(old*16,old*16+16),i*16);indices.set(old,i);});
  const lo=konamiLzCompress(Uint8Array.from(map,v=>v&255)),hi=konamiLzCompress(Uint8Array.from(map,v=>v>>8));
  if(lo.length<=1024&&hi.length<=1024&&(!best||lo.length+hi.length<best.size))best={map,indices,size:lo.length+hi.length};
 }
 if(best){otherMap.set(best.map);for(let i=1;i<descriptors.length;i++){const bytes=descriptors[i][1];for(let at=0;at<bytes.length-2;at+=4){if(bytes[at]===255&&bytes[at+1]===255)break;const old=((bytes[at+2]|bytes[at+3]<<8)-0xC200)/32;bytes.set(word(0xC200+best.indices.get(old)*32),at+2);}}}
 const raw=[Uint8Array.from(goalMap,v=>v&255),Uint8Array.from(goalMap,v=>v>>8),Uint8Array.from(otherMap,v=>v&255),Uint8Array.from(otherMap,v=>v>>8)];
 const packed=raw.map((data,i)=>{const p=konamiLzCompress(data);if(p.length>mapCaps[i])throw Error('Avisos: mapa '+i+' excede o bloco nativo ('+p.length+'/'+mapCaps[i]+').');const padded=new Uint8Array(mapCaps[i]).fill(255);padded.set(p);return padded;});
 return {texts,font,goalFont,raw,packed,descriptors,characters:chars,fontTileCount:fontTiles.size,blockCount:chunks.size};
}
// Only the three alternatives explicitly approved by the user may replace a
// complete default inscription. Try the fewest replacements first.
export function renderMatchAnnouncements(values={}){
 try{return {...renderExactAnnouncements(values),fallbacks:[]};}catch(originalError){
  const eligible=Object.keys(MATCH_ANNOUNCEMENT_FALLBACKS).filter(id=>normalizeAnnouncement(values[id]??MATCH_ANNOUNCEMENTS.find(f=>f[0]===id)[1])===normalizeAnnouncement(MATCH_ANNOUNCEMENTS.find(f=>f[0]===id)[2]));
  const masks=Array.from({length:(1<<eligible.length)-1},(_,i)=>i+1).sort((a,b)=>a.toString(2).replace(/0/g,'').length-b.toString(2).replace(/0/g,'').length||a-b);
  for(const mask of masks){const shorter={...values},fallbacks=[];eligible.forEach((id,i)=>{if(mask&(1<<i)){shorter[id]=MATCH_ANNOUNCEMENT_FALLBACKS[id];fallbacks.push(id);}});try{return {...renderExactAnnouncements(shorter),fallbacks};}catch{/* try the next explicit alternative */}}
  throw originalError;
 }
}
export function plusMatchAnnouncementsWriter(rom,state,base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('partida'))return rom;
 const values=state?.additionalScreenTextsV1?.values?.['match-announcements'];
 if(!values||!MATCH_ANNOUNCEMENTS.some(([id,en])=>Object.hasOwn(values,id)&&normalizeAnnouncement(values[id])!==en))return rom;
 const rendered=renderMatchAnnouncements(values),writes=[];
 if(rom.length<MATCH_DESCRIPTOR_SLOT+0x800||rom.slice(MATCH_DESCRIPTOR_SLOT,MATCH_DESCRIPTOR_SLOT+0x800).some(v=>v!==255))throw Error('Avisos: reserva de descritores indisponível.');
 const originalReader=[0xF4,0,0x8B,0xAB,0xAB,0xA4,0,0xB9,0xD2,0xE7];
 if(originalReader.some((v,i)=>base[0x5B703+i]!==v))throw Error('Avisos: leitor de descritores divergente.');
 const table=new Uint8Array(36);rendered.descriptors.forEach(([pc],i)=>table.set(word(cpu(pc)&65535),i*2));const last=rendered.descriptors.at(-1);table.set(word(cpu(last[0]+last[1].length-2)&65535),34);
 writes.push([MATCH_DESCRIPTOR_SLOT,table],[0x5B703,Uint8Array.from([0xF4,0,cpu(MATCH_DESCRIPTOR_SLOT)>>16,0xAB,0xAB,0xA4,0,0xB9,...word(cpu(MATCH_DESCRIPTOR_SLOT)&65535)])]);
 for(let i=0;i<MATCH_ANNOUNCEMENTS.length;i++){const ptr=MATCH_ANNOUNCEMENTS[i][3],table=0x5E7D2+i*2;if((base[table]|base[table+1]<<8)!==ptr)throw Error('Avisos: tabela de descritores divergente.');}
 for(let i=0;i<maps.length;i++){const m=maps[i],d=konamiLzDecompress(base,m.pc);if(d.compressedSize!==m.size||d.data.length!==m.len)throw Error('Avisos: mapas divergem da ROM Plus verificada.');const pointer=0x12038+i*6,expected=cpu(m.pc)^0x400000;if(long(expected).some((v,j)=>base[pointer+j]!==v))throw Error('Avisos: carregador de mapas divergente.');const target=MATCH_MAP_SLOT+mapOffset(i);if(base.slice(target,target+mapCaps[i]).some(v=>v!==255)||rom.slice(target,target+mapCaps[i]).some(v=>v!==255))throw Error('Avisos: reserva de mapas indisponível.');writes.push([target,rendered.packed[i]],[pointer,Uint8Array.from(long(cpu(target)^0x400000))]);}
 for(let i=0;i<4;i++){
  const pc=[0x1271F3,0x127200,0x12720D,0x12721A][i],source=0x99FA63+i*256,expected=[128,0,1,24,...word(0x5D00+i*128),...long(source),...word(i===3?192:256),0,0];
  if(expected.some((v,j)=>base[pc+j]!==v))throw Error('Avisos: DMA nativo divergente.');
  writes.push([pc,Uint8Array.from([128,0,1,24,...word(0x5D00+i*192),...long(cpu(MATCH_FONT_SLOT+i*384)),...word(384),0,0])]);
 }
 if(rom.length<MATCH_FONT_SLOT+1536||rom.slice(MATCH_FONT_SLOT,MATCH_FONT_SLOT+1536).some(v=>v!==255))throw Error('Avisos: reserva do alfabeto indisponível.');
 writes.push([MATCH_FONT_SLOT,rendered.font],[0xCF5C3,rendered.goalFont],...rendered.descriptors);
 for(const [pc,data]of writes)rom.set(data,pc);return rom;
}
