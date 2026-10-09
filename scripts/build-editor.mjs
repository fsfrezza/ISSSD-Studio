import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parent=path.dirname(root);
const outDir=path.join(root,'editor');
const outHtml=path.join(outDir,'ISSSD-Studio.html');
const vendorDir=path.join(root,'.editor-vendor','legacy-ui');
const cachedHtml=path.join(vendorDir,'ISSSD-Studio.html');
const cssFile=path.join(root,'editor-src','visual-bridge-overrides.css');
const jsFile=path.join(root,'editor-src','visual-bridge-overrides.mjs');

const legacyContainer=path.join(parent,'ISSSD-Studio-OLD');
const legacyRoots=[
 path.join(parent,'ISSSD-Studio-Visual-Bridge'),
 path.join(legacyContainer,'ISSSD-Studio-Visual-Bridge'),
 path.join(legacyContainer,'ISSSD-Studio-Preview'),
 path.join(legacyContainer,'ISSSD-Studio-ANTIGO'),
 path.join(legacyContainer,'ISSSD-Studio-OLD'),
 path.join(parent,'ISSSD-Studio-ANTIGO'),
 path.join(root,'legacy-ui'),
 root
];

const candidates=[cachedHtml];
for(const legacyRoot of legacyRoots)candidates.push(path.join(legacyRoot,'legacy-ui','ISSSD-Studio.html'),path.join(legacyRoot,'ISSSD-Studio.html'));
let source=candidates.find(p=>fs.existsSync(p));
if(!source){
 console.error('ISSSD Studio: não encontrei a interface legada/Visual Bridge.');
 console.error('Locais verificados:\n- '+candidates.join('\n- '));
 process.exit(2);
}
if(source!==cachedHtml){
 const sourceDir=path.dirname(source);
 fs.rmSync(path.join(root,'.editor-vendor'),{recursive:true,force:true});
 fs.mkdirSync(vendorDir,{recursive:true});
 fs.copyFileSync(source,cachedHtml);
 for(const name of ['assets','docs','schemas']){const from=path.join(sourceDir,name),to=path.join(vendorDir,name);if(fs.existsSync(from))fs.cpSync(from,to,{recursive:true});}
 source=cachedHtml;
 console.log('Interface legada importada para cache local: '+cachedHtml);
}

let html=fs.readFileSync(source,'utf8');

const unsafeDeferredLength='(studioDeferredPlayerPatches.length-deferredNative.length)';
const safeDeferredLength='((studioDeferredPlayerPatches||[]).length-deferredNative.length)';
if(html.includes(unsafeDeferredLength))html=html.replaceAll(unsafeDeferredLength,safeDeferredLength);

const saveHook='window.__ISSSD_GIT_SYNC_TEXT_STATE_BEFORE_SAVE__?.();';
if(!html.includes(saveHook)){
 const needle='async function studioProjectObject(){';
 if(!html.includes(needle))throw new Error('Build interrompido: não encontrei studioProjectObject para instalar sincronização pré-salvamento.');
 html=html.replace(needle,needle+'\n '+saveHook);
}
if(!html.includes(saveHook))throw new Error('Build interrompido: hook pré-salvamento não foi instalado.');

const openHook='await window.__ISSSD_GIT_AFTER_PROJECT_OPEN__?.(f);';
if(!html.includes(openHook)){
 const re=/await\s+studioImportProject\(f\)\s*;/;
 if(!re.test(html))throw new Error('Build interrompido: não encontrei a chamada de studioImportProject(f) para instalar a restauração automática.');
 html=html.replace(re,m=>m+openHook);
}
if(!html.includes(openHook))throw new Error('Build interrompido: hook pós-importação não foi instalado.');

const css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):'';
const js=fs.existsSync(jsFile)?fs.readFileSync(jsFile,'utf8'):'';
const marker='ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE';
if(!html.includes(marker)){
 const patch=`\n<!-- ${marker} -->\n<style id="isssd-git-visual-bridge-overrides">\n${css}\n</style>\n<script type="module" id="isssd-git-visual-bridge-runtime">\n${js}\n</script>\n`;
 if(html.includes('</body>'))html=html.replace('</body>',patch+'\n</body>');else html+=patch;
}

if(!html.includes('git-visual-bridge-v7-full-project-restore'))throw new Error('Build interrompido: runtime v7 de restauração completa não foi injetado.');
if(html.includes('isssdProjectHydrationDiagnostic')||html.includes('Aplicar dados do projeto aos campos'))throw new Error('Build interrompido: painel manual de diagnóstico ainda está presente na interface gerada.');

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(outHtml,html,'utf8');
for(const name of ['assets','docs','schemas']){const from=path.join(vendorDir,name),to=path.join(outDir,name);if(fs.existsSync(from)){fs.rmSync(to,{recursive:true,force:true});fs.cpSync(from,to,{recursive:true});}}
console.log('ISSSD Studio editor build concluído.');
console.log('Fonte visual em cache: '+source);
console.log('Saída: '+outHtml);
console.log('Hooks obrigatórios confirmados: pós-importação + pré-salvamento + restauração da Tela Inicial.');
