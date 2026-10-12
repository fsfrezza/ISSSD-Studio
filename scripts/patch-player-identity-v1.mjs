import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

function replaceFunction(name,nextName,replacement){
  const start=`function ${name}(`, end=`function ${nextName}(`;
  const a=html.indexOf(start), b=html.indexOf(end,a);
  if(a<0||b<0)throw new Error(`Player identity v1: bloco ${name} não encontrado.`);
  html=html.slice(0,a)+replacement+'\n'+html.slice(b);
}

const helperAnchor='function studioTeamsV3ReadFull(){';
const helperPos=html.indexOf(helperAnchor);
if(helperPos<0)throw new Error('Player identity v1: studioTeamsV3ReadFull não encontrado.');
const helpers=String.raw`
function studioTeamsV3Signed8(v){v=Number(v)&255;return v>127?v-256:v}
function studioTeamsV3PlayerId(team,baseSlot){return String(Number(team))+':'+String(Number(baseSlot))}
function studioTeamsV3BaseSlot(team,p,fallback){
 const direct=Number(p?.baseSlot);if(Number.isInteger(direct)&&direct>=1&&direct<=20)return direct;
 const id=String(p?.playerId||'');const m=id.match(/^(\d+):(\d+)$/);if(m&&Number(m[1])===Number(team)){const n=Number(m[2]);if(n>=1&&n<=20)return n}
 return Number(fallback)||1;
}
function studioTeamsV3IdentityMapInit(){
 const root=window.__ISSSD_PLAYER_BASE_SLOT_BY_CURRENT_SLOT_V1__||(window.__ISSSD_PLAYER_BASE_SLOT_BY_CURRENT_SLOT_V1__={});
 for(let t=0;t<56;t++)if(!Array.isArray(root[String(t)])||root[String(t)].length<20)root[String(t)]=Array.from({length:20},(_,i)=>i+1);
 return root;
}
function studioTeamsV3IdentityMapFromProject(state){
 const root=studioTeamsV3IdentityMapInit();
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||!Array.isArray(ts?.players))continue;
  const map=Array.from({length:20},(_,i)=>i+1);
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],slot=Number(p?.slot)||i+1;if(slot<1||slot>20)continue;
   map[slot-1]=studioTeamsV3BaseSlot(t,p,slot);
  }
  root[String(t)]=map;
 }
 return root;
}
function studioTeamsV3OriginalNameRecord(t,i){try{return readPlayerRecordFromRom(t,i,original)}catch(_){return null}}
function studioTeamsV3OriginalTactical(t,baseSlot){
 if(baseSlot===1)return {x:-57,y:0,className:'GO',attack:false,fixed:true};
 if(baseSlot<2||baseSlot>11)return null;
 let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}if(!rec)return null;
 const off=studioTeamsV3FileOffset(rec.recordPc),j=baseSlot-2,flag=original[off+21+j]||0,bits=flag&3,cls=bits===1?'DF':bits===2?'MC':'AT';
 return {x:studioTeamsV3GlobalX(cls,studioTeamsV3Signed8(original[off+1+j*2])),y:studioTeamsV3Clamp(studioTeamsV3Signed8(original[off+2+j*2]),-39,39,0),className:cls,attack:!!(flag&4)};
}
function studioTeamsV3OriginalPlayer(t,baseSlot){
 const i=baseSlot-1,nr=studioTeamsV3OriginalNameRecord(t,i),off=studioTeamsV3AttrOffset(t,i),attrs=studioTeamsV3DecodeAttr(original.slice(off,off+7))||{};
 return {playerId:studioTeamsV3PlayerId(t,baseSlot),baseSlot,slot:baseSlot,name:String(nr?.name||('Jogador '+baseSlot)),nameHex:nr?.no!=null?studioTeamsV3Hex(original.slice(nr.no,nr.no+8)):null,number:attrs.number||baseSlot,position:attrs.position||'NONE',skills:attrs.skills||{},appearance:attrs.appearance||{},tactical:studioTeamsV3OriginalTactical(t,baseSlot)};
}
function studioTeamsV3OriginalNameBytes(t,baseSlot){const nr=studioTeamsV3OriginalNameRecord(t,baseSlot-1);return nr?.no!=null?new Uint8Array(original.slice(nr.no,nr.no+8)):null}
`;
html=html.slice(0,helperPos)+helpers+html.slice(helperPos);

replaceFunction('studioTeamsV3ReadFull','studioTeamsV3PlayerOverride',String.raw`function studioTeamsV3ReadFull(){
 const out={schema:'isssd-teams-v1',version:3,mode:'resolved-rom-state',identityModel:'player-id-v1',teams:{}};
 if(activeRomProfile?.id!=='iss-deluxe-plus'||!rom)return out;
 const maps=studioTeamsV3IdentityMapInit();
 for(let t=0;t<56;t++){
  let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}
  const tacBySlot=new Map();
  if(rec&&Array.isArray(rec.players))for(let i=0;i<Math.min(10,rec.players.length);i++){
   const q=rec.players[i]||{},cls=studioTeamsV3Class(q.className);
   tacBySlot.set(i+2,{x:studioTeamsV3GlobalX(cls,q.dx),y:studioTeamsV3Clamp(q.dy,-39,39,0),className:cls,attack:!!q.attack});
  }
  const players=[],map=maps[String(t)]||Array.from({length:20},(_,i)=>i+1);
  for(let i=0;i<20;i++){
   const slot=i+1,baseSlot=Number(map[i])||slot,nr=studioTeamsV3NameRecord(t,i),nameHex=nr?.no!=null?studioTeamsV3Hex(rom.slice(nr.no,nr.no+8)):null;
   const attrs=studioTeamsV3DecodeAttr(rom.slice(studioTeamsV3AttrOffset(t,i),studioTeamsV3AttrOffset(t,i)+7))||{};
   const p={playerId:studioTeamsV3PlayerId(t,baseSlot),baseSlot,slot,name:String(nr?.name||('Jogador '+slot)),nameHex,number:attrs.number||slot,position:attrs.position||'NONE',skills:attrs.skills||{},appearance:attrs.appearance||{},tactical:null};
   if(i===0)p.tactical={x:-57,y:0,className:'GO',attack:false,fixed:true};else if(i<=10)p.tactical=tacBySlot.get(slot)||null;
   players.push(p);
  }
  out.teams[String(t)]={teamId:t,teamName:studioTeamsV3TeamName(t),formation:{index:Number(rec?.formationIndex)||0,label:String(rec?.formationLabel||'')},players};
 }
 return out;
}`);

replaceFunction('studioTeamsV3Snapshot','studioTeamsV3LegacyPlayerCustom',String.raw`function studioTeamsV3Snapshot(){
 const current=studioTeamsV3ReadFull();
 if(!window.__ISSSD_TEAMS_BASELINE_V1__)window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(current);
 const sessionBase=window.__ISSSD_TEAMS_BASELINE_V1__,out={schema:'isssd-teams-v1',version:3,mode:'sparse-overrides',identityModel:'player-id-v1',teams:{}};
 for(const [id,team] of Object.entries(current.teams||{})){
  const bt=sessionBase?.teams?.[id]||{},entry={teamId:Number(team.teamId??id),players:[]},teamCustom={};
  if(!studioTeamsV3Same(team.teamName,bt.teamName))teamCustom.teamName=team.teamName;
  if(!studioTeamsV3Same(team.formation?.index,bt.formation?.index))teamCustom.formation={index:team.formation?.index};
  if(Object.keys(teamCustom).length)entry.custom=teamCustom;
  for(const pcur of team.players||[]){
   const baseSlot=Number(pcur.baseSlot)||Number(pcur.slot),originalPlayer=studioTeamsV3OriginalPlayer(Number(id),baseSlot),custom=studioTeamsV3PlayerOverride(pcur,originalPlayer);
   const p={playerId:studioTeamsV3PlayerId(Number(id),baseSlot),baseSlot,slot:Number(pcur.slot)};if(Object.keys(custom).length)p.custom=custom;entry.players.push(p);
  }
  out.teams[id]=entry;
 }
 window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(out);return out;
}`);

replaceFunction('studioTeamsV3RestoreNames','studioTeamsV3RestoreAttrs',String.raw`function studioTeamsV3RestoreNames(state){
 const names={schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{}};
 let copied=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||!Array.isArray(ts?.players))continue;
  const base=studioTeamsV3BaselineTeam(t),players=[];
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],slot=Number(p?.slot)||i+1,baseSlot=studioTeamsV3BaseSlot(t,p,slot);if(slot<1||slot>20)continue;
   const raw=studioTeamsV3OriginalNameBytes(t,baseSlot);if(raw){rom.set(raw,playerNameFileOffset(t,slot-1));copied++}
   const custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[slot-1]);if(studioTeamsV3Has(custom,'name'))players.push({slot,name:String(custom.name||''),nameHex:String(custom.nameHex||'')||null});
  }
  if(players.length)names.teams[String(t)]={teamId:t,teamName:String(studioTeamsV3LegacyTeamCustom(ts,base).teamName||base?.teamName||studioTeamsV3TeamName(t)),players};
 }
 const customApplied=Object.keys(names.teams).length?studioRestoreNameRosterProjectState(names):false;return copied>0||!!customApplied;
}`);

replaceFunction('studioTeamsV3RestoreAttrs','studioTeamsV3RestoreTactics',String.raw`function studioTeamsV3RestoreAttrs(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  const base=studioTeamsV3BaselineTeam(t);
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],slot=(Number(p?.slot)||i+1),baseSlot=studioTeamsV3BaseSlot(t,p,slot);if(slot<1||slot>20)continue;
   const current=studioTeamsV3Clone(studioTeamsV3OriginalPlayer(t,baseSlot))||{},custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[slot-1]);
   if(studioTeamsV3Has(custom,'number'))current.number=custom.number;if(studioTeamsV3Has(custom,'position'))current.position=custom.position;
   current.skills={...(current.skills||{})};for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])if(studioTeamsV3Has(custom.skills,k))current.skills[k]=custom.skills[k];
   current.appearance={...(current.appearance||{})};for(const k of ['hair','palette'])if(studioTeamsV3Has(custom.appearance,k))current.appearance[k]=custom.appearance[k];
   const encoded=studioTeamsV3EncodeAttr(current);for(const dst of studioTeamsV3AttrOffsets(t,slot-1))rom.set(encoded,dst);count++;
  }
 }
 return count;
}`);

replaceFunction('studioTeamsV3RestoreTactics','studioTeamsV1Snapshot',String.raw`function studioTeamsV3RestoreTactics(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)continue;
  const recOff=studioTeamsV3FileOffset(rec.recordPc),target=new Uint8Array(original.slice(recOff,recOff+31)),base=studioTeamsV3BaselineTeam(t),teamCustom=studioTeamsV3LegacyTeamCustom(ts,base);
  if(studioTeamsV3Has(teamCustom.formation,'index')&&Number.isInteger(Number(teamCustom.formation.index)))target[0]=studioTeamsV3Clamp(Number(teamCustom.formation.index),0,15,target[0]);
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],slot=Number(p?.slot)||i+1;if(slot<2||slot>11)continue;const baseSlot=studioTeamsV3BaseSlot(t,p,slot),orig=studioTeamsV3OriginalTactical(t,baseSlot);if(!orig||orig.fixed)continue;
   const custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[slot-1]),q={...orig,...(custom.tactical||{})},j=slot-2,cls=studioTeamsV3Class(q.className),sourceJ=Math.max(0,Math.min(9,baseSlot-2));
   target[1+j*2]=((studioTeamsV3NativeDx(cls,q.x)%256)+256)%256;target[2+j*2]=((studioTeamsV3Clamp(q.y,-39,39,0)%256)+256)%256;
   const sourceFlag=original[recOff+21+sourceJ]||0;target[21+j]=(sourceFlag&0xF8)|studioTeamsV3ClassBits(cls)|(q.attack?0x04:0);
  }
  rom.set(target,recOff);count++;
 }
 return count;
}`);

replaceFunction('studioRestoreTeamsV1','studioCustomTeamState',String.raw`function studioRestoreTeamsV1(state){
 if(!state||state.schema!=='isssd-teams-v1')return false;
 if(Number(state.version)!==3){console.warn('ISSSD Studio: teamsV1 legado deve ser migrado pelo ensure:plus-preparation antes da abertura.');return false}
 window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(studioTeamsV3ReadFull());studioTeamsV3IdentityMapFromProject(state);window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(state);
 const names=studioTeamsV3RestoreNames(state),attrs=studioTeamsV3RestoreAttrs(state),tacs=studioTeamsV3RestoreTactics(state);
 try{syncModelsFromRom()}catch(_){}try{renderEverything?.()}catch(_){}
 console.info('ISSSD Studio teamsV1 v3 restaurado por identidade lógica',{identityModel:'player-id-v1',names:!!names,attributes:attrs,tactics:tacs});return !!names||attrs>0||tacs>0;
}`);

if(!html.includes("identityModel:'player-id-v1'"))throw new Error('Player identity v1 não foi instalado.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: player-id-v1 instalado — slot é apenas ordem atual; camisa, skills, aparência e tática pertencem à identidade do jogador.');
