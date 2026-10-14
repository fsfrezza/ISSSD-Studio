import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Round-trip safety: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const dangerousOffsets='[0x2AA8E,0x2B166,0x3193A]';
const scrubExpr=`(list)=>Array.isArray(list)?list.filter(p=>!${dangerousOffsets}.includes(Number(p?.off??p?.offset))):list`;

// SALVAMENTO apenas. A abertura agora é semantic-only e não aplica patches físicos,
// portanto não precisa mais reescrever/sanear o projeto antes de carregá-lo na UI.
const projectPatchRx=/const projectPatches=([^;]+);/;
const m=html.match(projectPatchRx);
if(!m)throw new Error('Round-trip safety: montagem projectPatches não encontrada.');
const originalExpr=m[1];
const safeRegions="(typeof globalThis.studioBuildRegionSet==='function'?globalThis.studioBuildRegionSet():new Set())";
const guardedExpr=originalExpr.replace(/studioBuildRegionSet\(\)/g,safeRegions);
const safeLine=`const projectPatches=(${scrubExpr})(${guardedExpr});`;
html=html.replace(projectPatchRx,safeLine);

// O finalizador do .issdproj remove somente infraestrutura derivada que nunca deve
// persistir. O Build Pipeline v1 volta a gerar isso deterministicamente na exportação.
const finalizeMarker='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){';
if(html.includes(finalizeMarker)&&!html.includes('roundTripSaveSanitized')){
  html=html.replace(finalizeMarker,finalizeMarker+String.raw`
  if(obj?.base?.profile==='iss-deluxe-plus'&&obj?.state){
    const roundTripSaveSanitized=true;
    const scrub=(list)=>Array.isArray(list)?list.filter(p=>![0x2AA8E,0x2B166,0x3193A].includes(Number(p?.off??p?.offset))):list;
    for(const k of ['patchesCompact','patches','legacyPatches','deferredPlayerPatches'])if(Array.isArray(obj.state[k]))obj.state[k]=scrub(obj.state[k]);
    if(Array.isArray(obj.patches))obj.patches=scrub(obj.patches);
    if(obj.state.semantic)delete obj.state.semantic.plusPreparationV1;
    delete obj.state.targetLength;
  }
`);
}

if(!html.includes('roundTripSaveSanitized'))throw new Error('Round-trip safety: saneamento de salvamento não foi instalado.');
if(!html.includes('0x2AA8E,0x2B166,0x3193A'))throw new Error('Round-trip safety: bloqueio dos loaders legados ausente.');
if(!html.includes("typeof globalThis.studioBuildRegionSet==='function'"))throw new Error('Round-trip safety: guarda global de studioBuildRegionSet ausente.');
if(/typeof\s+studioBuildRegionSet\s*===/.test(html))throw new Error('Round-trip safety: referência lexical insegura a studioBuildRegionSet permaneceu.');
if(html.includes("roundTrip:'semantic-first-v3'"))throw new Error('Round-trip safety: saneamento físico de abertura legado ainda está presente.');

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: round-trip simplificado — abertura não toca patches físicos; salvamento remove apenas infraestrutura derivada e loaders C0 legados.');
