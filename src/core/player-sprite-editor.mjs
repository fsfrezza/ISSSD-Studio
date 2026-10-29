import {ORIGINAL_HAIR_FRAMES} from './player-original-hair.mjs';
import {BALD_BODY_PIXEL_INDICES} from './player-bald-base-data.mjs';
import {PLAYER_POSE_CATALOG} from './player-pose-catalog.mjs';
import {PLAYER_BODY_CATALOG} from './player-body-catalog.mjs';
import {decodeNativeHairTile} from './player-appearance.mjs';
import {encodeHairTile} from './plus-custom-hair.mjs';
export {PLAYER_BODY_CATALOG,PLAYER_POSE_CATALOG};
export const PLAYER_HAIR_POSE_LABELS=["Costas · corrida 1", "Diagonal de costas · corrida 1", "Perfil · corrida 1", "Diagonal de frente · corrida 1", "Frente · corrida 1", "Costas · corrida 3", "Diagonal de costas · corrida 3", "Perfil · corrida 3", "Diagonal de frente · corrida 3", "Frente · corrida 3", "Costas · corrida 5", "Diagonal de costas · corrida 5", "Perfil · corrida 5", "Diagonal de frente · corrida 5", "Frente · corrida 5", "Diagonal de costas · lançamento 5", "Diagonal · chute com giro 4", "Diagonal de frente · lançamento 4", "Caído de costas · quadro 1", "Caído de costas · quadro 2", "Caído de costas · quadro 3", "Caído de frente · quadro 1", "Caído de frente · quadro 2", "Caído de costas · quadro 4"];
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
export function baldBodyPixels(id,pixels){const out=Array.from(pixels),width=records.get(id)?.mounted?16:64;for(const i of BALD_BODY_PIXEL_INDICES[id]||[])if(out[i]===1)out[i]=i%width&&pixels[i-1]===0?3:i>=width&&pixels[i-width]===0?5:4;return out;}
export function readPlayerSprite(rom,ref,edits,{baldBase=false}={}){
 const key=spriteFrameKey(ref),g=geometry(ref),saved=edits?.[ref.kind]?.[key];
 if(saved!==undefined){validateSpritePixels(ref,saved);return{...g,pixels:Array.from(saved)};}
 if(ref.kind==='hair')return{...g,pixels:Array.from(decodeNativeHairTile(rom,ref.style,ref.frame))};
 const r=g.record,p=r.pc,q=p+2+r.top;if(rom[p]!== (r.top&255)||rom[p+1]!==r.top>>8||rom[q]!== (r.bottom&255)||rom[q+1]!==r.bottom>>8)throw Error('Bloco do corpo divergente da Plus: '+ref.id);
 const raw=new Uint8Array(r.top+r.bottom);raw.set(rom.slice(p+2,q));raw.set(rom.slice(q+2,q+2+r.bottom),r.top);const pixels=Array(g.width*g.height).fill(0);
 for(let t=0;t<g.tiles;t++){const a=tilePixels(raw,t);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const [dy,dx]=coord(g,t,x,y);pixels[dy*g.width+dx]=a[y*8+x];}}
 return{...g,pixels:baldBase?baldBodyPixels(ref.id,pixels):pixels};
}
export function originalBodyWithEdits(rom,id,edits){
 const native=readPlayerSprite(rom,{kind:'body',id}).pixels,saved=edits?.body?.[id];if(!saved)return native;
 const bald=baldBodyPixels(id,native);return native.map((v,i)=>saved[i]!==bald[i]?saved[i]:v);
}
export function setPlayerSprite(edits,ref,pixels){validateSpritePixels(ref,pixels);const next=JSON.parse(JSON.stringify(edits||{version:1,hair:{},body:{}}));next.version=1;next[ref.kind]||={};next[ref.kind][spriteFrameKey(ref)]=Array.from(pixels);return next;}
export function restorePlayerSprite(edits,ref){const next=JSON.parse(JSON.stringify(edits||{version:1,hair:{},body:{}}));delete next[ref.kind]?.[spriteFrameKey(ref)];return next;}
export function effectiveProjectHairFrames(frames,edits){const out={14:frames[14].map(a=>Array.from(a)),15:frames[15].map(a=>Array.from(a))};for(const [key,pixels]of Object.entries(edits?.hair||{})){const [style,frame]=key.split(':').map(Number),ref={kind:'hair',style,frame};validateSpritePixels(ref,pixels);if(style>=14)out[style][frame]=Array.from(pixels);}return out;}
export function playerReferencePose(ref){
 spriteFrameKey(ref);
 const matches=PLAYER_POSE_CATALOG.filter(p=>ref.kind==='hair'?p.frame===ref.frame:p.body===ref.id);
 return matches.find(p=>records.get(p.body)?.name.includes('_Running'))||matches[0]||null;
}
export function playerReferenceSequence(pose){
 const name=records.get(pose?.body)?.name||'',match=name.match(/^(.*?)(\d+)$/);if(!match)return pose?[pose]:[];
 const found=new Map();for(const p of PLAYER_POSE_CATALOG){const n=records.get(p.body)?.name||'',m=n.match(/^(.*?)(\d+)$/);if(m&&m[1]===match[1]&&!found.has(p.body))found.set(p.body,{pose:p,order:Number(m[2])});}
 return [...found.values()].sort((a,b)=>a.order-b.order).map(p=>p.pose);
}
export function renderPlayerReference(rom,ref,edits,{pose=playerReferencePose(ref),style=ref.kind==='hair'?ref.style:0,jersey=null}={}){
 if(!pose)return null;const originalStyle14=style===14&&pose.frame>=0&&readPlayerSprite(rom,{kind:'hair',style:14,frame:pose.frame},edits).pixels.every((v,i)=>v===ORIGINAL_HAIR_FRAMES[pose.frame][i]);
 const body=readPlayerSprite(rom,{kind:'body',id:pose.body},edits,{baldBase:!originalStyle14});if(originalStyle14)body.pixels=originalBodyWithEdits(rom,pose.body,edits);const g=geometry({kind:'body',id:pose.body}),signed=v=>v>=128?v-256:v;
 const tileAt=(index,x,y)=>{const top=g.record.top/32,bottom=g.record.bottom/32,t=index<top?index:index>=16&&index<16+bottom?top+index-16:-1;if(t<0)return 0;const [dy,dx]=coord(g,t,x,y);return body.pixels[dy*g.width+dx];};
 const supported=o=>{const size=o[3]&16?16:8;for(let y=0;y<size;y+=8)for(let x=0;x<size;x+=8){const t=o[2]+(y>>3)*16+(x>>3);if(t<g.record.top/32||(t>=16&&t<16+g.record.bottom/32))return true;}return false;};
 const ox=o=>signed(o[0])-((o[3]&16)?8:4),oy=o=>signed(o[1])-((o[3]&16)?8:4);
 const objects=pose.objects.filter(supported),bounds=objects.map(o=>[ox(o),oy(o),o[3]&16?16:8]);
 if(style&&pose.head)bounds.push([signed(pose.head[0])-4,signed(pose.head[1])-4,8]);if(!bounds.length)return null;
 const minX=Math.min(...bounds.map(b=>b[0])),minY=Math.min(...bounds.map(b=>b[1])),width=Math.max(...bounds.map(b=>b[0]+b[2]))-minX,height=Math.max(...bounds.map(b=>b[1]+b[2]))-minY,pixels=Array(width*height).fill(0);
 // OAM entries earlier in the list have priority over later body entries.
 for(const o of objects.slice().reverse()){const size=o[3]&16?16:8;for(let y=0;y<size;y++)for(let x=0;x<size;x++){const sx=o[3]&64?size-1-x:x,sy=o[3]&128?size-1-y:y,v=tileAt(o[2]+(sy>>3)*16+(sx>>3),sx&7,sy&7);if(v)pixels[(oy(o)-minY+y)*width+ox(o)-minX+x]=v;}}
 if(style&&pose.head&&!originalStyle14){const head=readPlayerSprite(rom,{kind:'hair',style,frame:pose.frame},edits).pixels,o=pose.head;for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=head[(o[3]&128?7-y:y)*8+(o[3]&64?7-x:x)];if(v)pixels[(signed(o[1])-4-minY+y)*width+signed(o[0])-4-minX+x]=v;}}
 if(jersey){
  const record=0x10000+(parseInt(pose.id.slice(2),16)&32767),mode=rom[record+5],frame=(mode&127)-1;
  if(mode>=129&&mode<=136){
   const tile=tilePixels(jersey,frame),o=pose.objects.find(o=>o[2]===23&&!(o[3]&16));
   if(o)for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=tile[(o[3]&128?7-y:y)*8+(o[3]&64?7-x:x)];if(!v)continue;const px=ox(o)-minX+x,py=oy(o)-minY+y;if(px>=0&&px<width&&py>=0&&py<height)pixels[py*width+px]=v;}
  }
 }
 return{width,height,pixels,pose,name:records.get(pose.body).name};
}
export function readBaldHeadTile(rom,frame,edits){
 const ref={kind:'hair',style:15,frame},pose=playerReferencePose(ref);
 const draw=v=>renderPlayerReference(rom,ref,{...edits,hair:{...edits?.hair,['15:'+frame]:Array(64).fill(v)}},{pose,style:15});
 const a=draw(14),b=draw(15),base=draw(0),changed=a.pixels.flatMap((v,i)=>v!==b.pixels[i]?[i]:[]),x=Math.min(...changed.map(i=>i%a.width)),y=Math.min(...changed.map(i=>Math.floor(i/a.width)));
 return Array.from({length:64},(_,i)=>base.pixels[(y+(i>>3))*a.width+x+(i&7)]);
}
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
