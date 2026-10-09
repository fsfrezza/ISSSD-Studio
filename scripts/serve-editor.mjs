import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exec} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const editorRoot=path.join(root,'editor');
const port=Number(process.env.ISSSD_PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};

const server=http.createServer((req,res)=>{
 let u=decodeURIComponent((req.url||'/').split('?')[0]);
 if(u==='/')u='/ISSSD-Studio.html';
 const target=path.resolve(editorRoot,'.'+u);
 if(!target.startsWith(editorRoot+path.sep)&&target!==editorRoot){res.writeHead(403);res.end('Forbidden');return;}
 fs.stat(target,(err,st)=>{
  if(err||!st.isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(target).pipe(res);
 });
});

server.listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${port}/`;
 console.log('ISSSD Studio Editor: '+url);
 if(process.env.ISSSD_NO_OPEN!=='1'){
  const cmd=process.platform==='win32'?`start "" "${url}"`:process.platform==='darwin'?`open "${url}"`:`xdg-open "${url}"`;
  exec(cmd,()=>{});
 }
});
