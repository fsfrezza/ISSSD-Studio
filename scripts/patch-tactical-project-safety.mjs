import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

// Remove a preparação automática histórica embutida no fluxo legado. A expansão
// continua existindo, mas passa a ser instalada por patch-mandatory-plus-4mb.mjs,
// em um único ponto determinístico antes da restauração semântica e antes do export.
const autoPrep='if(activeRomProfile?.id==="iss-deluxe-plus")await studioAutoPreparePlusTactics();';
html=html.replaceAll(autoPrep,'');

// Remove runtimes antigos caso a baseline local tenha sido construída por versões
// anteriores. A preparação de 4 MiB é infraestrutura derivada: não precisa ser
// persistida no .issdproj porque será refeita obrigatoriamente em toda sessão Plus.
html=html.replace(/<script\s+type=["']module["']\s+id=["']isssd-git-tactical-project-safety-v1["'][^>]*>[\s\S]*?<\/script>\s*/g,'');

const marker='isssd-git-tactical-project-safety-v3-derived-4mb';
if(!html.includes(marker)){
 const runtime=`\n<script type="module" id="${marker}">\n(()=>{\n const prior=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;\n window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){\n  obj=prior?.(obj)||obj;\n  if(!obj?.state?.semantic||obj?.base?.profile!==\"iss-deluxe-plus\")return obj;\n  delete obj.state.semantic.plusPreparationV1;\n  delete obj.state.targetLength;\n  return obj;\n };\n})();\n</script>\n`;
 if(!html.includes('</body>'))throw new Error('Segurança tática: </body> ausente.');
 html=html.replace('</body>',runtime+'\n</body>');
}

if(html.includes(autoPrep))throw new Error('Segurança tática: chamada histórica studioAutoPreparePlusTactics ainda presente.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: preparação tática histórica removida; a expansão obrigatória de 4 MiB será aplicada pelo estágio canônico do build.');
