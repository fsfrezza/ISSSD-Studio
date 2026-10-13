import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

// A antiga "segurança" expandia toda ROM Plus para 4 MiB e reescrevia três
// loaders táticos durante a abertura do projeto. Isso deixou de ser permitido.
const autoPrep='if(activeRomProfile?.id==="iss-deluxe-plus")await studioAutoPreparePlusTactics();';
html=html.replaceAll(autoPrep,'');

// Também remova o runtime antigo caso a baseline local já tenha sido construída
// por uma versão anterior do patch.
html=html.replace(/<script\s+type=["']module["']\s+id=["']isssd-git-tactical-project-safety-v1["'][^>]*>[\s\S]*?<\/script>\s*/g,'');

const marker='isssd-git-tactical-project-safety-v2-native';
if(!html.includes(marker)){
 const runtime=`\n<script type="module" id="${marker}">\n(()=>{\n const prior=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;\n window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){\n  obj=prior?.(obj)||obj;\n  if(!obj?.state?.semantic||obj?.base?.profile!==\"iss-deluxe-plus\")return obj;\n  // A preparação 4 MiB era infraestrutura derivada e não é mais parte do projeto.\n  delete obj.state.semantic.plusPreparationV1;\n  delete obj.state.targetLength;\n  return obj;\n };\n})();\n</script>\n`;
 if(!html.includes('</body>'))throw new Error('Segurança tática nativa: </body> ausente.');
 html=html.replace('</body>',runtime+'\n</body>');
}

if(html.includes(autoPrep))throw new Error('Segurança tática nativa: preparação automática 4 MiB ainda presente.');
if(/plusPreparationV1\s*=\s*\{/.test(html))throw new Error('Segurança tática nativa: persistência antiga de plusPreparationV1 ainda presente.');

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: expansão tática automática removida — projeto Plus permanece na ROM nativa de 2 MiB.');
