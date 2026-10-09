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
const marker='ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE';
html=html
 .replace(/<!--\s*ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE\s*-->\s*/g,'')
 .replace(/<style\s+id=["']isssd-git-visual-bridge-overrides["'][^>]*>[\s\S]*?<\/style>\s*/g,'')
 .replace(/<script\s+type=["']module["']\s+id=["']isssd-git-visual-bridge-runtime["'][^>]*>[\s\S]*?<\/script>\s*/g,'');

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
html=html.replaceAll(openHook,'');
const finalImportNeedle="await studioImportProject(f);window.ISSSDLog?.add('Projetos','info','Projeto aberto'";
const finalImportPatched="await studioImportProject(f);"+openHook+"window.ISSSDLog?.add('Projetos','info','Projeto aberto'";
if(!html.includes(finalImportNeedle))throw new Error('Build interrompido: não encontrei o handler final de Abrir Projeto para instalar a restauração automática.');
html=html.replace(finalImportNeedle,finalImportPatched);
const openHookCount=(html.match(/await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\);/g)||[]).length;
if(openHookCount!==1)throw new Error(`Build interrompido: hook pós-importação deveria existir uma vez, encontrado ${openHookCount}.`);
if(/studioImportProject\(f\);\s*await window\.__ISSSD_GIT_AFTER_PROJECT_OPEN__\?\.\(f\);\s*else\b/.test(html))throw new Error('Build interrompido: hook pós-importação foi inserido entre if/else legado.');

// Finalização defensiva: depois de studioProjectObject montar o documento, a baseline
// segura do projeto aberto pode restaurar seções não editadas antes da validação/download.
const finalizeHook='window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__?.(obj);';
html=html.replaceAll(finalizeHook,'');
const projectObjectNeedle='const obj=await studioProjectObject();';
if(!html.includes(projectObjectNeedle))throw new Error('Build interrompido: não encontrei a montagem final do .issdproj para instalar proteção de baseline.');
html=html.replace(projectObjectNeedle,projectObjectNeedle+finalizeHook);
if((html.match(/__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__/g)||[]).length!==1)throw new Error('Build interrompido: proteção final do .issdproj não foi instalada exatamente uma vez.');

const css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):'';
const js=fs.existsSync(jsFile)?fs.readFileSync(jsFile,'utf8'):'';
const patch=`\n<!-- ${marker} -->\n<style id="isssd-git-visual-bridge-overrides">\n${css}\n</style>\n<script type="module" id="isssd-git-visual-bridge-runtime">\n${js}\n</script>\n`;
if(html.includes('</body>'))html=html.replace('</body>',patch+'\n</body>');else html+=patch;

const markerCount=(html.match(/ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE/g)||[]).length;
const runtimeCount=(html.match(/id=["']isssd-git-visual-bridge-runtime["']/g)||[]).length;
const styleCount=(html.match(/id=["']isssd-git-visual-bridge-overrides["']/g)||[]).length;
if(markerCount!==1||runtimeCount!==1||styleCount!==1)throw new Error(`Build interrompido: injeção Git duplicada/incompleta (marker=${markerCount}, runtime=${runtimeCount}, style=${styleCount}).`);
if(!html.includes('git-visual-bridge-v8-safe-project-save'))throw new Error('Build interrompido: runtime v8 de salvamento seguro não foi injetado.');
if(html.includes('isssdProjectHydrationDiagnostic')||html.includes('Aplicar dados do projeto aos campos'))throw new Error('Build interrompido: painel manual de diagnóstico ainda está presente na interface gerada.');

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(outHtml,html,'utf8');
for(const name of ['assets','docs','schemas']){const from=path.join(vendorDir,name),to=path.join(outDir,name);if(fs.existsSync(from)){fs.rmSync(to,{recursive:true,force:true});fs.cpSync(from,to,{recursive:true});}}
console.log('ISSSD Studio editor build concluído.');
console.log('Fonte visual em cache: '+source);
console.log('Saída: '+outHtml);
console.log('Runtime Git v8: abertura automática + baseline protegida + finalização defensiva do projeto.');
