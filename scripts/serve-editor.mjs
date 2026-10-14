import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exec} from 'node:child_process';
import {finalizePlusRomForExport,validatePlusRuntimeMirrors} from '../src/core/plus-export-finalizer.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const editorRoot=path.join(root,'editor');
const diagnosticsRoot=path.join(root,'build-diagnostics');
const port=Number(process.env.ISSSD_PORT||4173);
const defaultPlusRomPath='C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms\\International Superstar Soccer Deluxe Plus.sfc';
const defaultPlusRomName=path.basename(defaultPlusRomPath);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const MAX_ROM_BODY=0x400200;
const MAX_PROJECT_BODY=64*1024*1024;

function jsonError(res,status,error){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 res.end(JSON.stringify({ok:false,error:error?.message||String(error)}));
}

function collectBody(req,res,maxBytes,onDone){
 const chunks=[];let total=0,aborted=false;
 req.on('data',chunk=>{
  if(aborted)return;
  total+=chunk.length;
  if(total>maxBytes){aborted=true;jsonError(res,413,'Corpo da requisição excede o tamanho permitido');req.destroy();return;}
  chunks.push(chunk);
 });
 req.on('end',()=>{if(!aborted&&!res.writableEnded)onDone(Buffer.concat(chunks));});
 req.on('error',error=>{if(!res.writableEnded)jsonError(res,500,error);});
}

function serveDefaultPlusRom(res){
 fs.stat(defaultPlusRomPath,(err,st)=>{
  if(err||!st.isFile()){jsonError(res,404,'ROM-base Plus não encontrada: '+defaultPlusRomPath);return;}
  res.writeHead(200,{
   'Content-Type':'application/octet-stream','Content-Length':st.size,
   'Content-Disposition':`inline; filename="${defaultPlusRomName}"`,
   'X-ISSSD-ROM-Name':encodeURIComponent(defaultPlusRomName),'Cache-Control':'no-store'
  });
  fs.createReadStream(defaultPlusRomPath).pipe(res);
 });
}

function finalizePostedRom(req,res){
 collectBody(req,res,MAX_ROM_BODY,buffer=>{
  try{
   const input=Uint8Array.from(buffer);
   const {rom,checksum}=finalizePlusRomForExport(input);
   if(!validatePlusRuntimeMirrors(rom))throw new Error('validação de mirrors falhou no servidor');
   const body=Buffer.from(rom.buffer,rom.byteOffset,rom.byteLength);
   res.writeHead(200,{
    'Content-Type':'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store',
    'X-ISSSD-Finalizer':'plus-export-v1','X-ISSSD-Mirrors':'ok',
    'X-ISSSD-Checksum':checksum.checksum.toString(16).padStart(4,'0').toUpperCase()
   });
   res.end(body);
  }catch(error){jsonError(res,422,error);}
 });
}

function safeDiagnosticId(){
 return new Date().toISOString().replace(/[:.]/g,'-');
}

function writeDiagnostics(result){
 const id=safeDiagnosticId();
 const dir=path.join(diagnosticsRoot,id);
 fs.mkdirSync(dir,{recursive:true});
 for(const checkpoint of result.checkpoints||[]){
  const filename=checkpoint.id.replace(/[^a-zA-Z0-9._-]+/g,'_')+'.sfc';
  fs.writeFileSync(path.join(dir,filename),Buffer.from(checkpoint.rom));
 }
 const report={
  schema:'isssd-build-report-v1',
  pipeline:result.buildPipeline,
  finalSize:result.rom.length,
  lastSuccessfulStage:result.lastSuccessfulStage,
  stages:result.report,
  finalDiff:result.diff,
 };
 fs.writeFileSync(path.join(dir,'build-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
 return {id,dir};
}

function buildPostedProject(req,res){
 collectBody(req,res,MAX_PROJECT_BODY,buffer=>{
  try{
   if(!fs.existsSync(defaultPlusRomPath))throw new Error('ROM-base Plus não encontrada: '+defaultPlusRomPath);
   const payload=JSON.parse(buffer.toString('utf8'));
   const project=payload?.project;
   if(!project||typeof project!=='object'||Array.isArray(project))throw new TypeError('Projeto .issdproj inválido ou ausente');
   const diagnostic=payload?.diagnostic===true;
   const base=Uint8Array.from(fs.readFileSync(defaultPlusRomPath));
   const result=buildPlusProjectRom(base,project,{keepCheckpoints:diagnostic,writeChecksum:true});
   if(result.rom.length!==0x400000)throw new Error(`Pipeline Plus produziu tamanho inválido: ${result.rom.length} bytes`);
   if(!validatePlusRuntimeMirrors(result.rom))throw new Error('Pipeline terminou com mirrors de runtime inconsistentes');
   const diagnosticInfo=diagnostic?writeDiagnostics(result):null;
   const body=Buffer.from(result.rom.buffer,result.rom.byteOffset,result.rom.byteLength);
   res.writeHead(200,{
    'Content-Type':'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store',
    'X-ISSSD-Builder':'plus-build-pipeline-v1',
    'X-ISSSD-Stages':String(result.report.length),
    'X-ISSSD-Last-Stage':encodeURIComponent(result.lastSuccessfulStage||''),
    'X-ISSSD-Diagnostics':diagnosticInfo?encodeURIComponent(diagnosticInfo.dir):'off',
    'X-ISSSD-Mirrors':'ok'
   });
   res.end(body);
  }catch(error){jsonError(res,422,error);}
 });
}

const server=http.createServer((req,res)=>{
 let u=decodeURIComponent((req.url||'/').split('?')[0]);
 if(req.method==='POST'&&u==='/__isssd/build-plus-project'){buildPostedProject(req,res);return;}
 if(req.method==='POST'&&u==='/__isssd/finalize-plus-rom'){finalizePostedRom(req,res);return;}
 if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET, POST'});res.end('Method not allowed');return;}
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
 console.log('Build canônico: POST /__isssd/build-plus-project');
 console.log('Finalizador legado de compatibilidade: POST /__isssd/finalize-plus-rom');
 console.log(fs.existsSync(defaultPlusRomPath)?'ROM-base Plus encontrada; projetos Plus não pedirão seleção manual.':'ATENÇÃO: ROM-base Plus não encontrada no caminho fixo.');
 if(process.env.ISSSD_NO_OPEN!=='1'){
  const cmd=process.platform==='win32'?`start "" "${url}"`:process.platform==='darwin'?`open "${url}"`:`xdg-open "${url}"`;
  exec(cmd,()=>{});
 }
});
