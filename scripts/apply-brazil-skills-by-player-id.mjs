import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const projectPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
if(!fs.existsSync(projectPath))throw new Error('Projeto canônico Plus não encontrado: '+projectPath);

const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const sem=project?.state?.semantic;
const teamsV1=sem?.teamsV1;
if(!sem||!teamsV1||Number(teamsV1.version)!==3||!teamsV1.teams){
 console.log('Brasil skills/player-id: teamsV1 v3 ainda não disponível; revisão ficará a cargo da migração legada.');
 process.exit(0);
}

const brazil=teamsV1.teams['30']||teamsV1.teams[30];
if(!brazil||!Array.isArray(brazil.players))throw new Error('Brasil: teamsV1 v3 sem elenco canônico.');

const skillKeys=['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'];
const namesByBaseSlot=[
 'Taffarel','Cafu','D.daGuia','Lucio','R.Carlos','Dunga','Gerson','R.Gaucho',"Pele'",'Ronaldo','Garrinch',
 'Gilmar','D.Santos','N.Santos','Aldair','Falcao','Rivaldo','Zico','Neymar','Romario'
];
const valuesByBaseSlot=[
 [5,5,3,3,7,9,4,9,8],
 [9,9,6,7,8,8,8,7,10],
 [8,8,8,7,9,8,7,10,8],
 [8,9,8,6,9,9,8,10,9],
 [10,10,10,9,9,8,8,7,10],
 [9,9,6,9,9,9,9,9,8],
 [6,6,8,10,7,10,8,6,8],
 [9,8,8,10,8,9,10,7,7],
 [10,10,10,9,10,10,10,10,9],
 [10,10,10,8,10,9,10,8,8],
 [10,10,8,9,8,9,10,6,8],
 [5,5,3,3,7,9,4,9,8],
 [8,8,9,8,9,7,7,10,8],
 [8,8,7,7,8,10,8,8,9],
 [6,7,5,5,9,9,6,9,8],
 [7,7,8,8,8,10,9,7,9],
 [8,8,10,9,9,9,9,8,9],
 [8,8,10,10,8,10,10,7,9],
 [10,9,9,9,7,9,10,6,8],
 [10,9,10,8,8,10,10,7,7]
];

function identityBaseSlot(player,index){
 const direct=Number(player?.baseSlot);
 if(Number.isInteger(direct)&&direct>=1&&direct<=20)return direct;
 const m=String(player?.playerId||'').match(/^30:(\d+)$/);
 if(m){const n=Number(m[1]);if(n>=1&&n<=20)return n}
 const slot=Number(player?.slot);
 if(Number.isInteger(slot)&&slot>=1&&slot<=20&&teamsV1.identityModel!=='player-id-v1')return slot;
 return Number(index)+1;
}

const byBaseSlot=new Map();
brazil.players.forEach((p,i)=>{
 const baseSlot=identityBaseSlot(p,i);
 if(byBaseSlot.has(baseSlot))throw new Error(`Brasil: identidade duplicada para baseSlot ${baseSlot}.`);
 byBaseSlot.set(baseSlot,p);
});

const missing=[];
for(let baseSlot=1;baseSlot<=20;baseSlot++){
 const p=byBaseSlot.get(baseSlot);
 if(!p){missing.push(`${baseSlot}:${namesByBaseSlot[baseSlot-1]}`);continue}
 const values=valuesByBaseSlot[baseSlot-1];
 p.custom=p.custom&&typeof p.custom==='object'?p.custom:{};
 p.custom.skills=Object.fromEntries(skillKeys.map((k,i)=>[k,values[i]]));
}
if(missing.length)throw new Error('Brasil: jogadores sem identidade para revisão de skills: '+missing.join(', '));

teamsV1.identityModel='player-id-v1';
sem.brazilSkillsRevisionV1={
 schema:'isssd-brazil-skills-v1',version:2,teamId:30,identityModel:'player-id-v1',attributes:skillKeys,
 players:namesByBaseSlot.map((name,i)=>({playerId:`30:${i+1}`,baseSlot:i+1,name}))
};
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log('Brasil: revisão de skills v2 aplicada aos 20 jogadores por playerId/baseSlot em custom.skills.');
