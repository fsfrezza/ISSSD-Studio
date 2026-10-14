import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Round-trip safety: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const dangerousOffsets='[0x2AA8E,0x2B166,0x3193A]';
const scrubExpr=`(list)=>Array.isArray(list)?list.filter(p=>!${dangerousOffsets}.includes(Number(p?.off??p?.offset))):list`;

// 1) SALVAMENTO: patches físicos pertencentes ao teamsV1 já são semânticos e não podem
// voltar ao .issdproj. Reaplica o sanitizador no ponto final de montagem dos patches e
// exclui incondicionalmente os três loaders C0 da arquitetura 4 MiB antiga.
const projectPatchRx=/const projectPatches=([^;]+);/;
const m=html.match(projectPatchRx);
if(!m)throw new Error('Round-trip safety: montagem projectPatches não encontrada.');
const safeLine=`const projectPatches=(${scrubExpr})(studioSanitizeProjectPatches(studioSanitizeProjectPatches(${m[1]},studioBuildRegionSet()),studioBuildRegionSet()));`;
html=html.replace(projectPatchRx,safeLine);

// 2) ABERTURA: saneia o objeto ANTES de qualquer patch físico ser aplicado e antes da
// captura do baseline sparse. Isso impede que patches históricos contaminem o baseline
// e façam campos ausentes de teamsV1 herdarem bytes errados.
const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
if(!html.includes(applyNeedle))throw new Error('Round-trip safety: studioApplyProjectWithBase não encontrado.');
const preApply=String.raw`
  if(d?.base?.profile==='iss-deluxe-plus'&&d?.state){
    const __isssdScrub=(list)=>{
      if(!Array.isArray(list))return list;
      let next=list;
      try{if(typeof studioSanitizeProjectPatches==='function'&&typeof studioBuildRegionSet==='function')next=studioSanitizeProjectPatches(next,studioBuildRegionSet())}catch(e){console.warn('ISSSD Studio: sanitização semântica pré-abertura',e)}
      return next.filter(p=>![0x2AA8E,0x2B166,0x3193A].includes(Number(p?.off??p?.offset)));
    };
    for(const k of ['patchesCompact','patches','legacyPatches','deferredPlayerPatches'])if(Array.isArray(d.state[k]))d.state[k]=__isssdScrub(d.state[k]);
    if(Array.isArray(d.patches))d.patches=__isssdScrub(d.patches);
    if(d.state.semantic)delete d.state.semantic.plusPreparationV1;
    delete d.state.targetLength;
    window.ISSSDLog?.add?.('Projetos','info','Projeto Plus saneado antes da aplicação física',{roundTrip:'semantic-first-v1'});
  }
`;
html=html.replace(applyNeedle,applyNeedle+preApply);

// 3) Assegura que o finalizador de projeto também remova infraestrutura derivada.
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

if(!html.includes("roundTrip:'semantic-first-v1'"))throw new Error('Round-trip safety: saneamento pré-abertura não foi instalado.');
if(!html.includes('0x2AA8E,0x2B166,0x3193A'))throw new Error('Round-trip safety: bloqueio dos loaders legados ausente.');
if((html.match(/async function studioApplyProjectWithBase\(d,baseBytes,baseName\)\{/g)||[]).length!==1)throw new Error('Round-trip safety: função de abertura ambígua.');

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: round-trip de projeto protegido — patches semânticos são saneados no salvar e antes da abertura; loaders C0 legados são bloqueados.');
