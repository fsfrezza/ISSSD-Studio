import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(file))throw new Error('Editor gerado não encontrado: '+file);
let html=fs.readFileSync(file,'utf8');

/*
  Primeira defesa: corrige o writer final instalado por player-id-v1.
  Segunda defesa: finaliza o buffer no construtor de Blob, depois de qualquer
  preparação Plus/expansão que possa reescrever os mirrors.

  ISS Deluxe Plus / Brasil (team 30):
  - índice 1 (Cafu / slot físico 2): bytes 1..6 -> 0x78C0..0x78C5
  - índices 2..7: registro completo de 7 bytes -> 0x78C6..0x78EF
*/
const oldWriter="const encoded=studioTeamsV3EncodeAttr(current);for(const dst of studioTeamsV3AttrOffsets(t,slot-1))rom.set(encoded,dst);count++;";
const newWriter="const encoded=studioTeamsV3EncodeAttr(current),attrIndex=slot-1,mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex);rom.set(encoded,mainAttrOff);if(t===30){if(attrIndex===1){rom.set(encoded.slice(1),studioTeamsV3FileOffset(0x78C0));}else if(attrIndex>=2&&attrIndex<=7){rom.set(encoded,studioTeamsV3FileOffset(0x78C6+(attrIndex-2)*7));}}else{for(const dst of studioTeamsV3AttrOffsets(t,attrIndex))if(dst!==mainAttrOff)rom.set(encoded,dst);}count++;";

if(html.includes(oldWriter))html=html.replace(oldWriter,newWriter);
else if(!html.includes('mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex)'))throw new Error('Mirror Brasil: writer final de atributos não encontrado. Verifique a ordem dos patches do build.');

const marker='ISSSD_BRAZIL_FINAL_ROM_MIRROR_V3';
if(!html.includes(marker)){
  const runtime=String.raw`
<script id="${marker}">
(()=>{
'use strict';

const MAIN=0x151068;
const SPECIAL=0x78C0;
const FULL=0x78C6;
const REC=7;

function headerSize(bytes){return (bytes.length%0x8000===0x200)?0x200:0}
function bodySize(bytes){return bytes.length-headerSize(bytes)}
function isSupportedRomSize(bytes){const n=bodySize(bytes);return n===0x200000||n===0x400000}

function syncBrazilFinal(bytes){
  if(!(bytes instanceof Uint8Array)||!isSupportedRomSize(bytes))return false;
  const hs=headerSize(bytes);
  const p1=hs+MAIN+REC;
  bytes.set(bytes.slice(p1+1,p1+7),hs+SPECIAL);
  for(let i=2;i<=7;i++){
    const src=hs+MAIN+i*REC;
    const dst=hs+FULL+(i-2)*REC;
    bytes.set(bytes.slice(src,src+REC),dst);
  }
  return true;
}

function validateBrazilFinal(bytes){
  if(!(bytes instanceof Uint8Array)||!isSupportedRomSize(bytes))return false;
  const hs=headerSize(bytes),p1=hs+MAIN+REC;
  for(let b=0;b<6;b++)if(bytes[p1+1+b]!==bytes[hs+SPECIAL+b])return false;
  for(let i=2;i<=7;i++){
    const src=hs+MAIN+i*REC,dst=hs+FULL+(i-2)*REC;
    for(let b=0;b<REC;b++)if(bytes[src+b]!==bytes[dst+b])return false;
  }
  return true;
}

function repairChecksum(bytes){
  if(!(bytes instanceof Uint8Array)||!isSupportedRomSize(bytes))return false;
  const hs=headerSize(bytes),off=hs+0x7FDC;
  if(off+4>bytes.length)return false;
  bytes.fill(0,off,off+4);
  let sum=0;
  for(let i=0;i<bytes.length;i++)sum=(sum+bytes[i])&0xFFFF;
  const checksum=(sum+0x01FE)&0xFFFF;
  const complement=checksum^0xFFFF;
  bytes[off]=complement&255;
  bytes[off+1]=(complement>>8)&255;
  bytes[off+2]=checksum&255;
  bytes[off+3]=(checksum>>8)&255;
  return true;
}

function finalizeRomBytes(input){
  const out=new Uint8Array(input);
  if(!syncBrazilFinal(out))return out;
  if(!validateBrazilFinal(out))throw new Error('ISSSD Studio: mirror final do Brasil permaneceu inconsistente.');
  repairChecksum(out);
  return out;
}

window.__ISSSD_FINALIZE_BRAZIL_ROM_V3__=finalizeRomBytes;
window.__ISSSD_VALIDATE_BRAZIL_ROM_V3__=validateBrazilFinal;

const NativeBlob=window.Blob;
if(typeof NativeBlob==='function'&&!window.__ISSSD_BLOB_ROM_FINALIZER_V3__){
  class ISSSDFinalBlob extends NativeBlob{
    constructor(parts=[],options={}){
      let finalParts=parts;
      try{
        if(Array.isArray(parts)&&parts.length===1){
          const p=parts[0];
          let u8=null;
          if(p instanceof Uint8Array)u8=new Uint8Array(p);
          else if(p instanceof ArrayBuffer)u8=new Uint8Array(p.slice(0));
          else if(ArrayBuffer.isView(p))u8=new Uint8Array(p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength));
          if(u8&&isSupportedRomSize(u8)){
            const fixed=finalizeRomBytes(u8);
            finalParts=[fixed];
            try{window.ISSSDLog?.add?.('ROM / Build','info','Mirror final do Brasil sincronizado',{size:fixed.length});}catch(_){ }
          }
        }
      }catch(e){
        console.error('ISSSD Studio: falha ao finalizar mirror do Brasil',e);
        throw e;
      }
      super(finalParts,options);
    }
  }
  window.Blob=ISSSDFinalBlob;
  window.__ISSSD_BLOB_ROM_FINALIZER_V3__=true;
}

})();
</script>
`;
  if(!html.includes('</body>'))throw new Error('Mirror Brasil: </body> não encontrado para instalar finalizador.');
  html=html.replace('</body>',runtime+'\n</body>');
}

if(!html.includes('if(t===30){if(attrIndex===1)'))throw new Error('Mirror Brasil: regra especial do jogador 1 não foi instalada no writer.');
if(!html.includes(marker))throw new Error('Mirror Brasil: finalizador V3 não foi instalado.');

fs.writeFileSync(file,html,'utf8');
console.log('ISSSD Studio: mirror Brasil V3 instalado no writer e no buffer final exportado.');
console.log('  team 30 / índice 1: bytes 1..6 -> 0x78C0..0x78C5');
console.log('  team 30 / índices 2..7: 7 bytes -> 0x78C6..0x78EF');
console.log('  checksum recalculado após a sincronização final.');
