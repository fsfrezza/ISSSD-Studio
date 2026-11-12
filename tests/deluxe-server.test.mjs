import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('página raiz carrega o módulo real e todas as dependências pelo HTTP',{timeout:15000},async()=>{
 const port=22000+Math.floor(Math.random()*20000),origin='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['scripts/serve-deluxe.mjs'],{cwd:root,env:{...process.env,ISSSD_DELUXE_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Servidor encerrou: '+code)));});
  const res=await fetch(origin+'/');assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/text\/html/);
  const html=await res.text();const entry=html.match(/import\(['"]([^'"]+)['"]\)/)?.[1];assert.ok(entry,'bootstrap deve importar a aplicação');
  assert.match(html,/\.catch\(error/,'falha de inicialização deve aparecer na tela');
  const css=await fetch(origin+'/deluxe-editor/style.css');assert.equal(css.status,200);assert.match(css.headers.get('content-type'),/text\/css/);
  const imagePath=html.match(/<img[^>]+class="brand-logo"[^>]+src="([^"]+)"/)?.[1];
  assert.ok(imagePath,'Visão geral deve referenciar a imagem integrada');
  const image=await fetch(origin+imagePath);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');
  assert.deepEqual([...new Uint8Array(await image.arrayBuffer()).slice(0,8)],[137,80,78,71,13,10,26,10]);
  for(const name of ['galvao','fb96']){const preset=await fetch(origin+'/deluxe-editor/'+name+'-samples.json');assert.equal(preset.status,200);assert.equal(Object.keys((await preset.json()).samples).length,74);}
  const queue=[...html.matchAll(/import\(['"]([^'"]+)['"]\)/g)].map(m=>new URL(m[1],origin+'/').href),seen=new Set();
  while(queue.length){const url=queue.shift();if(seen.has(url))continue;seen.add(url);
   const response=await fetch(url);assert.equal(response.status,200,url);assert.match(response.headers.get('content-type'),/javascript/,url);
   const js=await response.text();
   for(const match of js.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g))if(match[1].startsWith('.'))queue.push(new URL(match[1],url).href);
  }
  assert.ok(seen.size>10,'testar grafo de módulos, não somente HTML');
 }finally{child.kill();}
});
