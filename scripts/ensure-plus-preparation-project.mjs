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
if(historical?.schema!=='isssd-historical-national-teams-v1'||Number(historical.version)!==2)throw new Error('Schema histórico de seleções inválido.');

const clone=v=>JSON.parse(JSON.stringify(v));
const isHex=(v,n)=>new RegExp(`^[0-9A-F]{${n*2}}$`,'i').test(String(v||''));
for(const id of ['8','30','31']){
 const t=historical.teams?.[id];
 if(!t||Number(t.teamId)!==Number(id)||!Array.isArray(t.players)||t.players.length!==20)throw new Error('Seleção histórica inválida: '+id);
 for(let i=0;i<20;i++){
  const p=t.players[i];
  if(Number(p?.slot)!==i+1||!isHex(p?.nameHex,8)||!isHex(p?.attrHex,7))throw new Error(`Jogador histórico inválido: equipe ${id}, slot ${i+1}`);
 }
 if(!t.tactic||Number(t.tactic.teamId)!==Number(id)||!isHex(t.tactic.rawHex,31)||!Array.isArray(t.tactic.players)||t.tactic.players.length!==10)throw new Error('Tática histórica inválida: '+id);
}

project.state=project.state||{};
project.state.semantic=project.state.semantic||{};
project.state.targetLength=0x400000;
project.state.semantic.plusPreparationV1={
 schema:'isssd-plus-preparation-v1',
 version:1,
 expanded4MiB:true,
 bodyLength:0x400000,
 expansionMode:4,
 tacticsIndividualized:true
};

const sem=project.state.semantic;
const installedVersion=(sem.historicalNationalTeamsV1?.schema==='isssd-historical-national-teams-v1')?Number(sem.historicalNationalTeamsV1?.version)||0:0;
if(installedVersion<2){
 const teams=sem.teamsV1&&typeof sem.teamsV1==='object'?sem.teamsV1:(sem.teamsV1={});
 teams.schema='isssd-teams-v1';
 teams.version=2;
 teams.names=teams.names&&typeof teams.names==='object'?teams.names:{};
 teams.names.schema='isssd-name-roster-v1';
 teams.names.version=1;
 teams.names.mode='names-only';
 teams.names.teams=teams.names.teams&&typeof teams.names.teams==='object'?teams.names.teams:{};
 teams.tactics=teams.tactics&&typeof teams.tactics==='object'?teams.tactics:{};
 teams.tactics.schema='isssd-custom-tactics-v1';
 teams.tactics.version=2;
 teams.tactics.mode='overrides-only';
 teams.tactics.teams=teams.tactics.teams&&typeof teams.tactics.teams==='object'?teams.tactics.teams:{};
 for(const id of ['8','30','31']){
  const src=historical.teams[id];
  teams.names.teams[id]={teamId:Number(id),teamName:src.teamName,players:clone(src.players)};
  teams.tactics.teams[id]=clone(src.tactic);
 }
 sem.historicalNationalTeamsV1={
  schema:'isssd-historical-national-teams-v1',version:2,appliedTeamIds:[8,30,31],
  source:'project-data/historical-national-teams-v1.json',lineupConvention:clone(historical.lineupConvention||null)
 };
 console.log('Migração v2 aplicada: Brasil/Argentina/Alemanha seguem a ordem natural da escalação e preservam as posições táticas.');
}else{
 console.log('Seleções históricas v2 já inicializadas: alterações posteriores do usuário serão preservadas.');
}

fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log('Projeto Plus: preparação 4 MiB + táticas individualizadas registrada sem sobrescrever edições após a migração v2.');
