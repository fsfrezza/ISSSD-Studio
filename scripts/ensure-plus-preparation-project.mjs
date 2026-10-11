import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const projectPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const historicalPath=path.join(root,'project-data','historical-national-teams-v1.json');
if(!fs.existsSync(projectPath))throw new Error('Projeto canônico Plus não encontrado: '+projectPath);
if(!fs.existsSync(historicalPath))throw new Error('Dados históricos de Brasil/Argentina/Alemanha não encontrados: '+historicalPath);

const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const historical=JSON.parse(fs.readFileSync(historicalPath,'utf8'));
if(project?.base?.profile!=='iss-deluxe-plus')throw new Error('O projeto canônico não é do perfil iss-deluxe-plus.');
if(historical?.schema!=='isssd-historical-national-teams-v1')throw new Error('Schema histórico de seleções inválido.');

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const isHex=(v,n)=>new RegExp(`^[0-9A-F]{${n*2}}$`,'i').test(String(v||''));
const POS=['NONE','GO','DF','VOL','MC','MO','AT'];
const decodeAttr=hex=>{
 if(!isHex(hex,7))throw new Error('attrHex inválido durante migração teamsV1 v3: '+hex);
 const b=Array.from(Buffer.from(hex,'hex'));
 return {number:b[5]+1,position:POS[(b[4]>>4)&15]||'NONE',skills:{acceleration:(b[0]>>4)+1,speed:(b[0]&15)+1,shot:(b[1]>>4)+1,curve:(b[1]&15)+1,balance:(b[2]>>4)+1,intelligence:(b[2]&15)+1,dribbling:(b[3]>>4)+1,jump:(b[3]&15)+1,energy:(b[4]&15)+1},appearance:{hair:(b[6]>>4)&15,palette:b[6]&15}};
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
project.state.targetLength=0x400000;
project.state.semantic.plusPreparationV1={schema:'isssd-plus-preparation-v1',version:1,expanded4MiB:true,bodyLength:0x400000,expansionMode:4,tacticsIndividualized:true};
const sem=project.state.semantic;

function curatedLegacyTactic(id){
 const src=clone(historical.teams?.[id]?.tactic);if(!src)return null;
 if(String(id)==='30'){
  // Lista permanece GO, Cafu, zagueiros, R.Carlos...; apenas os lados no campo são trocados.
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
   const slot=Number(p?.slot)||i+1,attrs=decodeAttr(p.attrHex);
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
 console.log('Migração teamsV1 v3 aplicada: cada jogador agora contém camisa, posição, skills, aparência e coordenadas táticas próprias.');
}else{
 console.log('teamsV1 v3 já presente: dados semânticos dos jogadores serão preservados.');
}

// v3 é a única fonte de equipes/jogadores. Remova estruturas antigas redundantes se restarem.
if(sem.teamsV1){delete sem.teamsV1.names;delete sem.teamsV1.tactics;delete sem.teamsV1.playerTactics}
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log('Projeto Plus: 4 MiB + táticas individualizadas; teamsV1 v3 canônico e sem attrHex/táticas duplicadas.');
