import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Overlay semântico: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const marker='isssd-team-semantic-overlay-v1';
if(html.includes(marker))throw new Error('Overlay semântico de equipes já foi instalado.');

// Late legacy modules use these core helpers. Live accessors keep wrappers in
// the same lexical runtime rather than creating unrelated global copies.
const bridgeAnchor='// v32.4 bridge: the Studio core lives inside this IIFE.';
if(!html.includes(bridgeAnchor))throw new Error('Ponte lexical principal ausente');
const bridgeNames=['buildRomForDownload','titleImportPhotosConflictSafe','drawRealIssdPlayer','plusTacPlayRectPct','titleRenderPhotoConflictMode','plusTacVisualXToPct','plusTacVisualYToPct','titleRenderTexts','populateTeamControls','setFlagColor','setFlagColorBgr','restoreFlagPalette','copyFlagPalette','flagPresetObject','exportFlagPreset','applyFlagPreset','renderFlagComparison','renderFlagPage','saveMainMenuDraftToProject','loadMainMenuFb96Preset','loadMainMenuOriginalPreset'];
const bridge='Object.defineProperties(window,{'+bridgeNames.map(n=>n+':{configurable:true,get:()=>'+n+',set:v=>{'+n+'=v}}').join(',')+',hx:{configurable:true,get:()=>hx},NATIVE_TN:{configurable:true,get:()=>NATIVE_TN},TEAM_NAMES:{configurable:true,get:()=>TEAM_NAMES,set:v=>{TEAM_NAMES=v}},TEAM_COUNT:{configurable:true,get:()=>TEAM_COUNT,set:v=>{TEAM_COUNT=v}},BASE_TEAM_NAMES:{configurable:true,get:()=>BASE_TEAM_NAMES}});\n';
html=html.replace(bridgeAnchor,()=>bridge+bridgeAnchor);
html=html.replaceAll('valid.forEach(n=>b.appendChild(n));','valid.forEach(n=>{if(n!==b&&!n.contains(b))b.appendChild(n)});');
html=html.replaceAll('valid.forEach(n=>body.appendChild(n));','valid.forEach(n=>{if(n!==body&&!n.contains(body))body.appendChild(n)});');
html=html.replace('specialNameAt?specialNameAt(currentTeam)',"typeof specialNameAt==='function'?specialNameAt(currentTeam)");
// Once the helper is bridged, the obsolete late wrapper must not force
// "preserve" over the native composer's bounded two-tile reconciliation.
html=html.replace(/titleImportPhotosConflictSafe=function\(img\)\{[\s\S]*?return r\s*\};/,()=> 'titleImportPhotosConflictSafe=function(img){return _photosImport(img)};');

const runtime=String.raw`
<script id="${marker}">
window.__ISSSD_INSTALL_TEAMS_SEMANTIC_V1__=function(){
 const clone=v=>{try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(_){return null}};
 const has=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
 const posId=v=>({NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6}[String(v||'NONE').toUpperCase()]??0);
 const posLabel=v=>(['NONE','GO','DF','DF-MF','MF','MF-FW','FW'][posId(v)]||'NONE');
 const baseRead=typeof studioTeamsV3ReadFull==='function'?studioTeamsV3ReadFull:null;
 const baseTactical=typeof plusTacticalRecordForTeam==='function'?plusTacticalRecordForTeam:null;
 if(!baseRead)throw new Error('Overlay semântico: studioTeamsV3ReadFull indisponível.');
 // The public rom property is read-only. Reset the actual lexical buffer,
 // never an assignment to that global accessor which silently does nothing.
 window.__ISSSD_RESTORE_CLEAN_CURRENT_V1__=function(bytes){rom=new Uint8Array(bytes);window.__ISSD_DIAG_ROM__=rom;};

 // Invalidate the resolved view whenever a clean ROM session is installed.
 window.__ISSSD_TEAMS_SEMANTIC_RESET_V1__=function(){
  window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__=null;
  window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__=null;
  window.__ISSSD_TEAMS_BASELINE_V1__=null;
  window.__ISSSD_PLAYER_BASE_SLOT_BY_CURRENT_SLOT_V1__=null;
 };
 function playerFromIdentity(team,p,index){
  const slot=Number(p?.slot)||index+1,baseSlot=typeof studioTeamsV3BaseSlot==='function'?studioTeamsV3BaseSlot(team,p,slot):(Number(p?.baseSlot)||slot);
  let out=null;
  try{out=typeof studioTeamsV3OriginalPlayer==='function'?studioTeamsV3OriginalPlayer(team,baseSlot):null}catch(_){}
  if(!out){
   const base=window.__ISSSD_TEAMS_BASELINE_V1__?.teams?.[String(team)]?.players?.[baseSlot-1]||{};
   out=clone(base)||{};
  }
  out.playerId=String(p?.playerId||out.playerId||(String(team)+':'+String(baseSlot)));out.baseSlot=baseSlot;out.slot=slot;
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
  if(state?.appearanceModel)out.appearanceModel=state.appearanceModel;
  if(state?.spriteEdits)out.spriteEdits=clone(state.spriteEdits);
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
  if(has(resolved,'name')){model.name=resolved.name;model.fixedName=resolved.name;model.manual=resolved.name;}
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
 function applyModels(resolved,onlyTeam=null){
  if(typeof teams==='undefined'||!Array.isArray(teams))return false;
  for(const [key,rt] of Object.entries(resolved?.teams||{})){
   const t=Number(key);if(onlyTeam!==null&&t!==Number(onlyTeam))continue;const model=teams[t];if(!model)continue;
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
  if(window.ISSSDPlayerAppearanceCore?.migrateBaldAppearanceTeams)state=window.ISSSDPlayerAppearanceCore.migrateBaldAppearanceTeams(state);
  if(typeof studioTeamsV3IdentityMapFromProject==='function')studioTeamsV3IdentityMapFromProject(state);
  window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__=clone(state);
  window.__ISSSD_TEAMS_V1__=clone(state);
  const resolved=resolve(state);window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__=resolved;
  const models=applyModels(resolved);

  return !!models;
 };
 window.__ISSSD_TEAMS_SET_PLAYER_APPEARANCE_V1__=function(team,identity,value){
  const engine=window.ISSSDPlayerAppearanceCore;if(!engine)throw new Error('Núcleo de aparência indisponível.');
  const state=window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__||studioTeamsV3Snapshot();
  const originalPlayer=studioTeamsV3OriginalPlayer(Number(team),Number(identity?.baseSlot));
  const next=engine.setProjectPlayerAppearance(state,team,identity,value,originalPlayer?.appearance||{});
  return window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(next);
 };
 window.__ISSSD_TEAMS_TRANSFER_PLAYER_APPEARANCE_V1__=function(source,target,mode){
  const engine=window.ISSSDPlayerAppearanceCore;if(!engine)throw new Error('Núcleo de aparência indisponível.');
  const state=window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__||studioTeamsV3Snapshot();
  const complete=clone(state),resolved=studioTeamsV3ReadFull();
  const selected=[source,target].map(ref=>{const p=resolved?.teams?.[String(ref?.team)]?.players?.find(p=>p.playerId===ref?.identity?.playerId&&Number(p.baseSlot)===Number(ref?.identity?.baseSlot));if(!p)throw new Error('Aparência: jogador selecionado não encontrado.');return p;});
  const isKeeper=p=>p.position===1||['GO','GK'].includes(String(p.position));
  if(selected.some(isKeeper)){
   if(!selected.every(isKeeper))throw new Error('Copie a aparência de goleiro para goleiro; os modelos de linha são diferentes.');
   const keeper=window.__ISSSD_GOALKEEPERS_EDITOR__;if(!keeper?.transferAppearance)throw new Error('Editor de aparência dos goleiros indisponível.');
   return keeper.transferAppearance(source,target,mode);
  }

  for(const ref of [source,target]){
   const team=Number(ref?.team),roster=resolved?.teams?.[String(team)];
   const player=roster?.players?.find(p=>p.playerId===ref?.identity?.playerId&&Number(p.baseSlot)===Number(ref?.identity?.baseSlot));
   if(!player)throw new Error('Aparência: jogador selecionado não encontrado.');
   complete.teams[String(team)]||={teamId:team,players:[]};
   const entries=complete.teams[String(team)].players;
   if(!entries.some(p=>p.playerId===player.playerId&&Number(p.baseSlot)===Number(player.baseSlot)))entries.push({playerId:player.playerId,baseSlot:player.baseSlot,slot:player.slot});
  }
  const next=engine.transferProjectPlayerAppearance(complete,source,target,mode,(team,slot)=>studioTeamsV3OriginalPlayer(team,slot)?.appearance||{});
  return window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(next);
 };
 window.__ISSSD_TEAMS_SET_PLAYER_ATTACK_V1__=function(team,identity,enabled){
  if(typeof enabled!=='boolean')throw new Error('ATACAR exige um valor booleano.');
  const state=clone(window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__||studioTeamsV3Snapshot());
  const ts=state?.teams?.[String(team)];
  const player=ts?.players?.find(p=>p.playerId===identity?.playerId&&Number(p.baseSlot)===Number(identity?.baseSlot));
  if(!player)throw new Error('Identidade do jogador não encontrada para ATACAR.');
  player.custom||={};player.custom.tactical||={};
  const originalPlayer=studioTeamsV3OriginalPlayer(Number(team),Number(player.baseSlot));
  if(enabled===!!originalPlayer?.tactical?.attack)delete player.custom.tactical.attack;
  else player.custom.tactical.attack=enabled;
  if(!Object.keys(player.custom.tactical).length)delete player.custom.tactical;
  if(!Object.keys(player.custom).length)delete player.custom;
  return window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(state);
 };
 if(typeof renderPlusTacticalLineup==='function'){
  const renderLineupBase=renderPlusTacticalLineup;
  renderPlusTacticalLineup=function(rec){
   const result=renderLineupBase(rec),box=document.getElementById('plusTacticalLineup');
   if(!box)return result;
   const team=Number(currentTeam);
   const roster=(window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__||studioTeamsV3ReadFull())?.teams?.[String(team)];
   for(const row of box.children){
    if(row.children.length!==6)continue;
    row.appendChild(row.children[3]);
    row.style.gridTemplateColumns='28px minmax(64px,88px) 34px 42px 42px 46px';
    const checkbox=row.querySelector('[data-plus-attack-index]');if(!checkbox)continue;
    const index=Number(checkbox.dataset.plusAttackIndex);
    const model=roster?.players?.find(p=>Number(p.slot)===index+2)||plusTacticalRosterPlayer(index)?.player;
    const identity={playerId:model?.playerId,baseSlot:model?.baseSlot};
    checkbox.dataset.playerId=identity.playerId||'';
    checkbox.dataset.baseSlot=String(identity.baseSlot??'');
    checkbox.onchange=()=>{
     window.__ISSSD_TEAMS_SET_PLAYER_ATTACK_V1__(team,identity,checkbox.checked);
     plusTacUpdateAttackArrow(index,checkbox.checked);
    };
   }
   return result;
  };
 }
 const refreshBase=refreshPlusTeamFromRom;
 refreshPlusTeamFromRom=function(team){
  refreshBase(team);
  if(activeRomProfile?.id==='iss-deluxe-plus')applyModels(window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__,team);
 };
 const buildBase=buildTeams;
 buildTeams=function(){buildBase();if(activeRomProfile?.id==='iss-deluxe-plus')applyModels(window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__)};
 // Public readers must forward into the same lexical runtime as renderers.
 // The legacy bridge exposes this as configurable but non-writable. Strict
 // assignment aborts installation before the snapshot reader is wrapped.
 Object.defineProperty(window,'plusTacticalRecordForTeam',{configurable:true,value:(...args)=>plusTacticalRecordForTeam(...args)});
 studioTeamsV3ReadFull=function(){
  const base=baseRead();const state=window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__;
  return state?.schema==='isssd-teams-v1'?resolve(state):base;
 };
 if(baseTactical){
  plusTacticalRecordForTeam=function(team,source=rom){
   if(source!==rom)return baseTactical(team,source);
   const rec=baseTactical(team,source),rt=window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__?.teams?.[String(team)];
   if(!rec||!rt)return rec;
   const out={...rec,raw:rec.raw?new Uint8Array(rec.raw):rec.raw,players:Array.isArray(rec.players)?rec.players.map(p=>({...p})):rec.players};
   if(rt.formation&&Number.isInteger(Number(rt.formation.index))){out.formationIndex=Number(rt.formation.index);if(out.raw?.length===31)out.raw[0]=Number(rt.formation.index)&15}
   if(Array.isArray(out.players))for(let i=0;i<Math.min(10,out.players.length);i++){
    const q=rt.players?.[i+1]?.tactical;if(!q)continue;const cls=typeof studioTeamsV3Class==='function'?studioTeamsV3Class(q.className):String(q.className||'DF');
    out.players[i]={...out.players[i],className:cls,dx:typeof studioTeamsV3NativeDx==='function'?studioTeamsV3NativeDx(cls,q.x):Number(q.x)||0,dy:Number(q.y)||0,attack:!!q.attack};
    const p=out.players[i],bits=cls==='DF'?1:cls==='MC'?2:3;
    p.flag=((p.flag||0)&~7)|bits|(p.attack?4:0);
    if(out.raw?.length===31){out.raw[1+i*2]=p.dx&255;out.raw[2+i*2]=p.dy&255;out.raw[21+i]=p.flag;}
   }
   return out;
  };
 }
};
</script>
`;

if(!html.includes('</body>'))throw new Error('Overlay semântico: HTML final sem </body>.');
// Install inside the legacy IIFE: teams and tactical readers are lexical, not globals.
const anchor='function ensureCurrentTeamFresh(){';
if(html.split(anchor).length!==2)throw new Error('Overlay semântico: escopo do runtime principal ambíguo/ausente.');
const scopedRuntime=runtime.replace(/<script[^>]*>/,'/* '+marker+' */').replace('</script>','');
html=html.replace(anchor,()=>scopedRuntime+'\n'+anchor);
// Call only after the later canonical teams script has initialized its readers.
html=html.replace('</body>',()=>'<script id="isssd-team-semantic-bootstrap-v1">window.__ISSSD_INSTALL_TEAMS_SEMANTIC_V1__();</script>\n</body>');
for(const required of ['__ISSSD_TEAMS_PROJECT_OVERLAY_V1__','__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__','__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__','studioTeamsV3ReadFull=function()'])if(!html.includes(required))throw new Error('Overlay semântico incompleto; ausente '+required);
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: overlay semântico de equipes instalado — teamsV1 hidrata modelos/UI sem gravar os overrides na ROM-base.');
