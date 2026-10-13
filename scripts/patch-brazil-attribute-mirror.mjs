import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(file))throw new Error('Editor gerado não encontrado: '+file);
let html=fs.readFileSync(file,'utf8');

/*
  V5: não intercepta Blob/download.

  A revisão do Editor confirmou que a ROM final existe como `output` dentro de
  studioDoSave(). Todas as transformações (build base, gráficos, paletas,
  expansão e demais writers) já terminaram antes do bloco de auditoria e da
  chamada studioDownloadFile(output,...).

  Portanto a integridade do Brasil é aplicada diretamente nesse buffer final,
  ANTES do SHA/audit e ANTES do download. O build falha se esse ponto canônico
  não for localizado exatamente uma vez.
*/

const oldWriter="const encoded=studioTeamsV3EncodeAttr(current);for(const dst of studioTeamsV3AttrOffsets(t,slot-1))rom.set(encoded,dst);count++;";
const newWriter="const encoded=studioTeamsV3EncodeAttr(current),attrIndex=slot-1,mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex);rom.set(encoded,mainAttrOff);if(t===30){if(attrIndex===1){rom.set(encoded.slice(1),studioTeamsV3FileOffset(0x78C0));}else if(attrIndex>=2&&attrIndex<=7){rom.set(encoded,studioTeamsV3FileOffset(0x78C6+(attrIndex-2)*7));}}else{for(const dst of studioTeamsV3AttrOffsets(t,attrIndex))if(dst!==mainAttrOff)rom.set(encoded,dst);}count++;";
if(html.includes(oldWriter))html=html.replace(oldWriter,newWriter);
else if(!html.includes('mainAttrOff=studioTeamsV3AttrOffset(t,attrIndex)'))throw new Error('Mirror Brasil V5: writer de atributos não encontrado.');

for(const id of ['ISSSD_BRAZIL_FINAL_ROM_MIRROR_V3','ISSSD_BRAZIL_FINAL_ROM_MIRROR_V4','ISSSD_BRAZIL_FINAL_ROM_MIRROR_V5']){
  html=html.replace(new RegExp(`<script\\s+id=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'g'),'');
}

// Remove qualquer sobra da estratégia V4 baseada em Blob. Ela não faz parte
// do caminho canônico de exportação e não deve mascarar falhas futuras.
html=html.replaceAll('new globalThis.__ISSSD_FINAL_BLOB_V4__(', 'new Blob(');

const marker='ISSSD_BRAZIL_FINAL_ROM_MIRROR_V5';
const runtime=String.raw`
<script id="${marker}">
(()=>{
'use strict';
const MAIN=0x151068,SPECIAL=0x78C0,FULL=0x78C6,REC=7;
function hs(b){return (b.length%0x8000===0x200)?0x200:0}
function supported(b){const n=b.length-hs(b);return n===0x200000||n===0x400000}
function sync(b){
 if(!(b instanceof Uint8Array)||!supported(b))return false;
 const h=hs(b),p1=h+MAIN+REC;
 b.set(b.slice(p1+1,p1+7),h+SPECIAL);
 for(let i=2;i<=7;i++){
  const s=h+MAIN+i*REC,d=h+FULL+(i-2)*REC;
  b.set(b.slice(s,s+REC),d);
 }
 return true;
}
function valid(b){
 if(!(b instanceof Uint8Array)||!supported(b))return false;
 const h=hs(b),p1=h+MAIN+REC;
 for(let j=0;j<6;j++)if(b[p1+1+j]!==b[h+SPECIAL+j])return false;
 for(let i=2;i<=7;i++){
  const s=h+MAIN+i*REC,d=h+FULL+(i-2)*REC;
  for(let j=0;j<REC;j++)if(b[s+j]!==b[d+j])return false;
 }
 return true;
}
function checksum(b){
 const h=hs(b),o=h+0x7FDC;
 if(o+4>b.length)throw new Error('ISSSD Studio: header SNES fora da ROM final.');
 b.fill(0,o,o+4);
 let sum=0;
 for(let i=0;i<b.length;i++)sum=(sum+b[i])&0xFFFF;
 const c=(sum+0x01FE)&0xFFFF,k=c^0xFFFF;
 b[o]=k&255;b[o+1]=(k>>8)&255;b[o+2]=c&255;b[o+3]=(c>>8)&255;
}
function finalize(input){
 if(!(input instanceof Uint8Array))throw new TypeError('ISSSD Studio: output final não é Uint8Array.');
 const out=new Uint8Array(input);
 if(!supported(out))throw new Error('ISSSD Studio: tamanho inesperado da ROM final: '+out.length+' bytes.');
 if(!sync(out)||!valid(out))throw new Error('ISSSD Studio: mirror final do Brasil permaneceu inconsistente.');
 checksum(out);
 if(!valid(out))throw new Error('ISSSD Studio: mirror do Brasil divergiu após checksum.');
 return out;
}
globalThis.__ISSSD_FINALIZE_BRAZIL_ROM_V5__=finalize;
globalThis.__ISSSD_VALIDATE_BRAZIL_ROM_V5__=valid;
})();
</script>`;
if(!html.includes('</body>'))throw new Error('Mirror Brasil V5: </body> não encontrado.');
html=html.replace('</body>',runtime+'\n</body>');

/*
  Ponto canônico comprovado no Editor:
    let output=studioBuildRomForDownload(...)
    ... todas as finalizações ...
    const __v700BuildAudit=studioV700DiffAudit(snap.base,output)
    studioDownloadFile(output,...)

  Inserimos imediatamente antes da auditoria. Assim o SHA, o diff e o arquivo
  baixado descrevem exatamente os mesmos bytes.
*/
const auditAnchor='const __v700BuildAudit=studioV700DiffAudit(snap.base,output)';
const occurrences=html.split(auditAnchor).length-1;
if(occurrences!==1)throw new Error(`Mirror Brasil V5: esperado 1 ponto canônico de auditoria da ROM, encontrados ${occurrences}. Build interrompido.`);
const finalizeLine="output=globalThis.__ISSSD_FINALIZE_BRAZIL_ROM_V5__(output);if(!globalThis.__ISSSD_VALIDATE_BRAZIL_ROM_V5__(output))throw new Error('ISSSD Studio: validação final do mirror do Brasil falhou antes do download.');window.ISSSDLog?.add?.('ROM / Build','info','Integridade final do Brasil V5 aplicada diretamente ao buffer output',{size:output.length});";
html=html.replace(auditAnchor,finalizeLine+'\n    '+auditAnchor);

const finalizerPos=html.indexOf('__ISSSD_FINALIZE_BRAZIL_ROM_V5__(output)');
const auditPos=html.indexOf(auditAnchor);
const downloadPos=html.indexOf('studioDownloadFile(output',auditPos);
if(finalizerPos<0||auditPos<0||downloadPos<0||!(finalizerPos<auditPos&&auditPos<downloadPos)){
 throw new Error('Mirror Brasil V5: ordem final inválida; esperado finalizer -> audit -> studioDownloadFile(output).');
}
if((html.match(/__ISSSD_FINALIZE_BRAZIL_ROM_V5__\(output\)/g)||[]).length!==1)throw new Error('Mirror Brasil V5: finalizador deve ser chamado exatamente uma vez no output final.');
if(html.includes('__ISSSD_FINAL_BLOB_V4__')||html.includes('globalThis.Blob=FinalBlob'))throw new Error('Mirror Brasil V5: interceptação Blob V4 residual encontrada.');
if(!html.includes('if(t===30){if(attrIndex===1)'))throw new Error('Mirror Brasil V5: regra especial do writer ausente.');

fs.writeFileSync(file,html,'utf8');
console.log('ISSSD Studio: mirror Brasil V5 instalado no ponto canônico de studioDoSave().');
console.log('  ordem verificada: output final -> mirror/checksum -> audit/SHA -> studioDownloadFile');
console.log('  jogador 1: bytes 1..6 -> 0x78C0..0x78C5');
console.log('  jogadores 2..7: 7 bytes -> 0x78C6..0x78EF');
console.log('  nenhuma interceptação global de Blob é usada.');
