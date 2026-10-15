import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendorBaseline=path.join(root,'.editor-vendor','legacy-ui','ISSSD-Studio.html');
const protectedRoots=[
  '.editor-vendor',
  'roms',
  'project-assets',
  'project-data',
  'project-recovery',
  'project-source',
  'recovery',
  'imagens'
];

function sha256(file){
  const h=crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}

function walkFiles(start){
  if(!fs.existsSync(start))return [];
  const st=fs.statSync(start);
  if(st.isFile())return [start];
  const out=[];
  const stack=[start];
  while(stack.length){
    const dir=stack.pop();
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory())stack.push(full);
      else if(entry.isFile())out.push(full);
    }
  }
  return out;
}

function protectedFiles(){
  const files=[];
  for(const rel of protectedRoots)files.push(...walkFiles(path.join(root,rel)));
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    if(entry.isFile()&&entry.name.toLowerCase().endsWith('.issdproj'))files.push(path.join(root,entry.name));
  }
  return [...new Set(files)].sort((a,b)=>a.localeCompare(b));
}

function snapshot(){
  const map=new Map();
  for(const file of protectedFiles()){
    const rel=path.relative(root,file).replaceAll(path.sep,'/');
    const st=fs.statSync(file);
    map.set(rel,{size:st.size,sha256:sha256(file)});
  }
  return map;
}

function diffSnapshots(before,after){
  const keys=new Set([...before.keys(),...after.keys()]);
  const changes=[];
  for(const key of [...keys].sort()){
    const a=before.get(key),b=after.get(key);
    if(!a)changes.push({path:key,kind:'created'});
    else if(!b)changes.push({path:key,kind:'deleted'});
    else if(a.size!==b.size||a.sha256!==b.sha256)changes.push({path:key,kind:'modified'});
  }
  return changes;
}

function run(cmd,args,label){
  console.log(`\n== ${label} ==`);
  const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit',shell:false});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error(`${label} falhou com código ${r.status}.`);
}

function runNpm(args,label){
  const npmCli=process.env.npm_execpath;
  if(!npmCli||!fs.existsSync(npmCli)){
    throw new Error('Validação local: npm_execpath não está disponível. Execute este validador por "npm run validate:editor:local".');
  }
  run(process.execPath,[npmCli,...args],label);
}

if(!fs.existsSync(vendorBaseline)){
  throw new Error('Validação local interrompida: .editor-vendor/legacy-ui/ISSSD-Studio.html não existe. Nada foi alterado.');
}

const before=snapshot();
let failure=null;
try{
  const node=process.execPath;
  runNpm(['test'],'1/3 — suíte de regressão');
  runNpm(['run','build:editor'],'2/3 — build completo do Editor com baseline local');
  run(node,['scripts/verify-final-editor-invariants.mjs'],'3/3 — auditoria do HTML final gerado');
}catch(error){
  failure=error;
}

const after=snapshot();
const protectedChanges=diffSnapshots(before,after);
if(protectedChanges.length){
  console.error('\nVALIDAÇÃO REPROVADA: arquivos protegidos foram alterados durante o processo:');
  for(const item of protectedChanges)console.error(`- ${item.kind}: ${item.path}`);
  throw new Error('A validação detectou alteração em .editor-vendor, ROMs, projetos ou diretórios protegidos. Não prossiga para teste manual.');
}

if(failure)throw failure;

const generated=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(generated))throw new Error('Validação local terminou sem gerar editor/ISSSD-Studio.html.');

let head='desconhecido';
try{
  const r=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',shell:false});
  if(r.status===0)head=String(r.stdout||'').trim()||head;
}catch(_){ }

console.log('\nVALIDAÇÃO LOCAL APROVADA');
console.log('  commit: '+head);
console.log('  HTML final: '+generated);
console.log('  SHA-256 HTML: '+sha256(generated));
console.log('  arquivos protegidos: inalterados');
console.log('  nenhum .issdproj foi aberto, migrado ou salvo por esta validação');
