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
for(const legacyRoot of legacyRoots){
 candidates.push(
  path.join(legacyRoot,'legacy-ui','ISSSD-Studio.html'),
  path.join(legacyRoot,'ISSSD-Studio.html')
 );
}

let source=candidates.find(p=>fs.existsSync(p));
if(!source){
 console.error('ISSSD Studio: não encontrei a interface legada/Visual Bridge.');
 console.error('Na primeira execução, o build procura primeiro o Visual Bridge e depois as demais cópias legadas dentro de ISSSD-Studio-OLD. Depois a interface fica armazenada em .editor-vendor dentro do próprio repositório local.');
 console.error('Locais verificados:\n- '+candidates.join('\n- '));
 process.exit(2);
}

if(source!==cachedHtml){
 const sourceDir=path.dirname(source);
 fs.rmSync(path.join(root,'.editor-vendor'),{recursive:true,force:true});
 fs.mkdirSync(vendorDir,{recursive:true});
 fs.copyFileSync(source,cachedHtml);
 for(const name of ['assets','docs','schemas']){
  const from=path.join(sourceDir,name),to=path.join(vendorDir,name);
  if(fs.existsSync(from))fs.cpSync(from,to,{recursive:true});
 }
 source=cachedHtml;
 console.log('Interface legada importada para cache local: '+cachedHtml);
}

let html=fs.readFileSync(source,'utf8');

// Compatibility fix applied deterministically at build time. Some Visual Bridge
// snapshots guard studioDeferredPlayerPatches while filtering it, but later read
// .length directly. When the legacy lifecycle leaves that variable undefined,
// Salvar Projeto crashes after title-screen image edits. Keep the generated HTML
// safe without editing the cached legacy artifact by hand.
const unsafeDeferredLength='(studioDeferredPlayerPatches.length-deferredNative.length)';
const safeDeferredLength='((studioDeferredPlayerPatches||[]).length-deferredNative.length)';
if(html.includes(unsafeDeferredLength)){
 html=html.replaceAll(unsafeDeferredLength,safeDeferredLength);
 console.log('Compatibilidade aplicada: studioDeferredPlayerPatches.length protegido no salvamento de projeto.');
}

const css=fs.existsSync(cssFile)?fs.readFileSync(cssFile,'utf8'):'';
const js=fs.existsSync(jsFile)?fs.readFileSync(jsFile,'utf8'):'';
const marker='ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE';

if(!html.includes(marker)){
 const patch=`\n<!-- ${marker} -->\n<style id="isssd-git-visual-bridge-overrides">\n${css}\n</style>\n<script type="module" id="isssd-git-visual-bridge-runtime">\n${js}\n</script>\n`;
 if(html.includes('</body>')) html=html.replace('</body>',patch+'\n</body>');
 else html+=patch;
}

fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(outHtml,html,'utf8');

for(const name of ['assets','docs','schemas']){
 const from=path.join(vendorDir,name),to=path.join(outDir,name);
 if(fs.existsSync(from)){
  fs.rmSync(to,{recursive:true,force:true});
  fs.cpSync(from,to,{recursive:true});
 }
}

console.log('ISSSD Studio editor build concluído.');
console.log('Fonte visual em cache: '+source);
console.log('Saída: '+outHtml);
