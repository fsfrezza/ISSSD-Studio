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
if(a<0||b<0)throw new Error('Não encontrei o bloco teamsV1 para instalar o schema canônico v3.');

const replacement=String.raw`function studioTeamsV3Clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(_){return null}}
function studioTeamsV3Hex(bytes){return Array.from(bytes||[]).map(v=>(Number(v)&255).toString(16).toUpperCase().padStart(2,'0')).join('')}
function studioTeamsV3Unhex(hex,len){const s=String(hex||'').replace(/[^0-9a-f]/gi,'');if(s.length!==len*2)return null;const out=new Uint8Array(len);for(let i=0;i<len;i++)out[i]=parseInt(s.slice(i*2,i*2+2),16);return out}
function studioTeamsV3FileOffset(pc){const hs=(rom?.length%0x8000===0x200)?0x200:0;return hs+(Number(pc)||0)}
function studioTeamsV3AttrOffset(team,index){return studioTeamsV3FileOffset(0x150000+(Number(team)*20+Number(index))*7)}
const STUDIO_TEAMS_V3_POS_TO_ID={NONE:0,GO:1,DF:2,VOL:3,MC:4,MO:5,AT:6};
const STUDIO_TEAMS_V3_ID_TO_POS=['NONE','GO','DF','VOL','MC','MO','AT'];
function studioTeamsV3DecodeAttr(bytes){
 const b=Array.from(bytes||[]);if(b.length!==7)return null;
 return {number:(b[5]&255)+1,position:STUDIO_TEAMS_V3_ID_TO_POS[(b[4]>>4)&15]||'NONE',
  skills:{acceleration:(b[0]>>4)+1,speed:(b[0]&15)+1,shot:(b[1]>>4)+1,curve:(b[1]&15)+1,balance:(b[2]>>4)+1,intelligence:(b[2]&15)+1,dribbling:(b[3]>>4)+1,jump:(b[3]&15)+1,energy:(b[4]&15)+1},
  appearance:{hair:(b[6]>>4)&15,palette:b[6]&15}};
}
function studioTeamsV3Clamp(v,min,max,def=min){v=Number(v);return Number.isFinite(v)?Math.max(min,Math.min(max,Math.round(v))):def}
function studioTeamsV3EncodeAttr(p){
 const s=p?.skills||{},ap=p?.appearance||{},pos=STUDIO_TEAMS_V3_POS_TO_ID[String(p?.position||'NONE').toUpperCase()]??0;
 const n=(k)=>studioTeamsV3Clamp(s[k],1,10,1)-1;
 return new Uint8Array([(n('acceleration')<<4)|n('speed'),(n('shot')<<4)|n('curve'),(n('balance')<<4)|n('intelligence'),(n('dribbling')<<4)|n('jump'),(pos<<4)|n('energy'),studioTeamsV3Clamp(p?.number,1,99,1)-1,(studioTeamsV3Clamp(ap.hair,0,15,0)<<4)|studioTeamsV3Clamp(ap.palette,0,15,0)]);
}
function studioTeamsV3Class(v){v=String(v||'').toUpperCase();return v==='DF'?'DF':(v==='MC'||v==='MF')?'MC':(v==='AT'||v==='FW')?'AT':'DF'}
function studioTeamsV3GlobalX(cls,dx){const c=studioTeamsV3Class(cls),base=c==='DF'?-39:c==='MC'?0:39;return studioTeamsV3Clamp(base+(Number(dx)||0),-57,57,base)}
function studioTeamsV3NativeDx(cls,x){const c=studioTeamsV3Class(cls),base=c==='DF'?-39:c==='MC'?0:39;return studioTeamsV3Clamp((Number(x)||0)-base,-40,40,0)}
function studioTeamsV3ClassBits(cls){const c=studioTeamsV3Class(cls);return c==='DF'?1:c==='MC'?2:3}
function studioTeamsV3TeamName(t){try{return String(TEAM_NAMES?.[t]||BASE_TEAM_NAMES?.[t]||('TEAM '+t))}catch(_){return 'TEAM '+t}}
function studioTeamsV3NameRecord(t,i){try{return readPlayerRecordFromRom(t,i,rom)}catch(_){return null}}
function studioTeamsV3Snapshot(){
 const out={schema:'isssd-teams-v1',version:3,teams:{}};
 if(activeRomProfile?.id!=='iss-deluxe-plus'||!rom)return out;
 for(let t=0;t<56;t++){
  let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}
  const tacBySlot=new Map();
  if(rec&&Array.isArray(rec.players))for(let i=0;i<Math.min(10,rec.players.length);i++){
   const q=rec.players[i]||{},cls=studioTeamsV3Class(q.className);
   tacBySlot.set(i+2,{x:studioTeamsV3GlobalX(cls,q.dx),y:studioTeamsV3Clamp(q.dy,-39,39,0),className:cls,attack:!!q.attack});
  }
  const players=[];
  for(let i=0;i<20;i++){
   const live=teams?.[t]?.players?.[i]||{};
   const nr=studioTeamsV3NameRecord(t,i),nameHex=nr?.no!=null?studioTeamsV3Hex(rom.slice(nr.no,nr.no+8)):null;
   const attrs=studioTeamsV3DecodeAttr(rom.slice(studioTeamsV3AttrOffset(t,i),studioTeamsV3AttrOffset(t,i)+7))||{};
   const p={slot:i+1,name:String(live.name||('Jogador '+(i+1))),nameHex,number:attrs.number||i+1,position:attrs.position||'NONE',skills:attrs.skills||{},appearance:attrs.appearance||{},tactical:null};
   if(i===0)p.tactical={x:-57,y:0,className:'GO',attack:false,fixed:true};
   else if(i<=10)p.tactical=tacBySlot.get(i+1)||null;
   players.push(p);
  }
  const custom=!!studioCustomTeamState(t);
  out.teams[String(t)]={teamId:t,teamName:studioTeamsV3TeamName(t),formation:{index:Number(rec?.formationIndex)||0,label:String(rec?.formationLabel||''),custom},players};
 }
 return out;
}
function studioTeamsV3RestoreNames(state){
 const names={schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{}};
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||!Array.isArray(ts?.players))continue;
  names.teams[String(t)]={teamId:t,teamName:String(ts.teamName||studioTeamsV3TeamName(t)),players:ts.players.map(p=>({slot:Number(p.slot),name:String(p.name||''),nameHex:String(p.nameHex||'')||null}))};
 }
 return studioRestoreNameRosterProjectState(names);
}
function studioTeamsV3RestoreAttrs(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  for(const p of ts.players){const i=Number(p?.slot)-1;if(!Number.isInteger(i)||i<0||i>=20)continue;rom.set(studioTeamsV3EncodeAttr(p),studioTeamsV3AttrOffset(t,i));count++}
 }
 return count;
}
function studioTeamsV3RestoreTactics(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}
  if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)continue;
  const target=new Uint8Array(rec.raw),fi=Number(ts?.formation?.index);if(Number.isInteger(fi))target[0]=studioTeamsV3Clamp(fi,0,15,target[0]);
  for(let i=0;i<10;i++){
   const p=ts.players.find(x=>Number(x?.slot)===i+2),q=p?.tactical;if(!q)continue;
   const cls=studioTeamsV3Class(q.className);target[1+i*2]=((studioTeamsV3NativeDx(cls,q.x)%256)+256)%256;target[2+i*2]=((studioTeamsV3Clamp(q.y,-39,39,0)%256)+256)%256;
   target[21+i]=(target[21+i]&0xF8)|studioTeamsV3ClassBits(cls)|(q.attack?0x04:0);
  }
  rom.set(target,studioTeamsV3FileOffset(rec.recordPc));count++;
  try{if(ts?.formation?.custom){const xs=ts.players.slice(1,11).map(p=>Number(p?.tactical?.x)||0);studioSetCustomTeamState(t,{formationIndex:target[0],counts:studioFormationCountsFromGlobalX(xs)})}else studioSetCustomTeamState(t,null)}catch(_){}
 }
 return count;
}
function studioTeamsV1Snapshot(){return studioTeamsV3Snapshot()}
function studioRestoreTeamsV1(state){
 if(!state||state.schema!=='isssd-teams-v1')return false;
 if(Number(state.version)!==3){console.warn('ISSSD Studio: teamsV1 legado deve ser migrado pelo ensure:plus-preparation antes da abertura.');return false}
 window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(state);
 const names=studioTeamsV3RestoreNames(state),attrs=studioTeamsV3RestoreAttrs(state),tacs=studioTeamsV3RestoreTactics(state);
 try{syncModelsFromRom()}catch(_){}try{renderEverything?.()}catch(_){}
 console.info('ISSSD Studio teamsV1 v3 restaurado',{names:!!names,attributes:attrs,tactics:tacs});return !!names||attrs>0||tacs>0;
}
`;

html=html.slice(0,a)+replacement+html.slice(b);
// Evita reintroduzir atributos de jogadores via patchesCompact/deferredOverlay: teamsV1 v3 é a fonte canônica.
const oldMerge='const projectPatches=studioMergePatchLists(studioSanitizeProjectPatches(currentPatches,studioBuildRegionSet()),deferredOverlay);';
const newMerge='const projectPatches=studioSanitizeProjectPatches(studioMergePatchLists(studioSanitizeProjectPatches(currentPatches,studioBuildRegionSet()),deferredOverlay),studioBuildRegionSet());';
if(html.includes(oldMerge))html=html.replace(oldMerge,newMerge);
if(!html.includes("schema:'isssd-teams-v1',version:3"))throw new Error('teamsV1 v3 não foi instalado.');
if(html.includes('const off=fo(rec.recordPc)'))throw new Error('Dependência lexical insegura de fo() permaneceu no runtime de persistência.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: teamsV1 v3 canônico instalado — jogador reúne nome, camisa, posição, skills, aparência e posição tática; sem fo().');
