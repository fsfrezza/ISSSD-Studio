import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Overlay semântico: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const marker='isssd-team-semantic-overlay-v1';
if(html.includes(marker))throw new Error('Overlay semântico de equipes já foi instalado.');

const runtime=String.raw`
<script id="${marker}">
(()=>{
 const clone=v=>{try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(_){return null}};
 const has=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
 const posId=v=>({NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6}[String(v||'NONE').toUpperCase()]??0);
 const posLabel=v=>(['NONE','GO','DF','DF-MF','MF','MF-FW','FW'][posId(v)]||'NONE');
 const baseRead=typeof studioTeamsV3ReadFull==='function'?studioTeamsV3ReadFull:null;
 const baseTactical=typeof plusTacticalRecordForTeam==='function'?plusTacticalRecordForTeam:null;
 if(!baseRead)throw new Error('Overlay semântico: studioTeamsV3ReadFull indisponível.');

 function playerFromIdentity(team,p,index){
  const slot=Number(p?.slot)||index+1,baseSlot=typeof studioTeamsV3BaseSlot==='function'?studioTeamsV3BaseSlot(team,p,slot):(Number(p?.baseSlot)||slot);
  let out=null;
  try{out=typeof studioTeamsV3OriginalPlayer==='function'?studioTeamsV3OriginalPlayer(team,baseSlot):null}catch(_){}
  if(!out){
   const base=window.__ISSSD_TEAMS_BASELINE_V1__?.teams?.[String(team)]?.players?.[baseSlot-1]||{};
   out=clone(base)||{};
  }
  out.playerId=String(p?.playerId||out.playerId||(`${team}:${baseSlot}`));out.baseSlot=baseSlot;out.slot=slot;
  return out;
 }
 function mergePlayer(base,custom){
  const out=clone(base)||{};custom=custom&&typeof custom==='object'?custom:{};
  for(const k of ['name','nameHex','number','position'])if(has(custom,k))out[k]=clone(custom[k]);
  if(custom.skills&&typeof custom.skills==='object')out.skills={...(out.skills||{}),...clone(custom.skills)};
  if(custom.appearance&&typeof custom.appearance==='object')out.appearance={...(out.appearance||{}),...clone(custom.appearance)};
  if(custom.tactical&&typeof custom.tactical==='object')out.tactical={...(out.tactical||{}),...clone(custom.tactical)};
  return out;
 }
 function resolve(state){
  const previousResolved=window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__;
  window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__=null;
  let rawBase;
  try{rawBase=baseRead()}finally{window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__=previousResolved||null}
  if(!window.__ISSSD_TEAMS_BASELINE_V1__)window.__ISSSD_TEAMS_BASELINE_V1__=clone(rawBase);
  const out=clone(rawBase)||{schema:'isssd-teams-v1',version:3,teams:{}};
  for(const [key,ts] of Object.entries(state?.teams||{})){
   const team=Number(ts?.teamId??key);if(!Number.isInteger(team)||team<0||team>=56)continue;
   const dst=out.teams?.[String(team)];if(!dst)continue;
   const teamCustom=ts?.custom&&typeof ts.custom==='object'?ts.custom:{};
   if(has(teamCustom,'teamName'))dst.teamName=String(teamCustom.teamName??'');
   if(teamCustom.formation&&has(teamCustom.formation,'index'))dst.formation={...(dst.formation||{}),index:Number(teamCustom.formation.index)};
   if(!Array.isArray(ts?.players))continue;
   const players=[];
   for(let i=0;i<ts.players.length;i++){
    const p=ts.players[i],slot=Number(p?.slot)||i+1;if(slot<1||slot>20)continue;
    const resolved=mergePlayer(playerFromIdentity(team,p,i),p?.custom);
    resolved.slot=slot;players[slot-1]=resolved;
   }
   for(let i=0;i<20;i++)if(!players[i])players[i]=clone(dst.players?.[i])||playerFromIdentity(team,{slot:i+1,baseSlot:i+1},i);
   dst.players=players;
  }
  return out;
 }
 function applyPlayerModel(model,resolved){
  if(!model||!resolved)return;
  model.playerId=resolved.playerId;model.baseSlot=resolved.baseSlot;model.slot=resolved.slot;
  if(has(resolved,'name'))model.name=resolved.name;
  if(has(resolved,'number'))model.number=resolved.number;
  if(has(resolved,'position')){
   const id=posId(resolved.position);model.position=typeof model.position==='number'?id:posLabel(resolved.position);
   if('positionId' in model)model.positionId=id;if('positionCode' in model)model.positionCode=posLabel(resolved.position);
  }
  const skills=resolved.skills||{};model.skills={...(model.skills||{}),...skills};
  for(const [k,v] of Object.entries(skills))if(k in model)model[k]=v;
  const appearance=resolved.appearance||{};model.appearance={...(model.appearance||{}),...appearance};
  for(const [k,v] of Object.entries(appearance))if(k in model)model[k]=v;
  if(resolved.tactical){model.tactical={...(model.tactical||{}),...resolved.tactical};for(const k of ['x','y','className','attack'])if(k in model)model[k]=resolved.tactical[k]}
 }
 function applyModels(resolved){
  if(typeof teams==='undefined'||!Array.isArray(teams))return false;
  for(const [key,rt] of Object.entries(resolved?.teams||{})){
   const t=Number(key),model=teams[t];if(!model)continue;
   if(has(rt,'teamName')){if('teamName' in model)model.teamName=rt.teamName;if('name' in model)model.name=rt.teamName}
   if(rt.formation){if(model.formation&&typeof model.formation==='object')model.formation={...model.formation,index:rt.formation.index};if('formationIndex' in model)model.formationIndex=rt.formation.index}
   if(Array.isArray(model.players))for(let i=0;i<Math.min(20,rt.players?.length||0);i++)applyPlayerModel(model.players[i],rt.players[i]);
  }
  return true;
 }
 window.__ISSSD_TEAMS_SEMANTIC_RESOLVE_V1__=resolve;
 window.__ISSSD_TEAMS_SEMANTIC_APPLY_MODELS_V1__=applyModels;
 window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__=function(state){
  if(!state||state.schema!=='isssd-teams-v1'||Number(state.version)!==3)return false;
  if(typeof studioTeamsV3IdentityMapFromProject==='function')studioTeamsV3IdentityMapFromProject(state);
  window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__=clone(state);
  window.__ISSSD_TEAMS_V1__=clone(state);
  const resolved=resolve(state);window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__=resolved;
  const models=applyModels(resolved);
  try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(e){console.warn('Overlay semântico: TEAM_STATE_API.refresh',e)}
  return !!models;
 };
 studioTeamsV3ReadFull=function(){
  const base=baseRead();const state=window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__;
  return state?.schema==='isssd-teams-v1'?resolve(state):base;
 };
 if(baseTactical){
  plusTacticalRecordForTeam=function(team){
   const rec=baseTactical(team),rt=window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__?.teams?.[String(team)];
   if(!rec||!rt)return rec;
   const out={...rec,raw:rec.raw?new Uint8Array(rec.raw):rec.raw,players:Array.isArray(rec.players)?rec.players.map(p=>({...p})):rec.players};
   if(rt.formation&&Number.isInteger(Number(rt.formation.index))){out.formationIndex=Number(rt.formation.index);if(out.raw?.length===31)out.raw[0]=Number(rt.formation.index)&15}
   if(Array.isArray(out.players))for(let i=0;i<Math.min(10,out.players.length);i++){
    const q=rt.players?.[i+1]?.tactical;if(!q)continue;const cls=typeof studioTeamsV3Class==='function'?studioTeamsV3Class(q.className):String(q.className||'DF');
    out.players[i]={...out.players[i],className:cls,dx:typeof studioTeamsV3NativeDx==='function'?studioTeamsV3NativeDx(cls,q.x):Number(q.x)||0,dy:Number(q.y)||0,attack:!!q.attack};
   }
   return out;
  };
 }
})();
</script>
`;

if(!html.includes('</body>'))throw new Error('Overlay semântico: HTML final sem </body>.');
html=html.replace('</body>',runtime+'\n</body>');
for(const required of ['__ISSSD_TEAMS_PROJECT_OVERLAY_V1__','__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__','__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__','studioTeamsV3ReadFull=function()'])if(!html.includes(required))throw new Error('Overlay semântico incompleto; ausente '+required);
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: overlay semântico de equipes instalado — teamsV1 hidrata modelos/UI sem gravar os overrides na ROM-base.');
