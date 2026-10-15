import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

function functionEnd(source,start){
 const brace=source.indexOf('{',start);if(brace<0)return -1;
 let depth=0,quote=null,escape=false,templateExpr=0;
 for(let i=brace;i<source.length;i++){
  const c=source[i],n=source[i+1];
  if(quote){
   if(escape){escape=false;continue}
   if(c==='\\'){escape=true;continue}
   if(quote==='`'&&c==='$'&&n==='{'){templateExpr++;i++;continue}
   if(quote==='`'&&c==='}'&&templateExpr>0){templateExpr--;continue}
   if(c===quote&&templateExpr===0)quote=null;
   continue;
  }
  if(c==='"'||c==="'"||c==='`'){quote=c;continue}
  if(c==='/'&&n==='/'){i=source.indexOf('\n',i);if(i<0)return source.length-1;continue}
  if(c==='/'&&n==='*'){const j=source.indexOf('*/',i+2);if(j<0)return -1;i=j+1;continue}
  if(c==='{')depth++;
  else if(c==='}'&&--depth===0)return i+1;
 }
 return -1;
}

// Neutraliza a reaplicação pós-importação sem depender da forma/minificação de applyFull.
// Algumas revisões do HTML final encapsulam ou reformatam essa função; o que importa é
// que hydrateDom continue disponível e que nenhuma chamada com o projeto visual `p` reste.
const reapplyProjectP=/window\s*\.\s*__ISSSD_GIT_REAPPLY_PROJECT_STATE__\s*\?\.\s*\(\s*p\s*\)\s*;?/g;
html=html.replace(reapplyProjectP,'void 0;');
if(reapplyProjectP.test(html))throw new Error('Abertura semântica: reaplicação pós-importação ainda presente.');
if(!/hydrateDom\s*\(\s*p\s*\)/.test(html))throw new Error('Abertura semântica: hidratação visual do projeto não encontrada.');

const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
const applyStart=html.indexOf(applyNeedle);
if(applyStart<0)throw new Error('Não encontrei studioApplyProjectWithBase para instalar abertura semântica.');
const applyEnd=functionEnd(html,applyStart);
if(applyEnd<0)throw new Error('Não consegui delimitar studioApplyProjectWithBase.');
let applyBlock=html.slice(applyStart,applyEnd);

const physicalRx=/studioCore\(\)\.applyProject\(cleanBase,rebuilt,[\s\S]*?\);/;
const physical=applyBlock.match(physicalRx)?.[0];
if(!physical)throw new Error('Abertura semântica: aplicação física legada não encontrada.');
applyBlock=applyBlock.replace(physical,`if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__){${physical}}else{rom=new Uint8Array(baseBytes);}`);

const mandatory="await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');";
if(!applyBlock.includes(mandatory))throw new Error('Abertura semântica: expansão 4 MiB legada não encontrada no ciclo de abertura.');
applyBlock=applyBlock.replace(mandatory,`if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__)${mandatory}`);

const reapply='window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d);';
if(!applyBlock.includes(reapply))throw new Error('Abertura semântica: reapply legado não encontrado.');
applyBlock=applyBlock.replace(reapply,"if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__)window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d);");
html=html.slice(0,applyStart)+applyBlock+html.slice(applyEnd);

const restoreHead='function studioRestoreTeamsV1(state){\n studioEnsureMandatoryPlus4MiBSync(true);';
const restoreSafe='function studioRestoreTeamsV1(state){\n if(window.__ISSSD_SEMANTIC_OPEN_ONLY__)return false;\n studioEnsureMandatoryPlus4MiBSync(true);';
if(!html.includes(restoreHead))throw new Error('Abertura semântica: cabeça de studioRestoreTeamsV1 inesperada.');
html=html.replace(restoreHead,restoreSafe);

const marker='isssd-project-open-semantic-only-v2';
if(html.includes(marker))throw new Error('Barreira de abertura semântica duplicada.');
const guard=`\n<script id="${marker}">\n(()=>{\n if(typeof studioApplyProjectWithBase!=='function')throw new Error('studioApplyProjectWithBase indisponível para a abertura semântica');\n const legacyApply=studioApplyProjectWithBase;\n studioApplyProjectWithBase=async function(d,baseBytes,baseName){\n  if(!(baseBytes instanceof Uint8Array))return legacyApply(d,baseBytes,baseName);\n  const previous=window.__ISSSD_SEMANTIC_OPEN_ONLY__;\n  window.__ISSSD_SEMANTIC_OPEN_ONLY__=true;\n  try{\n   rom=new Uint8Array(baseBytes);\n   const result=await legacyApply(d,baseBytes,baseName);\n   rom=new Uint8Array(baseBytes);\n   try{window.__ISSSD_PLUS_4MB_MANDATORY__=false}catch(_){}\n   try{syncModelsFromRom?.()}catch(e){console.warn('Abertura semântica: syncModelsFromRom',e)}\n   try{renderEverything?.()}catch(e){console.warn('Abertura semântica: renderEverything',e)}\n   window.__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true;\n   return result;\n  }finally{window.__ISSSD_SEMANTIC_OPEN_ONLY__=previous}\n };\n})();\n</script>\n`;
if(!html.includes('</body>'))throw new Error('HTML gerado sem </body>.');
html=html.replace('</body>',guard+'\n</body>');

if(reapplyProjectP.test(html))throw new Error('Abertura ainda reaplica estado de projeto diretamente na ROM via projeto visual p.');
for(const required of [
 'window.__ISSSD_SEMANTIC_OPEN_ONLY__=true',
 'if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__){studioCore().applyProject',
 "if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__)await studioEnsureMandatoryPlus4MiB",
 "if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__)window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d)",
 'if(window.__ISSSD_SEMANTIC_OPEN_ONLY__)return false',
 'window.__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true'
])if(!html.includes(required))throw new Error('Abertura semântica incompleta; ausente '+required);

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: abertura de projeto agora é semântica — nenhum patch físico, expansão 4 MiB ou restore teamsV1 é executado durante o carregamento; a ROM autoritativa permanece a base imutável.');
