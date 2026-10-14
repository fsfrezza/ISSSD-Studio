import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const oldApplyFull="function applyFull(p){if(!p)return;try{window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(p)}catch(e){console.error('V15 reapply',e)}hydrateDom(p);try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(_){}}";
const newApplyFull="function applyFull(p){if(!p)return;hydrateDom(p);try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(_){}}";
if(!html.includes(oldApplyFull))throw new Error('Não encontrei applyFull legado que reaplica o projeto sobre a ROM.');
html=html.replace(oldApplyFull,newApplyFull);

const marker='isssd-project-open-semantic-only-v1';
if(html.includes(marker))throw new Error('Barreira de abertura semântica duplicada.');
const guard=`\n<script id="${marker}">\n(()=>{\n if(typeof studioApplyProjectWithBase!=='function')throw new Error('studioApplyProjectWithBase indisponível para a barreira semântica');\n const legacyApply=studioApplyProjectWithBase;\n studioApplyProjectWithBase=async function(d,baseBytes,baseName){\n  if(!(baseBytes instanceof Uint8Array))return legacyApply(d,baseBytes,baseName);\n  const pristine=new Uint8Array(baseBytes);\n  const result=await legacyApply(d,new Uint8Array(baseBytes),baseName);\n  rom=pristine;\n  try{window.__ISSSD_PLUS_4MB_MANDATORY__=false}catch(_){}\n  try{syncModelsFromRom?.()}catch(e){console.warn('Abertura semântica: syncModelsFromRom',e)}\n  try{renderEverything?.()}catch(e){console.warn('Abertura semântica: renderEverything',e)}\n  window.__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true;\n  return result;\n };\n})();\n</script>\n`;
if(!html.includes('</body>'))throw new Error('HTML gerado sem </body>.');
html=html.replace('</body>',guard+'\n</body>');

if(html.includes("try{window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(p)}"))throw new Error('Abertura ainda reaplica estado de projeto diretamente na ROM.');
if(!html.includes('window.__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true'))throw new Error('Barreira de restauração da ROM-base não instalada.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: abertura de projeto isolada da ROM autoritativa; importador legado roda em cópia e a ROM-base é restaurada antes da hidratação semântica.');
