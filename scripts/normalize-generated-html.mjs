import fs from 'node:fs';
import {normalizeLegacyScripts} from '../src/ui/normalize-legacy-scripts.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

// 1) O legado possui conteúdo histórico depois de </html>. Reincorpore esse conteúdo
// ao fim do <body>, antes que qualquer outro patch tente injetar runtime adicional.
const closeBody=html.indexOf('</body>');
const closeHtml=html.indexOf('</html>',closeBody>=0?closeBody:0);
if(closeBody<0||closeHtml<0)throw new Error('HTML legado sem </body></html> reconhecível.');
let trailing=html.slice(closeHtml+7);
if(trailing.trim()){
  // Corrige wrappers históricos gravados como texto literal "\\n<script...>\\n".
  trailing=trailing
    .replace(/\\n(?=<script\b)/g,'\n')
    .replace(/\\n(?=<style\b)/g,'\n')
    .replace(/<\/script>\\n/g,'</script>\n')
    .replace(/<\/style>\\n/g,'</style>\n');
  html=html.slice(0,closeBody)+'\n'+trailing.trim()+'\n</body>\n</html>\n';
}

// 2) Corrige a linha JavaScript conhecida que existe fora de qualquer <script> no legado.
const orphan='window.__ISSSD_MAIN_MENU_VERTICAL_OFFSET__=1;';
const wrapped=`<script id="isssd-main-menu-vertical-offset-bootstrap">${orphan}</script>`;
if(html.includes(orphan)&&!html.includes('isssd-main-menu-vertical-offset-bootstrap')){
  html=html.replace(orphan,wrapped);
}

// 3) Remove escapes literais de quebra de linha que vazaram para nós de texto HTML.
// Scripts e styles são preservados byte a byte para não alterar strings JavaScript/CSS.
const protectedBlocks=[];
html=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,block=>{
  const token=`___ISSSD_PROTECTED_BLOCK_${protectedBlocks.length}___`;
  protectedBlocks.push(block);
  return token;
});
html=html
  .replace(/(?:\\n[\t ]*)+/g,' ')
  .replace(/[\t ]{2,}/g,' ')
  .replace(/>\s+&#x20;\s*</gi,'><');
html=html.replace(/___ISSSD_PROTECTED_BLOCK_(\d+)___/g,(_,i)=>protectedBlocks[Number(i)]||'');

// 4) O documento final precisa terminar em </body></html>, sem conteúdo não vazio depois.
const lastHtml=html.lastIndexOf('</html>');
if(lastHtml<0)throw new Error('Normalização HTML: </html> final ausente.');
if(html.slice(lastHtml+7).trim())throw new Error('Normalização HTML: ainda existe conteúdo após </html>.');

// 5) Não aceite os marcadores conhecidos do vazamento como texto órfão.
const bodyEnd=html.lastIndexOf('</body>');
if(bodyEnd<0||bodyEnd>lastHtml)throw new Error('Normalização HTML: ordem </body></html> inválida.');
const tailWindow=html.slice(Math.max(0,bodyEnd-1500),bodyEnd);
if(/(^|>)\s*window\.__ISSSD_MAIN_MENU_VERTICAL_OFFSET__=1;\s*(<|$)/m.test(tailWindow)){
  throw new Error('Normalização HTML: JavaScript órfão de offset ainda está fora de <script>.');
}
if(/Manual técnico\s*(?:\\n\s*)+/i.test(html)){
  throw new Error('Normalização HTML: escapes literais de newline ainda visíveis após “Manual técnico”.');
}

html=normalizeLegacyScripts(html);
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: HTML legado normalizado — conteúdo pós-</html> movido para <body>, JavaScript órfão encapsulado e escapes literais de newline visíveis removidos.');
