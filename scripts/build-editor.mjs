import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parent=path.dirname(root);
const outDir=path.join(root,'editor');
const outHtml=path.join(outDir,'ISSSD-Studio.html');
const cssFile=path.join(root,'editor-src','visual-bridge-overrides.css');
const jsFile=path.join(root,'editor-src','visual-bridge-overrides.mjs');

const candidates=[
 path.join(parent,'ISSSD-Studio-Visual-Bridge','legacy-ui','ISSSD-Studio.html'),
 path.join(parent,'ISSSD-Studio-Visual-Bridge','ISSSD-Studio.html'),
 path.join(parent,'ISSSD-Studio-ANTIGO','ISSSD-Studio.html'),
 path.join(root,'legacy-ui','ISSSD-Studio.html'),
 path.join(root,'ISSSD-Studio.html')
];

const source=candidates.find(p=>fs.existsSync(p));
if(!source){
 console.error('ISSSD Studio: não encontrei a interface legada/Visual Bridge.');
 console.error('Mantenha temporariamente a pasta ISSSD-Studio-Visual-Bridge ao lado de ISSSD-Studio e rode npm run editor novamente.');
 console.error('Locais verificados:\n- '+candidates.join('\n- '));
 process.exit(2);
}

let html=fs.readFileSync(source,'utf8');
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

const sourceDir=path.dirname(source);
for(const name of ['assets','docs','schemas']){
 const from=path.join(sourceDir,name),to=path.join(outDir,name);
 if(fs.existsSync(from)){
  fs.rmSync(to,{recursive:true,force:true});
  fs.cpSync(from,to,{recursive:true});
 }
}

console.log('ISSSD Studio editor build concluído.');
console.log('Fonte visual: '+source);
console.log('Saída: '+outHtml);
