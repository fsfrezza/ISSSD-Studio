import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const BOOT_ID='isssd-global-file-offset-bootstrap';
const BUILD_FIX='fo-callsite-free-v1';
html=html.replace(new RegExp(`<script\\s+id=["']${BOOT_ID}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,'gi'),'');

// v2026-10-11: não dependemos mais da resolução lexical de `fo`.
// O helper canônico consulta o snapshot do core para obter o header atual.
const bootstrap=`<script id="${BOOT_ID}">
(function(){
  'use strict';
  function fileOffset(internal){
    var hs=0;
    try{
      var core=globalThis.__ISSD_CORE__||globalThis.__ISSSD_CORE__||null;
      var snap=core&&typeof core.snapshot==='function'?core.snapshot():null;
      if(snap&&Number.isFinite(Number(snap.headerSize)))hs=Number(snap.headerSize);
      else if(Number.isFinite(Number(globalThis.__ISSSD_HEADER_SIZE__)))hs=Number(globalThis.__ISSSD_HEADER_SIZE__);
    }catch(_){}
    return hs+(Number(internal)||0);
  }
  globalThis.__ISSSD_FILE_OFFSET__=fileOffset;
  globalThis.fo=fileOffset;
  globalThis.__ISSSD_BUILD_FIX__='${BUILD_FIX}';
})();
</script>`;

const head=html.match(/<head(?:\s[^>]*)?>/i);
if(!head)throw new Error('Não encontrei <head> para instalar o helper global de offset.');
html=html.replace(head[0],head[0]+'\n'+bootstrap);

// Protege temporariamente a declaração legada para que a substituição abaixo
// elimine apenas USOS de fo(...), não gere sintaxe inválida na própria declaração.
const LEGACY_TOKEN='/*__ISSSD_LEGACY_FO_DEFINITION__*/';
const legacyRe=/function\s+fo\s*\(\s*internal\s*\)\s*\{\s*return\s+headerSize\s*\+\s*internal\s*;?\s*\}/;
let hadLegacy=false;
html=html.replace(legacyRe,()=>{hadLegacy=true;return LEGACY_TOKEN;});

// Elimina bare calls em TODO o HTML final, inclusive runtimes adicionados pelo pós-build.
// O lookbehind evita propriedades como obj.fo(...), caso existam no futuro.
const bareCallRe=/(?<![A-Za-z0-9_.$])fo\s*\(/g;
let replaced=0;
html=html.replace(bareCallRe,()=>{replaced++;return 'globalThis.__ISSSD_FILE_OFFSET__(';});

if(hadLegacy){
  html=html.replace(LEGACY_TOKEN,"function fo(internal){return globalThis.__ISSSD_FILE_OFFSET__(internal)}\nglobalThis.fo=globalThis.__ISSSD_FILE_OFFSET__;");
}

// Mensagem diagnóstica: se qualquer outro erro ocorrer na abertura, a próxima captura
// mostra stack e marcador do build em vez de esconder a origem com apenas e.message.
html=html.replace(
  'alert("Falha ao abrir projeto: "+(e.message||e));',
  'alert("Falha ao abrir projeto: "+(e.message||e)+"\\n\\nBuild: "+(globalThis.__ISSSD_BUILD_FIX__||"sem-marcador")+"\\n"+(e&&e.stack?e.stack:""));'
);

// Auditoria do ARTEFATO FINAL. Não aceitamos nenhuma chamada bare fo(...).
const bodyWithoutLegacy=html.replace(/function\s+fo\s*\([^)]*\)\s*\{[\s\S]*?\}/g,'');
const leftovers=[...bodyWithoutLegacy.matchAll(/(?<![A-Za-z0-9_.$])fo\s*\(/g)];
if(leftovers.length)throw new Error(`Build inválido: restaram ${leftovers.length} chamada(s) bare fo(...) no HTML final.`);
if(!html.includes(`__ISSSD_BUILD_FIX__='${BUILD_FIX}'`))throw new Error('Marcador do build de correção fo ausente.');
if(!html.includes('globalThis.__ISSSD_FILE_OFFSET__'))throw new Error('Helper canônico __ISSSD_FILE_OFFSET__ ausente.');

fs.writeFileSync(htmlPath,html,'utf8');
console.log(`ISSSD Studio: ${BUILD_FIX}; ${replaced} chamada(s) fo(...) convertidas para helper explícito no HTML final.`);
