import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const start='function studioTeamsV1Snapshot(){';
const end='function studioCustomTeamState(team){';
const a=html.indexOf(start),b=html.indexOf(end,a);
if(a<0||b<0)throw new Error('Não encontrei bloco teamsV1 para instalar persistência tática por jogador.');

const replacement=String.raw`function studioPlayerTacticalKey(player){
 const h=String(player?.nameHex||'').toUpperCase();
 if(/^[0-9A-F]{16}$/.test(h))return 'namehex:'+h;
 const n=String(player?.name||'').trim().toUpperCase();
 return n?'name:'+n:null;
}
function studioSignedByte(v){v=Number(v)&255;return v>=128?v-256:v}
function studioByte(v){v=Math.round(Number(v)||0);return v<0?v+256:v&255}
function studioHexBytes(bytes){return Array.from(bytes||[]).map(v=>(Number(v)&255).toString(16).toUpperCase().padStart(2,'0')).join('')}
function studioPlayerTacticsSnapshotForProject(names){
 const out={schema:'isssd-player-tactics-v1',version:1,mode:'player-bound',teams:{}};
 if(activeRomProfile?.id!=='iss-deluxe-plus'||!rom)return out;
 for(let t=0;t<56;t++){
  let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}
  if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31||!Array.isArray(rec.players)||rec.players.length!==10)continue;
  const namePlayers=names?.teams?.[String(t)]?.players||names?.teams?.[t]?.players||[];
  const players=rec.players.map((p,i)=>{
   const rosterSlot=i+2;
   const np=namePlayers.find(x=>Number(x?.slot)===rosterSlot)||null;
   return {index:i,rosterSlot,playerKey:studioPlayerTacticalKey(np),name:np?.name||teams?.[t]?.players?.[i+1]?.name||null,
    dx:Number(p.dx)||0,dy:Number(p.dy)||0,className:String(p.className||''),attack:!!p.attack};
  });
  out.teams[String(t)]={teamId:t,formationIndex:Number(rec.formationIndex)||0,formationLabel:String(rec.formationLabel||''),rawHex:studioHexBytes(rec.raw),players};
 }
 return out;
}
function studioApplyPlayerTacticsState(state,names){
 if(!state||!state.teams||typeof state.teams!=='object'||activeRomProfile?.id!=='iss-deluxe-plus'||!rom)return false;
 let changed=false;
 for(const [key,saved] of Object.entries(state.teams)){
  const team=Number(saved?.teamId??key);if(!Number.isInteger(team)||team<0||team>=56)continue;
  let rec=null;try{rec=plusTacticalRecordForTeam(team)}catch(_){}
  if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)continue;
  const target=new Uint8Array(rec.raw);
  target[0]=Math.max(0,Math.min(15,Number(saved?.formationIndex??target[0])||0));
  const savedPlayers=Array.isArray(saved?.players)?saved.players:[];
  const currentNames=names?.teams?.[String(team)]?.players||names?.teams?.[team]?.players||[];
  for(let i=0;i<10;i++){
   const rosterSlot=i+2;
   const np=currentNames.find(x=>Number(x?.slot)===rosterSlot)||null;
   const playerKey=studioPlayerTacticalKey(np);
   let src=playerKey?savedPlayers.find(x=>x?.playerKey===playerKey):null;
   if(!src)src=savedPlayers.find(x=>Number(x?.rosterSlot)===rosterSlot)||savedPlayers.find(x=>Number(x?.index)===i)||null;
   if(!src)continue;
   target[1+i*2]=studioByte(src.dx);
   target[2+i*2]=studioByte(src.dy);
   const cls=String(src.className||'').toUpperCase();
   const clsBits=cls==='DF'?1:(cls==='MC'||cls==='MF')?2:(cls==='AT'||cls==='FW')?3:(target[21+i]&3);
   target[21+i]=(target[21+i]&0xF8)|clsBits|(src.attack?0x04:0);
  }
  const off=fo(rec.recordPc);let diff=false;for(let i=0;i<31;i++)if(rom[off+i]!==target[i]){diff=true;break}
  if(diff){rom.set(target,off);changed=true}
 }
 if(changed){try{syncModelsFromRom()}catch(_){} }
 return changed;
}
function studioTeamsV1Snapshot(){
 const names=studioNameRosterSnapshotForProject()||studioCloneJson(window.__ISSSD_LOADED_NAME_ROSTER_V1__);
 return {schema:'isssd-teams-v1',version:2,
  names:studioCloneJson(names),
  tactics:studioCloneJson(studioCustomTacticsState()),
  playerTactics:studioPlayerTacticsSnapshotForProject(names)};
}
function studioRestoreTeamsV1(state){
 if(!state||state.schema!=='isssd-teams-v1'||![1,2].includes(Number(state.version)))return false;
 window.__ISSSD_TEAMS_V1__=studioCloneJson(state);
 const restored=studioRestoreNameRosterProjectState(state.names||null);
 let playerTactics=state.playerTactics||null;
 // Compatibilidade com projetos intermediários que gravaram o registro tático completo em teamsV1.tactics.
 if(!playerTactics&&state.tactics?.teams&&Object.values(state.tactics.teams).some(x=>x&&Array.isArray(x.players)&&typeof x.rawHex==='string')){
  playerTactics={schema:'isssd-player-tactics-v1',version:1,mode:'legacy-slot-bound',teams:studioCloneJson(state.tactics.teams)};
 }
 if(state.tactics?.schema==='isssd-custom-tactics-v1'&&!Object.values(state.tactics?.teams||{}).some(x=>x&&Array.isArray(x.players)&&typeof x.rawHex==='string')){
  const ct=studioCustomTacticsState(),src=studioCloneJson(state.tactics);
  ct.schema='isssd-custom-tactics-v1';ct.version=1;ct.teams=(src&&src.teams&&typeof src.teams==='object')?src.teams:{};
 }
 try{studioApplyPlayerTacticsState(playerTactics,state.names||null)}catch(e){console.error('ISSSD Studio: falha ao restaurar posições táticas por jogador',e);throw e}
 return restored;
}
`;

html=html.slice(0,a)+replacement+html.slice(b);
if(!html.includes("schema:'isssd-player-tactics-v1'"))throw new Error('Persistência tática por jogador não foi instalada.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: teamsV1 v2 agora salva e restaura X/Y, classe e ATACAR vinculados à identidade do jogador.');
