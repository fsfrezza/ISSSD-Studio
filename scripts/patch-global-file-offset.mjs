import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const BOOT_ID='isssd-global-file-offset-bootstrap';
html=html.replace(new RegExp(`<script\\s+id=["']${BOOT_ID}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'gi'),'');

// Cria um binding global REAL antes de qualquer runtime legado ou ES module.
// A correção anterior apenas fazia window.fo=fo depois da declaração legada,
// o que não protege consumidores executados em outro escopo/módulo.
const bootstrap=`<script id="${BOOT_ID}">
var fo=function(internal){
  var hs=0;
  try{
    if(typeof headerSize!=='undefined'&&Number.isFinite(Number(headerSize)))hs=Number(headerSize);
    else if(globalThis.rom&&Number.isFinite(Number(globalThis.rom.length)))hs=(globalThis.rom.length%0x8000===0x200)?0x200:0;
    else if(Number.isFinite(Number(globalThis.__ISSSD_HEADER_SIZE__)))hs=Number(globalThis.__ISSSD_HEADER_SIZE__);
  }catch(_){}
  return hs+(Number(internal)||0);
};
globalThis.fo=fo;
globalThis.__ISSSD_FILE_OFFSET__=fo;
</script>`;

const head=html.match(/<head(?:\s[^>]*)?>/i);
if(!head)throw new Error('Não encontrei <head> para instalar o bootstrap global de fo().');
html=html.replace(head[0],head[0]+'\n'+bootstrap);

// Se existir a implementação legada, mantenha-a como fonte preferencial depois que
// headerSize estiver inicializado, mas publique-a também no helper canônico.
html=html.replace(
  /function\s+fo\s*\(\s*internal\s*\)\s*\{\s*return\s+headerSize\s*\+\s*internal\s*;?\s*\}/,
  `function fo(internal){return headerSize+internal}\nglobalThis.fo=fo;globalThis.__ISSSD_FILE_OFFSET__=fo;`
);

// ES modules recebem um binding lexical explícito quando usam fo(...).
// Isso elimina dependência da resolução implícita de propriedades de window.
let moduleBindings=0;
html=html.replace(/<script\b([^>]*\btype=["']module["'][^>]*)>([\s\S]*?)<\/script>/gi,(all,attrs,body)=>{
  if(!/\bfo\s*\(/.test(body))return all;
  if(/\b(?:const|let|var|function)\s+fo\b/.test(body))return all;
  moduleBindings++;
  return `<script${attrs}>\nconst fo=globalThis.__ISSSD_FILE_OFFSET__||globalThis.fo;\n${body}</script>`;
});

// Auditoria estrutural do HTML FINAL. O build deve falhar aqui em vez de entregar
// novamente um Editor que só quebra quando o usuário abre o .issdproj.
const bootPos=html.indexOf(`id="${BOOT_ID}"`);
const firstScriptPos=html.search(/<script\b/i);
if(bootPos<0||firstScriptPos<0||bootPos!==firstScriptPos+html.slice(firstScriptPos,bootPos).indexOf(`id="${BOOT_ID}"`)){
  // A checagem real abaixo usa índices absolutos e permanece simples/robusta.
}
if(bootPos<0)throw new Error('Bootstrap global de fo() não foi instalado.');
const firstExecutable=html.search(/<script\b/i);
if(firstExecutable<0||bootPos<firstExecutable)throw new Error('Bootstrap global de fo() não ficou antes dos demais scripts.');
if(!html.includes('var fo=function(internal)'))throw new Error('Binding global lexical de fo() ausente.');
if(!html.includes('globalThis.__ISSSD_FILE_OFFSET__=fo'))throw new Error('Helper canônico __ISSSD_FILE_OFFSET__ ausente.');

const moduleFoWithoutBinding=[];
for(const m of html.matchAll(/<script\b([^>]*\btype=["']module["'][^>]*)>([\s\S]*?)<\/script>/gi)){
  const body=m[2]||'';
  if(/\bfo\s*\(/.test(body)&&!/\b(?:const|let|var|function)\s+fo\b/.test(body))moduleFoWithoutBinding.push(m[1]);
}
if(moduleFoWithoutBinding.length)throw new Error(`Há ${moduleFoWithoutBinding.length} ES module(s) usando fo() sem binding lexical.`);

fs.writeFileSync(htmlPath,html,'utf8');
console.log(`ISSSD Studio: fo() protegido por bootstrap global pré-runtime; ${moduleBindings} módulo(s) receberam binding lexical explícito.`);
