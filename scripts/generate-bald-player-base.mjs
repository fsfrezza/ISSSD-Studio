// Offline, deterministic extraction from the immutable Plus ROM; never run during export.
import fs from 'node:fs';import {createHash}from'node:crypto';
import{PLAYER_BODY_CATALOG,PLAYER_POSE_CATALOG,readPlayerSprite,playerReferencePose}from'../src/core/player-sprite-editor.mjs';
import{encodeHairSheet}from'./player-hair-png.mjs';
const rom=fs.readFileSync(process.argv[2]||'');if(createHash('sha256').update(rom).digest('hex')!=='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a')throw Error('Use a Plus original canônica.');
const coord=(r,t,x,y)=>r.mounted?[((t%6)>>1)*16+(t>=6?8:0)+y,t%2*8+x]:[Math.floor(t/8)*8+y,t%8*8+x];
const signed=v=>v>=128?v-256:v;
function sourcePixel(r,pose,x,y){for(const o of pose.objects){const size=o[3]&16?16:8,dx=x-(signed(o[0])-(size>>1)),dy=y-(signed(o[1])-(size>>1));if(dx<0||dy<0||dx>=size||dy>=size)continue;const sx=o[3]&64?size-1-dx:dx,sy=o[3]&128?size-1-dy:dy,tile=o[2]+(sy>>3)*16+(sx>>3),top=r.top/32,bottom=r.bottom/32,t=tile<top?tile:tile>=16&&tile<16+bottom?top+tile-16:-1;if(t<0)continue;const [py,px]=coord(r,t,sx&7,sy&7),at=py*(r.mounted?16:64)+px;if(images[r.id].pixels[at])return at;}return null;}
const images=Object.fromEntries(PLAYER_BODY_CATALOG.map(r=>[r.id,readPlayerSprite(rom,{kind:'body',id:r.id})]));const preserve={};
// Face pixels must survive: central frontal eye and the visible profile eye.
const eyes={3:[[6,3]],4:[[4,3]],7:[[6,3]],9:[[4,3]],12:[[6,3]],14:[[4,3]]};
for(const pose of PLAYER_POSE_CATALOG){if(!pose.head)continue;const r=PLAYER_BODY_CATALOG.find(r=>r.id===pose.body),o=pose.head;for(const [x,y]of eyes[pose.frame]||[]){const sx=o[3]&64?7-x:x,sy=o[3]&128?7-y:y,at=sourcePixel(r,pose,signed(o[0])-4+sx,signed(o[1])-4+sy);if(at!==null&&images[r.id].pixels[at]===1)(preserve[r.id]||=new Set()).add(at);}}
// Two animations reuse index 1 for leg/torso shadows, not hair (checked in assembled poses).
for(const [id,indices]of Object.entries({'95AD70':[653,717],'9D8AC0':[216,280,281,343,63,512]}))for(const i of indices)(preserve[id]||=new Set()).add(i);
const data={};for(const r of PLAYER_BODY_CATALOG){const p=images[r.id].pixels,a=[];for(let i=0;i<p.length;i++)if(p[i]===1&&!preserve[r.id]?.has(i))a.push(i);data[r.id]=a;}
fs.writeFileSync(new URL('../src/core/player-bald-base-data.mjs',import.meta.url),'// Original hair pixels only; indices refer to each mounted body / native atlas.\nexport const BALD_BODY_PIXEL_INDICES='+JSON.stringify(data)+';\n');
const original=[];for(let frame=0;frame<24;frame++){const pose=playerReferencePose({kind:'hair',style:14,frame}),r=PLAYER_BODY_CATALOG.find(r=>r.id===pose.body),o=pose.head,arr=Array(64).fill(0);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const sx=o[3]&64?7-x:x,sy=o[3]&128?7-y:y,at=sourcePixel(r,pose,signed(o[0])-4+sx,signed(o[1])-4+sy);if(at!==null&&data[r.id].includes(at))arr[y*8+x]=1;}original.push(arr);}
fs.writeFileSync(new URL('../assets/player-hair/14-original.png',import.meta.url),encodeHairSheet(original));
fs.writeFileSync(new URL('../src/core/player-original-hair.mjs',import.meta.url),'// Immutable reference used to detect manual edits to style 14.\nexport const ORIGINAL_HAIR_FRAMES='+JSON.stringify(original)+';\n');
const defs=JSON.parse(fs.readFileSync(new URL('../assets/player-hair/poses-careca-cascao.json',import.meta.url)));fs.writeFileSync(new URL('../assets/player-hair/15-cascao.png',import.meta.url),encodeHairSheet(defs.frames.map(f=>f.cascao.join('').split('').map(c=>c==='1'?1:0))));
console.log({bodies:PLAYER_BODY_CATALOG.length,hairPixels:Object.values(data).reduce((s,a)=>s+a.length,0),originalFrames:24});
