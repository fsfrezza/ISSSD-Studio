import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const projectPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const backupPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.before-native-tactics.issdproj');
if(!fs.existsSync(projectPath))throw new Error('Projeto canônico Plus não encontrado: '+projectPath);

const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const dangerous=new Map([
 [0x2AA8E,[0x22,0x00,0x82,0xC0,0xEA]],
 [0x2B166,[0x22,0x10,0x82,0xC0,0xEA]],
 [0x3193A,[0x22,0x20,0x82,0xC0,0xEA]],
]);

function decodeHistoricalRleBase64(p){
 if(p?.encoding!=='rle-base64'||typeof p?.data!=='string'||!Number.isInteger(Number(p?.len)))return null;
 const a=Buffer.from(p.data.replace(/\s+/g,''),'base64'),out=[];let i=0;
 while(i<a.length&&out.length<Number(p.len)){
  const c=a[i++],count=(c&0x7F)+1;
  if(c&0x80){if(i>=a.length)return null;const v=a[i++];for(let j=0;j<count;j++)out.push(v)}
  else{for(let j=0;j<count&&i<a.length;j++)out.push(a[i++])}
 }
 return out.length===Number(p.len)?out:null;
}
function patchBytes(p){
 const rle=decodeHistoricalRleBase64(p);if(rle)return rle;
 const v=p?.bytes??p?.data;
 if(Array.isArray(v))return v.map(Number);
 if(typeof v==='string'&&/^(?:[0-9a-fA-F]{2}\s*)+$/.test(v))return (v.match(/[0-9a-fA-F]{2}/g)||[]).map(x=>parseInt(x,16));
 return null;
}
function isObsoleteLoaderPatch(p){
 const off=Number(p?.off??p?.offset),expected=dangerous.get(off);if(!expected)return false;
 const bytes=patchBytes(p);return Array.isArray(bytes)&&bytes.length===expected.length&&bytes.every((v,i)=>(v&255)===expected[i]);
}
function scrubArray(owner,key){
 if(!Array.isArray(owner?.[key]))return 0;
 const before=owner[key].length;owner[key]=owner[key].filter(p=>!isObsoleteLoaderPatch(p));return before-owner[key].length;
}

let removed=0;
removed+=scrubArray(project,'patches');
removed+=scrubArray(project.state||{},'patches');
removed+=scrubArray(project.state||{},'patchesCompact');
removed+=scrubArray(project.state||{},'legacyPatches');
removed+=scrubArray(project.state||{},'deferredPlayerPatches');
const sem=project?.state?.semantic;
const hadPreparation=!!(sem&&Object.prototype.hasOwnProperty.call(sem,'plusPreparationV1'));
if(sem)delete sem.plusPreparationV1;
const hadTarget=project?.state&&Object.prototype.hasOwnProperty.call(project.state,'targetLength');
if(project?.state)delete project.state.targetLength;

if(!removed&&!hadPreparation&&!hadTarget){
 console.log('Projeto Plus: nenhum patch de loader 4 MiB legado encontrado.');
 process.exit(0);
}
if(!fs.existsSync(backupPath))fs.copyFileSync(projectPath,backupPath);
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log(`Projeto Plus saneado: ${removed} patch(es) JSL de loader 4 MiB removidos; plusPreparationV1=${hadPreparation?'removido':'ausente'}; targetLength=${hadTarget?'removido':'ausente'}.`);
