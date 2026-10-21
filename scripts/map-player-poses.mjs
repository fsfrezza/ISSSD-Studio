// Regenerate pose metadata from the gameplay-only DATA_828C36 initializer.
// Other scenes reuse the same WRAM addresses; never merge their layouts.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';import {PLAYER_BODY_CATALOG} from '../src/core/player-body-catalog.mjs';
const [romPath,asmPath,output=path.resolve(import.meta.dirname,'../src/core/player-pose-catalog.mjs')]=process.argv.slice(2);
if(!romPath||!asmPath)throw Error('Use node scripts/map-player-poses.mjs ROM.sfc Routine_Macros_ISSD.asm [saida.mjs]');
const asm=fs.readFileSync(asmPath,'utf8'),rom=fs.readFileSync(romPath);
if(createHash('sha256').update(rom).digest('hex')!=='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a')throw Error('Use a ROM Plus original canônica.');
const pc=v=>((v>>>16)&127)*32768+(v&32767),word=at=>rom[at]|rom[at+1]<<8;
const ram=new Map();for(const m of asm.slice(asm.indexOf('DATA_828C36:'),asm.indexOf('DATA_828DC3:')).matchAll(/dl DATA_([0-9A-F]{6}) : dw \$7E([0-9A-F]{4})/g)){const src=parseInt(m[1],16),dest=parseInt(m[2],16);if(src>>>16!==0x98)continue;try{const r=konamiLzDecompress(rom,pc(src)).data,n=r[1]|r[2]<<8,header=3+r[0];if(header+n*4!==r.length)continue;let i=0;for(let f=0;f<r[0];f++){const objects=[];for(let j=0;j<r[3+f];j++,i++)objects.push(Array.from({length:4},(_,p)=>r[header+p*n+i]));ram.set(dest+(i-objects.length)*2,objects);}}catch{}}
// Direct ROM objects store Y,X,tile,props; decompressed planes already use X,Y,tile,props.
function objects(address){if(address<0x8000)return ram.get(address);const at=pc(0x880000|address),n=rom[at];if(n>32)return;return Array.from({length:n},(_,i)=>[rom[at+2+i*4],rom[at+1+i*4],rom[at+3+i*4],rom[at+4+i*4]]);}
const ids=new Set(PLAYER_BODY_CATALOG.map(r=>r.id)),poses=[];for(const m of asm.matchAll(/DATA_([0-9A-F]{6}):\s*dw [^\r\n]+ : dl DATA_([0-9A-F]{6}) : db \$[0-9A-F]{2} : dw [^\r\n]+ : db \$[0-9A-F]{2}/g)){
 if(!ids.has(m[2])||parseInt(m[1],16)>>>16!==0x82)continue;const at=pc(parseInt(m[1],16)),a=objects(word(at)),h=objects(word(at+6)),frame=rom[at+8]-1;if(!a||!h||frame<0||frame>=24)continue;poses.push({id:m[1],body:m[2],frame,objects:a,head:h[0]});}
fs.writeFileSync(output,'// Native Plus OAM layout metadata decoded from the disassembly and canonical ROM.\nexport const PLAYER_POSE_CATALOG='+JSON.stringify(poses)+';\n');console.log({poses:poses.length,bodies:new Set(poses.map(p=>p.body)).size,frames:[...new Set(poses.map(p=>p.frame))].sort((a,b)=>a-b)});
