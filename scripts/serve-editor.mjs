import {pendingTextExportReport} from '../src/core/additional-screen-text-fields.mjs';
import os from 'node:os';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {ZipFile} from '../src/platform/zip-file.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exec,spawnSync} from 'node:child_process';
import {validatePlusRuntimeMirrors} from '../src/core/plus-export-finalizer.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const editorRoot=path.join(root,'editor');
const diagnosticsRoot=path.join(root,'build-diagnostics');
const port=Number(process.env.ISSSD_PORT||4173);
let listeningPort=port,portRetries=0;
const gitHead=spawnSync('git',['rev-parse','--short=12','HEAD'],{cwd:root,encoding:'utf8',shell:false});
const serverBuild={commit:gitHead.status===0?gitHead.stdout.trim():'local',root,startedAt:new Date().toISOString(),supportedTextWriters:['strategy-one-four','uniform-labels','team-names','match-announcements']};
const defaultPlusRomPath=process.env.ISSSD_PLUS_ROM_PATH||'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms\\International Superstar Soccer Deluxe Plus.sfc';
const defaultPlusRomName=path.basename(defaultPlusRomPath);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
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
  pendingTextChanges:result.pendingTextChanges,
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
   if(payload.cumulative===true){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-export-'));
    const zipPath=path.join(dir,'ISSSD-ROMs-cumulativas.zip');
    const zip=new ZipFile(zipPath);
    const cleanup=()=>{zip.close();fs.rmSync(dir,{recursive:true,force:true});};
    try{
     const manifest=buildCumulativeProject(base,project,{selectedAreas:payload.selectedAreas,titleGraphics:payload.titleGraphics,onRom:(rom,entry)=>zip.add(entry.name,rom)});
     const pendingReport=pendingTextExportReport(manifest.pendingTextChanges);
     if(pendingReport)zip.add('TEXTOS-PENDENTES.txt',Buffer.from(pendingReport));
     zip.add('indice.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
     zip.add('LEIA-ME.txt',Buffer.from('ROMs cumulativas das fases marcadas, em ordem fixa:\n01 Infraestrutura; 02 Metadados; 03 Tela Inicial; 04 Menu Principal; 05 Pré-Partida; 06 Textos de Estratégias; 07 Seleção de equipes; 08 Jogadores; 09 Formações.\nFases desmarcadas não são aplicadas nem geram ROM. Lacunas na numeração são intencionais.\nA preparação de 4 MiB/individualização é obrigatória em todos os arquivos.\nConsulte indice.json para fases selecionadas, alterações e dados legados sem área confirmada.\n'+(pendingReport?'ATENÇÃO: '+manifest.pendingTextChanges.length+' novos textos NÃO foram aplicados. Consulte TEXTOS-PENDENTES.txt.\n':'')));
     zip.finish();
     res.writeHead(200,{'Content-Type':'application/zip','Content-Length':fs.statSync(zipPath).size,'Cache-Control':'no-store','X-ISSSD-Builder':'plus-build-pipeline-v1','X-ISSSD-Mirrors':'ok','X-ISSSD-Archive':'cumulative-v1','X-ISSSD-ROM-Count':String(manifest.entries.length),'X-ISSSD-Pending-Text-Count':String(manifest.pendingTextChanges.length),'X-ISSSD-Export-Status':manifest.allSelectedChangesApplied?'complete':'partial'});
     const stream=fs.createReadStream(zipPath);res.on('close',()=>stream.destroy());stream.on('close',cleanup);stream.on('error',()=>res.destroy()).pipe(res);return;
    }catch(e){cleanup();throw e;}
   }
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
    'X-ISSSD-Pending-Text-Count':String(result.pendingTextChanges.length),
    'X-ISSSD-Export-Status':result.allSelectedChangesApplied?'complete':'partial',
    'X-ISSSD-Mirrors':'ok'
   });
   res.end(body);
  }catch(error){jsonError(res,422,error);}
 });
}

const server=http.createServer((req,res)=>{
 let u=decodeURIComponent((req.url||'/').split('?')[0]);
 if(req.method==='POST'&&u==='/__isssd/build-plus-project'){buildPostedProject(req,res);return;}
 if(req.method!=='GET'){res.writeHead(405,{'Allow':'GET, POST'});res.end('Method not allowed');return;}
 if(u==='/__isssd/build-info'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(serverBuild));return;}
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
  if(path.extname(target).toLowerCase()==='.html'){
   // The visible stamp identifies BOTH the served file and the backend used by export.
   const stamp='<div id="isssd-active-server" style="position:fixed;bottom:4px;right:8px;z-index:2147483647;background:#152131;color:#fff;padding:5px 9px;border:1px solid #7e9ab5;border-radius:4px;font:12px sans-serif" title="'+root.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">Servidor '+serverBuild.commit+' · textos 1/4 + uniformes ativos</div>';
   const html=fs.readFileSync(target,'utf8').replace('</body>',stamp+'</body>');
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return;
  }
  res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(target).pipe(res);
 });
});

server.on('error',error=>{
 if(error.code==='EADDRINUSE'&&port!==0&&portRetries<10){
  console.warn('Porta '+listeningPort+' ocupada. Iniciando esta versão em outra porta para evitar o servidor antigo.');
  listeningPort++;portRetries++;server.listen(listeningPort,'127.0.0.1');return;
 }
 console.error(error);process.exitCode=1;
});
server.on('listening',()=>{
 const url=`http://127.0.0.1:${server.address().port}/`;
 console.log('ISSSD Studio Editor: '+url);
 console.log('Versão do servidor: '+serverBuild.commit+' · '+root);
 console.log('ROM-base Plus fixa: '+defaultPlusRomPath);
 console.log('Build canônico: POST /__isssd/build-plus-project');
 console.log(fs.existsSync(defaultPlusRomPath)?'ROM-base Plus encontrada; projetos Plus não pedirão seleção manual.':'ATENÇÃO: ROM-base Plus não encontrada no caminho fixo.');
 if(process.env.ISSSD_NO_OPEN!=='1'){
  const cmd=process.platform==='win32'?`start "" "${url}"`:process.platform==='darwin'?`open "${url}"`:`xdg-open "${url}"`;
  exec(cmd,()=>{});
 }
});

server.listen(listeningPort,'127.0.0.1');
