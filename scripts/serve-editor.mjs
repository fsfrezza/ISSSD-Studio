import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exec} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const editorRoot=path.join(root,'editor');
const port=Number(process.env.ISSSD_PORT||4173);
const defaultPlusRomPath='C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms\\International Superstar Soccer Deluxe Plus.sfc';
const defaultPlusRomName=path.basename(defaultPlusRomPath);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};

function serveDefaultPlusRom(res){
 fs.stat(defaultPlusRomPath,(err,st)=>{
  if(err||!st.isFile()){
   res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
   res.end(JSON.stringify({ok:false,error:'ROM-base Plus não encontrada',path:defaultPlusRomPath}));
   return;
  }
  res.writeHead(200,{
   'Content-Type':'application/octet-stream',
   'Content-Length':st.size,
   'Content-Disposition':`inline; filename="${defaultPlusRomName}"`,
   'X-ISSSD-ROM-Name':encodeURIComponent(defaultPlusRomName),
   'Cache-Control':'no-store'
  });
  fs.createReadStream(defaultPlusRomPath).pipe(res);
 });
}

const server=http.createServer((req,res)=>{
 let u=decodeURIComponent((req.url||'/').split('?')[0]);
 if(u==='/__isssd/default-plus-rom'){serveDefaultPlusRom(res);return;}
 if(u==='/__isssd/default-plus-rom-info'){
  const exists=fs.existsSync(defaultPlusRomPath);
  res.writeHead(exists?200:404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify({ok:exists,path:defaultPlusRomPath,name:defaultPlusRomName}));
  return;
 }
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
 console.log('ROM-base Plus fixa: '+defaultPlusRomPath);
 console.log(fs.existsSync(defaultPlusRomPath)?'ROM-base Plus encontrada; projetos Plus não pedirão seleção manual.':'ATENÇÃO: ROM-base Plus não encontrada no caminho fixo.');
 if(process.env.ISSSD_NO_OPEN!=='1'){
  const cmd=process.platform==='win32'?`start "" "${url}"`:process.platform==='darwin'?`open "${url}"`:`xdg-open "${url}"`;
  exec(cmd,()=>{});
 }
});
