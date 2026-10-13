import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(file))throw new Error('Editor gerado não encontrado: '+file);
let html=fs.readFileSync(file,'utf8');

/*
  O player-id-v1 substitui studioTeamsV3RestoreAttrs depois do patch canônico.
  Portanto a correção precisa atuar no writer FINAL, e não no download.

  ISS Deluxe Plus / Brasil (team 30):
  - índice 1 (Cafu / slot físico 2): bytes 1..6 -> 0x78C0..0x78C5
  - índices 2..7: registro completo de 7 bytes -> 0x78C6..0x78EF
*/
const oldWriter="const encoded=studioTeamsV3EncodeAttr(current);for(const dst of studioTeamsV3AttrOffsets(t,slot-1))rom.set(encoded,dst);count++;";
const newWriter="const encoded=studioTeamsV3EncodeAttr(current),attrIndex=slot-1,mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex);rom.set(encoded,mainAttrOff);if(t===30){if(attrIndex===1){rom.set(encoded.slice(1),studioTeamsV3FileOffset(0x78C0));}else if(attrIndex>=2&&attrIndex<=7){rom.set(encoded,studioTeamsV3FileOffset(0x78C6+(attrIndex-2)*7));}}else{for(const dst of studioTeamsV3AttrOffsets(t,attrIndex))if(dst!==mainAttrOff)rom.set(encoded,dst);}count++;";

if(!html.includes(oldWriter)){
  if(html.includes('mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex)')){
    console.log('ISSSD Studio: writer do mirror Brasil já corrigido.');
    process.exit(0);
  }
  throw new Error('Mirror Brasil: writer final de atributos não encontrado. Verifique a ordem dos patches do build.');
}

html=html.replace(oldWriter,newWriter);

if(!html.includes('if(t===30){if(attrIndex===1)'))throw new Error('Mirror Brasil: regra especial do jogador 1 não foi instalada.');
if(!html.includes('0x78C6+(attrIndex-2)*7'))throw new Error('Mirror Brasil: regra dos jogadores 2..7 não foi instalada.');
if(html.includes(oldWriter))throw new Error('Mirror Brasil: writer antigo permaneceu após o patch.');

fs.writeFileSync(file,html,'utf8');
console.log('ISSSD Studio: mirror Brasil instalado no writer final de atributos.');
console.log('  team 30 / índice 1: bytes 1..6 -> 0x78C0..0x78C5');
console.log('  team 30 / índices 2..7: 7 bytes -> 0x78C6..0x78EF');
