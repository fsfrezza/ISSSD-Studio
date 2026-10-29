import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ZipFile} from '../src/platform/zip-file.mjs';

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const generated=rel=>rel==='node_modules'||rel.startsWith('node_modules/')||rel==='editor/ISSSD-Studio.html';
function files(root,relative=''){
 const out=[];
 for(const e of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
  const rel=relative?relative+'/'+e.name:e.name;
  if(generated(rel))continue;
  if(e.isSymbolicLink())throw Error('Link encontrado; consolidação interrompida antes de excluir pastas: '+path.join(root,rel));
  if(e.isDirectory())out.push(...files(root,rel));
  else if(e.isFile())out.push(rel);
  else throw Error('Tipo de arquivo não suportado: '+rel);
 }
 return out.sort();
}
function readExact(fd,length,position){
 const b=Buffer.alloc(length);let done=0;
 while(done<length){const n=fs.readSync(fd,b,done,length-done,position+done);if(!n)throw Error('ZIP incompleto');done+=n;}
 return b;
}
function verifyArchive(zipPath,entries){
 const fd=fs.openSync(zipPath,'r');
 try{for(const e of entries){
  const header=readExact(fd,30,e.offset);
  if(header.readUInt32LE(0)!==0x04034b50)throw Error('Cabeçalho ZIP inválido');
  const nameLength=header.readUInt16LE(26),extraLength=header.readUInt16LE(28);
  const name=readExact(fd,nameLength,e.offset+30).toString('utf8');
  const packed=readExact(fd,header.readUInt32LE(18),e.offset+30+nameLength+extraLength);
  if(name!==e.name||sha(inflateRawSync(packed))!==e.sha256)throw Error('Falha na verificação do backup: '+e.name);
 }}finally{fs.closeSync(fd);}
}
export function consolidateInstallations(parent,{build=true}={}){
 parent=path.resolve(parent);
 const source=path.join(parent,'ISSSD-Studio-Atualizado'),target=path.join(parent,'ISSSD-Studio-UNIFICADO');
 if(!fs.existsSync(source))throw Error('Pasta Atualizado ausente. Nada foi removido.');
 for(const p of [source,target,path.join(parent,'ISSSD-Studio')])if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('A instalação não pode ser um link: '+p);
 for(const rel of ['package.json','scripts/build-editor.mjs','.editor-vendor/legacy-ui/ISSSD-Studio.html'])if(!fs.existsSync(path.join(source,rel)))throw Error('Instalação Atualizado incompleta: '+rel);
 files(source);
 if(fs.existsSync(path.join(source,'.git'))&&!fs.statSync(path.join(source,'.git')).isDirectory())throw Error('Atualizado usa um worktree externo. Consolidação automática interrompida.');
 const olds=[target,path.join(parent,'ISSSD-Studio')].filter(p=>fs.existsSync(p));
 // Inventory everything before the first change. Refuse links/junctions rather
 // than accidentally traversing or deleting data outside these three roots.
 const inventories=olds.map(root=>({root,list:files(root)}));
 const romRel='roms/International Superstar Soccer Deluxe Plus.sfc',romPath=path.join(source,romRel);
 if(!fs.existsSync(romPath)){
  const donor=olds.map(p=>path.join(p,romRel)).find(p=>fs.existsSync(p));
  if(!donor)throw Error('ROM-base Plus ausente nas três pastas. Nada foi removido.');
  fs.mkdirSync(path.dirname(romPath),{recursive:true});fs.copyFileSync(donor,romPath,fs.constants.COPYFILE_EXCL);
  if(sha(fs.readFileSync(romPath))!==sha(fs.readFileSync(donor)))throw Error('Cópia da ROM-base não conferiu.');
 }
 if(build){
  const npm=process.env.npm_execpath;
  const resultFull=npm?spawnSync(process.execPath,[npm,'run','build:editor'],{cwd:source,stdio:'inherit'}):spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','build:editor'],{cwd:source,stdio:'inherit',shell:process.platform==='win32'});
  if(resultFull.status!==0)throw Error('Validação do Editor falhou. Pastas antigas preservadas.');
 }
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const recovery=path.join(source,'recovery','consolidacao-'+stamp);fs.mkdirSync(recovery,{recursive:true});
 const zipPath=path.join(recovery,'arquivos-exclusivos.zip'),zip=new ZipFile(zipPath),entries=[],records=[];
 try{
  for(const {root,list}of inventories)for(const rel of list){
   const bytes=fs.readFileSync(path.join(root,rel)),hash=sha(bytes),current=path.join(source,rel);
   // Always preserve complete old Git metadata, even when individual objects
   // also exist in the active repository: its refs/index/logs must remain usable.
   const same=!rel.startsWith('.git/')&&fs.existsSync(current)&&fs.statSync(current).isFile()&&sha(fs.readFileSync(current))===hash;
   const record={installation:path.basename(root),path:rel,sha256:hash,stored:same?'current':'archive'};
   if(!same){const name=path.basename(root)+'/'+rel,offset=zip.offset;zip.add(name,bytes);entries.push({name,offset,sha256:hash});record.archiveEntry=name;}
   records.push(record);
  }
  zip.finish();
 }catch(e){zip.close();throw e;}
 verifyArchive(zipPath,entries);
 // Check that sources and every reused current file still match the snapshot.
 // No old installation can be removed if anything changed during the copy.
 for(const r of records){
  if(sha(fs.readFileSync(path.join(parent,r.installation,r.path)))!==r.sha256)throw Error('Arquivo mudou durante a consolidação: '+r.path);
  if(r.stored==='current'&&sha(fs.readFileSync(path.join(source,r.path)))!==r.sha256)throw Error('Arquivo atual mudou durante a consolidação: '+r.path);
 }
 for(const {root,list}of inventories)if(JSON.stringify(files(root))!==JSON.stringify(list))throw Error('A pasta mudou durante a consolidação: '+root);
 fs.writeFileSync(path.join(recovery,'manifesto.json'),JSON.stringify({version:1,source:path.basename(source),target:path.basename(target),excluded:['node_modules (reinstalável)','editor/ISSSD-Studio.html (gerado pelo build)'],records},null,2));
 if(fs.existsSync(target))fs.rmSync(target,{recursive:true});
 fs.renameSync(source,target);
 for(const root of olds)if(root!==target)fs.rmSync(root,{recursive:true});
 console.log('\nConsolidação concluída: '+target);
 console.log('Arquivos exclusivos preservados em: '+path.join(target,path.relative(source,recovery)));
 console.log('Foram removidas as instalações antigas, dependências duplicadas e HTMLs gerados antigos.');
 return {target,records,archived:entries.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const parent=process.argv[2];
 if(!parent)throw Error('Uso: node scripts/consolidate-installations.mjs <pasta Downloads>');
 const here=path.resolve(process.cwd());
 if(['ISSSD-Studio','ISSSD-Studio-Atualizado','ISSSD-Studio-UNIFICADO'].some(n=>here===path.join(path.resolve(parent),n)||here.startsWith(path.join(path.resolve(parent),n)+path.sep)))throw Error('Execute a partir de Downloads, fora das três instalações, depois de encerrar os servidores com Ctrl+C.');
 consolidateInstallations(parent);
}
