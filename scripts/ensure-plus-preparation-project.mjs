import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const projectPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const historicalPath=path.join(root,'project-data','historical-national-teams-v1.json');
const romPath=path.join(root,'roms','International Superstar Soccer Deluxe Plus.sfc');
if(!fs.existsSync(projectPath))throw new Error('Projeto canônico Plus não encontrado: '+projectPath);
if(!fs.existsSync(historicalPath))throw new Error('Dados históricos de Brasil/Argentina/Alemanha não encontrados: '+historicalPath);
if(!fs.existsSync(romPath))throw new Error('ROM-base Plus não encontrada para migração de atributos: '+romPath);

const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const historical=JSON.parse(fs.readFileSync(historicalPath,'utf8'));
const baseRom=fs.readFileSync(romPath);
const baseHeader=(baseRom.length%0x8000===0x200)?0x200:0;
if(project?.base?.profile!=='iss-deluxe-plus')throw new Error('O projeto canônico não é do perfil iss-deluxe-plus.');
if(historical?.schema!=='isssd-historical-national-teams-v1')throw new Error('Schema histórico de seleções inválido.');

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const isHex=(v,n)=>new RegExp(`^[0-9A-F]{${n*2}}$`,'i').test(String(v||''));
const POS=['NONE','GO','DF','VOL','MC','MO','AT'];
const skillKeys=['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'];
const decodeAttrHex=hex=>{
 const b=Array.from(Buffer.from(hex,'hex'));
 return {number:b[5]+1,position:POS[(b[4]>>4)&15]||'NONE',skills:{acceleration:(b[0]>>4)+1,speed:(b[0]&15)+1,shot:(b[1]>>4)+1,curve:(b[1]&15)+1,balance:(b[2]>>4)+1,intelligence:(b[2]&15)+1,dribbling:(b[3]>>4)+1,jump:(b[3]&15)+1,energy:(b[4]&15)+1},appearance:{hair:Math.min(13,(b[6]>>4)&15),palette:b[6]&1}};
};
const semanticAttr=p=>{
 if(!p||typeof p!=='object')return null;
 const number=Number(p.number),position=String(p.position||'').toUpperCase(),hair=Number(p.appearance?.hair),palette=Number(p.appearance?.palette);
 if(!Number.isInteger(number)||number<1||number>99||!POS.includes(position))return null;
 if(!Number.isInteger(hair)||hair<0||hair>13||!Number.isInteger(palette)||palette<0||palette>1)return null;
 const skills={};
 for(const k of skillKeys){const v=Number(p.skills?.[k]);if(!Number.isInteger(v)||v<1||v>10)return null;skills[k]=v}
 return {number,position,skills,appearance:{hair,palette}};
};
const canonicalAttrHex=(teamId,slot)=>{
 const t=Number(teamId),i=Number(slot)-1;
 if(!Number.isInteger(t)||t<0||t>=56||!Number.isInteger(i)||i<0||i>=20)throw new Error(`Equipe/slot inválido durante migração de atributos: ${teamId}/${slot}`);
 const off=baseHeader+0x150000+(t*20+i)*7;
 if(off<0||off+7>baseRom.length)throw new Error(`Atributos fora da ROM-base durante migração: equipe ${teamId}, slot ${slot}, offset ${off.toString(16)}`);
 return baseRom.subarray(off,off+7).toString('hex').toUpperCase();
};
const decodeAttr=(p,teamId,slot)=>{
 const semantic=semanticAttr(p);if(semantic)return semantic;
 const hex=isHex(p?.attrHex,7)?String(p.attrHex).toUpperCase():canonicalAttrHex(teamId,slot);
 if(!isHex(hex,7))throw new Error(`attrHex/fallback inválido durante migração teamsV1 v3: equipe ${teamId}, slot ${slot}`);
 return decodeAttrHex(hex);
};
const cls=v=>{v=String(v||'').toUpperCase();return v==='DF'?'DF':(v==='MC'||v==='MF')?'MC':(v==='AT'||v==='FW')?'AT':'DF'};
const globalX=(c,dx)=>{c=cls(c);const base=c==='DF'?-39:c==='MC'?0:39;return Math.max(-57,Math.min(57,base+(Number(dx)||0)))};
const tacticalFromLegacy=p=>p?{x:globalX(p.className,p.dx),y:Math.max(-39,Math.min(39,Number(p.dy)||0)),className:cls(p.className),attack:!!p.attack}:null;

for(const id of ['8','30','31']){
 const t=historical.teams?.[id];
 if(!t||!Array.isArray(t.players)||t.players.length!==20)throw new Error('Seleção histórica inválida: '+id);
 for(let i=0;i<20;i++)if(Number(t.players[i]?.slot)!==i+1||!isHex(t.players[i]?.attrHex,7))throw new Error(`Jogador histórico inválido: equipe ${id}, slot ${i+1}`);
}

project.state=project.state||{};
project.state.semantic=project.state.semantic||{};
delete project.state.targetLength;
project.state.semantic.plusPreparationV1={schema:'isssd-plus-preparation-v1',version:1,expanded4MiB:true,bodyLength:0x400000,expansionMode:4,tacticsIndividualized:true};
const sem=project.state.semantic;

function curatedLegacyTactic(id){
 const src=clone(historical.teams?.[id]?.tactic);if(!src)return null;
 if(String(id)==='30'){
  src.players[0]={...src.players[0],dx:8,dy:32};
  src.players[3]={...src.players[3],dx:8,dy:-32};
 }
 return src;
}
function legacyTacticFor(old,id){
 if(['8','30','31'].includes(String(id)))return curatedLegacyTactic(String(id));
 const pt=old?.playerTactics?.teams?.[String(id)]||old?.playerTactics?.teams?.[id];
 if(pt&&Array.isArray(pt.players))return pt;
 const t=old?.tactics?.teams?.[String(id)]||old?.tactics?.teams?.[id];
 return t&&Array.isArray(t.players)?t:null;
}
function legacyPlayersFor(old,id){
 if(['8','30','31'].includes(String(id)))return clone(historical.teams[String(id)].players);
 return clone(old?.names?.teams?.[String(id)]?.players||old?.names?.teams?.[id]?.players||[]);
}
function legacyTeamName(old,id){
 if(['8','30','31'].includes(String(id)))return historical.teams[String(id)].teamName;
 return String(old?.names?.teams?.[String(id)]?.teamName||old?.names?.teams?.[id]?.teamName||('TEAM '+id));
}
function tacticalMap(legacy){
 const map=new Map();if(!legacy||!Array.isArray(legacy.players))return map;
 legacy.players.forEach((p,i)=>{const slot=Number(p?.rosterSlot)||i+2;if(slot>=2&&slot<=11)map.set(slot,tacticalFromLegacy(p))});return map;
}

const old=sem.teamsV1&&typeof sem.teamsV1==='object'?clone(sem.teamsV1):{};
if(Number(old.version)!==3||!old.teams||typeof old.teams!=='object'){
 const v3={schema:'isssd-teams-v1',version:3,teams:{}};
 const ids=new Set(Object.keys(old?.names?.teams||{}).map(String));
 ['8','30','31'].forEach(x=>ids.add(x));
 for(const id of [...ids].sort((a,b)=>Number(a)-Number(b))){
  const teamId=Number(id);if(!Number.isInteger(teamId)||teamId<0||teamId>=56)continue;
  const oldPlayers=legacyPlayersFor(old,id);if(!Array.isArray(oldPlayers)||!oldPlayers.length)continue;
  const legacyTac=legacyTacticFor(old,id),tm=tacticalMap(legacyTac);
  const players=oldPlayers.map((p,i)=>{
   const slot=Number(p?.slot)||i+1,attrs=decodeAttr(p,teamId,slot);
   const q={slot,name:String(p?.name||('Jogador '+slot)),number:attrs.number,position:attrs.position,skills:attrs.skills,appearance:attrs.appearance,tactical:null};
   if(isHex(p?.nameHex,8))q.nameHex=String(p.nameHex).toUpperCase();
   if(slot===1)q.tactical={x:-57,y:0,className:'GO',attack:false,fixed:true};
   else if(slot>=2&&slot<=11)q.tactical=tm.get(slot)||null;
   return q;
  });
  v3.teams[id]={teamId,teamName:legacyTeamName(old,id),formation:{index:Number.isInteger(Number(legacyTac?.formationIndex))?Number(legacyTac.formationIndex):null,label:String(legacyTac?.formationLabel||historical.teams?.[id]?.formationLabel||''),custom:!!legacyTac?.custom},players};
 }
 sem.teamsV1=v3;
 sem.historicalNationalTeamsV1={schema:'isssd-historical-national-teams-v1',version:4,appliedTeamIds:[8,30,31],source:'project-data/historical-national-teams-v1.json',lineupConvention:clone(historical.lineupConvention||null),canonicalTeamsSchema:'isssd-teams-v1@3'};
 console.log('Migração teamsV1 v3 aplicada: cada jogador agora contém camisa, posição, skills, aparência e coordenadas táticas próprias; atributos ausentes vieram da ROM-base Plus.');
}else{
 console.log('teamsV1 v3 já presente: dados semânticos dos jogadores serão preservados.');
}

// Revisão canônica de skills do Brasil. Altera somente skills; camisa, posição,
// aparência, ordem e coordenadas táticas permanecem exatamente como estão no projeto.
const BRAZIL_SKILLS_REVISION_VERSION=1;
const BRAZIL_SKILLS={
 'Taffarel':[5,5,3,3,7,9,4,9,8],
 'Cafu':[9,9,6,7,8,8,8,7,10],
 'D.daGuia':[8,8,8,7,9,8,7,10,8],
 'Lucio':[8,9,8,6,9,9,8,10,9],
 'R.Carlos':[10,10,10,9,9,8,8,7,10],
 'Dunga':[9,9,6,9,9,9,9,9,8],
 'Gerson':[6,6,8,10,7,10,8,6,8],
 'R.Gaucho':[9,8,8,10,8,9,10,7,7],
 "Pele'":[10,10,10,9,10,10,10,10,9],
 'Ronaldo':[10,10,10,8,10,9,10,8,8],
 'Garrinch':[10,10,8,9,8,9,10,6,8],
 'Gilmar':[5,5,3,3,7,9,4,9,8],
 'D.Santos':[8,8,9,8,9,7,7,10,8],
 'N.Santos':[8,8,7,7,8,10,8,8,9],
 'Aldair':[6,7,5,5,9,9,6,9,8],
 'Falcao':[7,7,8,8,8,10,9,7,9],
 'Rivaldo':[8,8,10,9,9,9,9,8,9],
 'Zico':[8,8,10,10,8,10,10,7,9],
 'Neymar':[10,9,9,9,7,9,10,6,8],
 'Romario':[10,9,10,8,8,10,10,7,7]
};
const brazil=sem.teamsV1?.teams?.['30']||sem.teamsV1?.teams?.[30];
const currentRevision=Number(sem.brazilSkillsRevisionV1?.version)||0;
if(brazil&&Array.isArray(brazil.players)&&currentRevision<BRAZIL_SKILLS_REVISION_VERSION){
 const seen=new Set();
 for(const p of brazil.players){
  const vals=BRAZIL_SKILLS[String(p?.name||'')];if(!vals)continue;
  p.skills=Object.fromEntries(skillKeys.map((k,i)=>[k,vals[i]]));seen.add(String(p.name));
 }
 const missing=Object.keys(BRAZIL_SKILLS).filter(n=>!seen.has(n));
 if(missing.length)throw new Error('Brasil: jogadores sem correspondência para revisão de skills: '+missing.join(', '));
 sem.brazilSkillsRevisionV1={schema:'isssd-brazil-skills-v1',version:BRAZIL_SKILLS_REVISION_VERSION,teamId:30,attributes:skillKeys,players:Object.keys(BRAZIL_SKILLS)};
 console.log('Brasil: skills revisadas aplicadas aos 20 jogadores; demais propriedades preservadas.');
}

if(sem.teamsV1){delete sem.teamsV1.names;delete sem.teamsV1.tactics;delete sem.teamsV1.playerTactics}
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log('Projeto Plus: preparação estrutural semântica + teamsV1 v3 canônico; sem attrHex/táticas duplicadas.');
