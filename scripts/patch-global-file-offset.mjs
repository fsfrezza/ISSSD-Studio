import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const original='function fo(internal){return headerSize+internal}';
const patched='function fo(internal){return headerSize+internal}\nwindow.fo=fo;globalThis.fo=fo;';

if(html.includes(original)&&!html.includes('window.fo=fo;globalThis.fo=fo;')){
  html=html.replace(original,patched);
}
if(!html.includes('window.fo=fo;globalThis.fo=fo;')){
  throw new Error('Não foi possível publicar fo() no escopo global do Editor.');
}

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: helper fo() legado publicado explicitamente em window/globalThis para restauração do projeto.');
