import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(file))throw new Error('Editor gerado não encontrado: '+file);
let html=fs.readFileSync(file,'utf8');

const oldWriter="const encoded=studioTeamsV3EncodeAttr(current);for(const dst of studioTeamsV3AttrOffsets(t,slot-1))rom.set(encoded,dst);count++;";
const newWriter="const encoded=studioTeamsV3EncodeAttr(current),attrIndex=slot-1,mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex);rom.set(encoded,mainAttrOff);if(t===30){if(attrIndex===1){rom.set(encoded.slice(1),studioTeamsV3FileOffset(0x78C0));}else if(attrIndex>=2&&attrIndex<=7){rom.set(encoded,studioTeamsV3FileOffset(0x78C6+(attrIndex-2)*7));}}else{for(const dst of studioTeamsV3AttrOffsets(t,attrIndex))if(dst!==mainAttrOff)rom.set(encoded,dst);}count++;";
if(html.includes(oldWriter))html=html.replace(oldWriter,newWriter);
else if(!html.includes('mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex)'))throw new Error('Mirror Brasil: writer final não encontrado.');

for(const id of ['ISSSD_BRAZIL_FINAL_ROM_MIRROR_V3','ISSSD_BRAZIL_FINAL_ROM_MIRROR_V4']){
  html=html.replace(new RegExp(`<script\\s+id=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');
}

let blobCalls=0;
html=html.replace(/\bnew\s+(?:window\.|globalThis\.)?Blob\s*\(/g,()=>{blobCalls++;return 'new globalThis.__ISSSD_FINAL_BLOB_V4__(';});

const marker='ISSSD_BRAZIL_FINAL_ROM_MIRROR_V4';
const runtime=String.raw`
<script id="${marker}">
(()=>{
'use strict';
const MAIN=0x151068,SPECIAL=0x78C0,FULL=0x78C6,REC=7;
function hs(b){return (b.length%0x8000===0x200)?0x200:0}
function supported(b){const n=b.length-hs(b);return n===0x200000||n===0x400000}
function sync(b){if(!(b instanceof Uint8Array)||!supported(b))return false;const h=hs(b),p1=h+MAIN+REC;b.set(b.slice(p1+1,p1+7),h+SPECIAL);for(let i=2;i<=7;i++){const s=h+MAIN+i*REC,d=h+FULL+(i-2)*REC;b.set(b.slice(s,s+REC),d)}return true}
function valid(b){if(!(b instanceof Uint8Array)||!supported(b))return false;const h=hs(b),p1=h+MAIN+REC;for(let j=0;j<6;j++)if(b[p1+1+j]!==b[h+SPECIAL+j])return false;for(let i=2;i<=7;i++){const s=h+MAIN+i*REC,d=h+FULL+(i-2)*REC;for(let j=0;j<REC;j++)if(b[s+j]!==b[d+j])return false}return true}
function checksum(b){const h=hs(b),o=h+0x7FDC;b.fill(0,o,o+4);let sum=0;for(let i=0;i<b.length;i++)sum=(sum+b[i])&0xFFFF;const c=(sum+0x01FE)&0xFFFF,k=c^0xFFFF;b[o]=k&255;b[o+1]=(k>>8)&255;b[o+2]=c&255;b[o+3]=(c>>8)&255}
function finalize(input){const out=new Uint8Array(input);if(!sync(out))return out;if(!valid(out))throw new Error('ISSSD Studio: mirror final do Brasil inconsistente.');checksum(out);return out}
function partBytes(p){if(p instanceof Uint8Array)return new Uint8Array(p);if(p instanceof ArrayBuffer)return new Uint8Array(p.slice(0));if(ArrayBuffer.isView(p))return new Uint8Array(p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength));return null}
function joinBinary(parts){if(!Array.isArray(parts)||!parts.length)return null;const chunks=[];let total=0;for(const p of parts){const u=partBytes(p);if(!u)return null;chunks.push(u);total+=u.length}const out=new Uint8Array(total);let o=0;for(const u of chunks){out.set(u,o);o+=u.length}return out}
window.__ISSSD_FINALIZE_BRAZIL_ROM_V4__=finalize;
window.__ISSSD_VALIDATE_BRAZIL_ROM_V4__=valid;
const NativeBlob=globalThis.Blob;
class FinalBlob extends NativeBlob{
 constructor(parts=[],options={}){
  let use=parts;
  try{const joined=joinBinary(parts);if(joined&&supported(joined)){const fixed=finalize(joined);use=[fixed];try{window.ISSSDLog?.add?.('ROM / Build','info','Mirror final do Brasil V4 sincronizado',{size:fixed.length,parts:parts.length});}catch(_){}}}catch(e){console.error('ISSSD Studio: falha no finalizador V4',e);throw e}
  super(use,options);
 }
}
globalThis.__ISSSD_FINAL_BLOB_V4__=FinalBlob;
globalThis.Blob=FinalBlob;
})();
</script>`;
if(!html.includes('</body>'))throw new Error('Mirror Brasil: </body> não encontrado.');
html=html.replace('</body>',runtime+'\n</body>');

if(!html.includes('if(t===30){if(attrIndex===1)'))throw new Error('Mirror Brasil: regra especial do Brasil ausente.');
if(!html.includes(marker))throw new Error('Mirror Brasil: finalizador V4 ausente.');
fs.writeFileSync(file,html,'utf8');
console.log(`ISSSD Studio: mirror Brasil V4 instalado; ${blobCalls} call-site(s) de Blob redirecionado(s).`);
console.log('  jogador 1: bytes 1..6 -> 0x78C0..0x78C5');
console.log('  jogadores 2..7: 7 bytes -> 0x78C6..0x78EF');
console.log('  suporta Blob com uma ou várias partes binárias e recalcula checksum.');
