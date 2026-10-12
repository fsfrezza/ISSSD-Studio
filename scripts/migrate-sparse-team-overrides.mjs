import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const projectPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const backupPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.before-sparse-overrides.issdproj');
const romPath=path.join(root,'roms','International Superstar Soccer Deluxe Plus.sfc');
if(!fs.existsSync(projectPath))throw new Error('Projeto canônico Plus não encontrado: '+projectPath);
if(!fs.existsSync(romPath))throw new Error('ROM-base Plus não encontrada: '+romPath);

const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const rom=fs.readFileSync(romPath);
const header=(rom.length%0x8000===0x200)?0x200:0;
const sem=project?.state?.semantic||(project.state.semantic={});
const src=sem.teamsV1;
if(!src||src.schema!=='isssd-teams-v1'||Number(src.version)!==3||!src.teams){
 console.log('Sparse overrides: teamsV1 v3 ausente; nada a migrar.');
 process.exit(0);
}

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const has=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
const POS=['NONE','GO','DF','DF-MF','MF','MF-FW','FW'];
const POSITION_ALIAS={NONE:'NONE',GO:'GO',GK:'GO',DF:'DF','DF-MF':'DF-MF',VOL:'DF-MF',MF:'MF',MC:'MF','MF-FW':'MF-FW',MO:'MF-FW',FW:'FW',AT:'FW'};
const normalizePosition=v=>POSITION_ALIAS[String(v??'NONE').trim().toUpperCase()]||String(v??'NONE').trim().toUpperCase();
const skillKeys=['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'];
const decodeAttr=(team,slot)=>{
 const i=Number(slot)-1,t=Number(team),off=header+0x150000+(t*20+i)*7;
 if(!Number.isInteger(t)||t<0||t>=56||!Number.isInteger(i)||i<0||i>=20||off+7>rom.length)return null;
 const b=Array.from(rom.subarray(off,off+7));
 return {number:b[5]+1,position:POS[(b[4]>>4)&15]||'NONE',skills:{acceleration:(b[0]>>4)+1,speed:(b[0]&15)+1,shot:(b[1]>>4)+1,curve:(b[1]&15)+1,balance:(b[2]>>4)+1,intelligence:(b[2]&15)+1,dribbling:(b[3]>>4)+1,jump:(b[3]&15)+1,energy:(b[4]&15)+1},appearance:{hair:Math.min(13,(b[6]>>4)&15),palette:b[6]&1}};
};

function cleanCustom(c){
 if(!c||typeof c!=='object')return null;
 const out={};
 for(const k of ['name','nameHex','number'])if(has(c,k))out[k]=clone(c[k]);
 if(has(c,'position'))out.position=normalizePosition(c.position);
 if(c.skills&&typeof c.skills==='object'){const s={};for(const k of skillKeys)if(has(c.skills,k))s[k]=c.skills[k];if(Object.keys(s).length)out.skills=s}
 if(c.appearance&&typeof c.appearance==='object'){const a={};for(const k of ['hair','palette'])if(has(c.appearance,k))a[k]=c.appearance[k];if(Object.keys(a).length)out.appearance=a}
 if(c.tactical&&typeof c.tactical==='object'){const t={};for(const k of ['x','y','className','attack'])if(has(c.tactical,k))t[k]=c.tactical[k];if(Object.keys(t).length)out.tactical=t}
 return Object.keys(out).length?out:null;
}

function customFromFullPlayer(p,teamId,baseSlot){
 if(p?.custom&&typeof p.custom==='object')return cleanCustom(p.custom);
 const fs=p?.fieldState||{},base=decodeAttr(teamId,baseSlot)||{},out={};
 const take=(flag,value,baseValue,canCompare=true)=>flag==='custom'||(flag==null&&value!==undefined&&(!canCompare||!same(value,baseValue)));
 if(take(fs.name,p?.name,undefined,false)){out.name=p.name;if(p?.nameHex)out.nameHex=p.nameHex}
 if(take(fs.number,p?.number,base.number))out.number=p.number;
 const pos=p?.position!==undefined?normalizePosition(p.position):undefined;
 if(take(fs.position,pos,base.position))out.position=pos;
 const skills={};for(const k of skillKeys)if(take(fs?.skills?.[k],p?.skills?.[k],base.skills?.[k]))skills[k]=p.skills[k];if(Object.keys(skills).length)out.skills=skills;
 const appearance={};for(const k of ['hair','palette'])if(take(fs?.appearance?.[k],p?.appearance?.[k],base.appearance?.[k]))appearance[k]=p.appearance[k];if(Object.keys(appearance).length)out.appearance=appearance;
 const tactical={};for(const k of ['x','y','className','attack'])if(take(fs?.tactical?.[k],p?.tactical?.[k],undefined,false))tactical[k]=p.tactical[k];if(Object.keys(tactical).length)out.tactical=tactical;
 return Object.keys(out).length?out:null;
}

function teamCustomFromFull(ts){
 if(ts?.custom&&typeof ts.custom==='object'){
  const out={};if(has(ts.custom,'teamName'))out.teamName=ts.custom.teamName;if(ts.custom.formation&&has(ts.custom.formation,'index'))out.formation={index:ts.custom.formation.index};return Object.keys(out).length?out:null;
 }
 const fs=ts?.fieldState||{},out={};
 if(fs.teamName==='custom')out.teamName=ts.teamName;
 if(fs?.formation?.index==='custom')out.formation={index:ts?.formation?.index};
 if(fs?.formation?.index==null&&ts?.formation?.index!=null&&src.mode!=='sparse-overrides')out.formation={index:ts.formation.index};
 return Object.keys(out).length?out:null;
}

function baseSlotFor(teamId,p,slot){
 const direct=Number(p?.baseSlot);if(Number.isInteger(direct)&&direct>=1&&direct<=20)return direct;
 const m=String(p?.playerId||'').match(/^(\d+):(\d+)$/);if(m&&Number(m[1])===teamId){const n=Number(m[2]);if(n>=1&&n<=20)return n}
 return slot;
}

const out={schema:'isssd-teams-v1',version:3,mode:'sparse-overrides',identityModel:'player-id-v1',teams:{}};
let customPlayers=0,customFields=0;
for(const [id,ts] of Object.entries(src.teams||{})){
 const teamId=Number(ts?.teamId??id);if(!Number.isInteger(teamId))continue;
 const entry={teamId,players:[]},tc=teamCustomFromFull(ts);if(tc){entry.custom=tc;customFields+=Object.keys(tc).length}
 const players=Array.isArray(ts?.players)?ts.players:[];
 const max=Math.max(20,players.length);
 for(let i=0;i<max;i++){
  const slot=i+1,p=players.find(x=>Number(x?.slot)===slot)||players[i]||null;
  const baseSlot=baseSlotFor(teamId,p,slot),row={playerId:`${teamId}:${baseSlot}`,baseSlot,slot};
  if(p){const c=customFromFullPlayer(p,teamId,baseSlot);if(c){row.custom=c;customPlayers++;customFields+=Object.keys(c).length}}
  entry.players.push(row);
 }
 out.teams[String(teamId)]=entry;
}

if(src.mode!=='sparse-overrides'&&!fs.existsSync(backupPath)){
 fs.copyFileSync(projectPath,backupPath);
 console.log('Sparse overrides: backup criado em '+backupPath);
}
sem.teamsV1=out;
sem.teamsOverrideModelV1={schema:'isssd-teams-override-model-v1',version:1,mode:'sparse-overrides',identityModel:'player-id-v1',originalSource:'immutable-base-rom',rule:'field-present-means-override; field-absent-means-preserve-rom'};
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log(`Sparse overrides: projeto migrado com player-id-v1; ${customPlayers} jogador(es) com customização, ${customFields} grupo(s)/campo(s) customizados; posições normalizadas para GO/DF/DF-MF/MF/MF-FW/FW.`);
