import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

function replaceBlock(start,end,replacement){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 if(a<0||b<0)throw new Error(`Bloco não encontrado para fieldState: ${start}`);
 html=html.slice(0,a)+replacement+html.slice(b);
}

// Evita TDZ: estas duas tabelas const podiam ser acessadas por funções hoisted antes da inicialização.
html=html.replace(/STUDIO_TEAMS_V3_ID_TO_POS\[\(b\[4\]>>4\)&15\]\|\|'NONE'/g,"(['NONE','GO','DF','VOL','MC','MO','AT'][(b[4]>>4)&15]||'NONE')");
html=html.replace(/STUDIO_TEAMS_V3_POS_TO_ID\[String\(p\?\.position\|\|'NONE'\)\.toUpperCase\(\)\]\?\?0/g,"({NONE:0,GO:1,DF:2,VOL:3,MC:4,MO:5,AT:6}[String(p?.position||'NONE').toUpperCase()]??0)");

const snapshot=String.raw`function studioTeamsV3Path(obj,path){return String(path||'').split('.').reduce((v,k)=>v==null?undefined:v[k],obj)}
function studioTeamsV3Same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function studioTeamsV3FieldSource(saved,base,path){
 const explicit=studioTeamsV3Path(saved?.fieldState,path);
 if(explicit==='custom'||explicit==='original')return explicit;
 const sv=studioTeamsV3Path(saved,path),bv=studioTeamsV3Path(base,path);
 return sv!==undefined&&!studioTeamsV3Same(sv,bv)?'custom':'original';
}
function studioTeamsV3BaselineTeam(t){return window.__ISSSD_TEAMS_BASELINE_V1__?.teams?.[String(t)]||null}
function studioTeamsV3BaselinePlayer(t,i){return studioTeamsV3BaselineTeam(t)?.players?.[i]||null}
function studioTeamsV3MakePlayerFieldState(current,base){
 const state={name:'original',number:'original',position:'original',skills:{},appearance:{},tactical:{}};
 for(const k of ['name','number','position'])state[k]=studioTeamsV3Same(current?.[k],base?.[k])?'original':'custom';
 for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])state.skills[k]=studioTeamsV3Same(current?.skills?.[k],base?.skills?.[k])?'original':'custom';
 for(const k of ['hair','palette'])state.appearance[k]=studioTeamsV3Same(current?.appearance?.[k],base?.appearance?.[k])?'original':'custom';
 for(const k of ['x','y','className','attack'])state.tactical[k]=studioTeamsV3Same(current?.tactical?.[k],base?.tactical?.[k])?'original':'custom';
 return state;
}
function studioTeamsV3ReadFull(){
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
   const previous=studioTeamsV3PreviousPlayer(t,i)||{};
   const nr=studioTeamsV3NameRecord(t,i),nameHex=nr?.no!=null?studioTeamsV3Hex(rom.slice(nr.no,nr.no+8)):String(previous.nameHex||'')||null;
   const attrs=studioTeamsV3DecodeAttr(rom.slice(studioTeamsV3AttrOffset(t,i),studioTeamsV3AttrOffset(t,i)+7))||{};
   const p={slot:i+1,name:String(nr?.name||previous.name||('Jogador '+(i+1))),nameHex,number:attrs.number||i+1,position:attrs.position||'NONE',skills:attrs.skills||{},appearance:attrs.appearance||{},tactical:null};
   if(i===0)p.tactical={x:-57,y:0,className:'GO',attack:false,fixed:true};
   else if(i<=10)p.tactical=tacBySlot.get(i+1)||null;
   players.push(p);
  }
  const custom=!!studioCustomTeamState(t);
  out.teams[String(t)]={teamId:t,teamName:studioTeamsV3TeamName(t),formation:{index:Number(rec?.formationIndex)||0,label:String(rec?.formationLabel||''),custom},players};
 }
 return out;
}
function studioTeamsV3Snapshot(){
 const current=studioTeamsV3ReadFull();
 if(!window.__ISSSD_TEAMS_BASELINE_V1__)window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(current);
 const base=window.__ISSSD_TEAMS_BASELINE_V1__;
 for(const [id,team] of Object.entries(current.teams||{})){
  const bt=base?.teams?.[id]||{};
  team.fieldState={teamName:studioTeamsV3Same(team.teamName,bt.teamName)?'original':'custom',formation:{index:studioTeamsV3Same(team.formation?.index,bt.formation?.index)?'original':'custom'}};
  for(let i=0;i<(team.players||[]).length;i++)team.players[i].fieldState=studioTeamsV3MakePlayerFieldState(team.players[i],bt.players?.[i]);
 }
 window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(current);
 return current;
}
`;
replaceBlock('function studioTeamsV3Snapshot(){','function studioTeamsV3RestoreNames(state){',snapshot);

const restoreNames=String.raw`function studioTeamsV3RestoreNames(state){
 const names={schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{}};
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||!Array.isArray(ts?.players))continue;
  const base=studioTeamsV3BaselineTeam(t),players=[];
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],bp=base?.players?.[i];
   if(studioTeamsV3FieldSource(p,bp,'name')!=='custom')continue;
   players.push({slot:Number(p.slot),name:String(p.name||''),nameHex:String(p.nameHex||'')||null});
  }
  if(players.length)names.teams[String(t)]={teamId:t,teamName:String(ts.teamName||studioTeamsV3TeamName(t)),players};
 }
 if(!Object.keys(names.teams).length)return false;
 return studioRestoreNameRosterProjectState(names);
}
`;
replaceBlock('function studioTeamsV3RestoreNames(state){','function studioTeamsV3RestoreAttrs(state){',restoreNames);

const restoreAttrs=String.raw`function studioTeamsV3RestoreAttrs(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  const base=studioTeamsV3BaselineTeam(t);
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],bp=base?.players?.[i],slot=Number(p?.slot)-1;if(!Number.isInteger(slot)||slot<0||slot>=20)continue;
   const off=studioTeamsV3AttrOffset(t,slot),current=studioTeamsV3DecodeAttr(rom.slice(off,off+7))||{};
   let changed=false;
   if(studioTeamsV3FieldSource(p,bp,'number')==='custom'){current.number=p.number;changed=true}
   if(studioTeamsV3FieldSource(p,bp,'position')==='custom'){current.position=p.position;changed=true}
   current.skills={...(current.skills||{})};
   for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])if(studioTeamsV3FieldSource(p,bp,'skills.'+k)==='custom'){current.skills[k]=p?.skills?.[k];changed=true}
   current.appearance={...(current.appearance||{})};
   for(const k of ['hair','palette'])if(studioTeamsV3FieldSource(p,bp,'appearance.'+k)==='custom'){current.appearance[k]=p?.appearance?.[k];changed=true}
   if(!changed)continue;
   const encoded=studioTeamsV3EncodeAttr(current);for(const dst of studioTeamsV3AttrOffsets(t,slot))rom.set(encoded,dst);count++;
  }
 }
 return count;
}
`;
replaceBlock('function studioTeamsV3RestoreAttrs(state){','function studioTeamsV3RestoreTactics(state){',restoreAttrs);

const restoreTactics=String.raw`function studioTeamsV3RestoreTactics(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  let rec=null;try{rec=plusTacticalRecordForTeam(t)}catch(_){}
  if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)continue;
  const base=studioTeamsV3BaselineTeam(t),target=new Uint8Array(rec.raw);let changed=false;
  const formationSource=ts?.fieldState?.formation?.index||(!studioTeamsV3Same(ts?.formation?.index,base?.formation?.index)?'custom':'original');
  if(formationSource==='custom'&&Number.isInteger(Number(ts?.formation?.index))){target[0]=studioTeamsV3Clamp(Number(ts.formation.index),0,15,target[0]);changed=true}
  for(let i=0;i<10;i++){
   const p=ts.players.find(x=>Number(x?.slot)===i+2),bp=base?.players?.[i+1],q=p?.tactical;if(!p||!q)continue;
   const flagIndex=21+i,currentFlag=target[flagIndex],bits=currentFlag&3,currentCls=bits===1?'DF':bits===2?'MC':'AT';
   const classCustom=studioTeamsV3FieldSource(p,bp,'tactical.className')==='custom',xCustom=studioTeamsV3FieldSource(p,bp,'tactical.x')==='custom';
   if(xCustom){const cls=classCustom?studioTeamsV3Class(q.className):currentCls;target[1+i*2]=((studioTeamsV3NativeDx(cls,q.x)%256)+256)%256;changed=true}
   if(studioTeamsV3FieldSource(p,bp,'tactical.y')==='custom'){target[2+i*2]=((studioTeamsV3Clamp(q.y,-39,39,0)%256)+256)%256;changed=true}
   let nextFlag=currentFlag;
   if(classCustom){nextFlag=(nextFlag&0xFC)|studioTeamsV3ClassBits(q.className);changed=true}
   if(studioTeamsV3FieldSource(p,bp,'tactical.attack')==='custom'){nextFlag=q.attack?(nextFlag|0x04):(nextFlag&~0x04);changed=true}
   target[flagIndex]=nextFlag;
  }
  if(!changed)continue;
  rom.set(target,studioTeamsV3FileOffset(rec.recordPc));count++;
  try{const xs=ts.players.slice(1,11).map(p=>Number(p?.tactical?.x)||0);studioSetCustomTeamState(t,{formationIndex:target[0],counts:studioFormationCountsFromGlobalX(xs)})}catch(_){}
 }
 return count;
}
`;
replaceBlock('function studioTeamsV3RestoreTactics(state){','function studioTeamsV1Snapshot(){',restoreTactics);

const wrappers=String.raw`function studioTeamsV1Snapshot(){return studioTeamsV3Snapshot()}
function studioRestoreTeamsV1(state){
 if(!state||state.schema!=='isssd-teams-v1')return false;
 if(Number(state.version)!==3){console.warn('ISSSD Studio: teamsV1 legado deve ser migrado pelo ensure:plus-preparation antes da abertura.');return false}
 // Baseline é capturado ANTES de aplicar o projeto. Ele define o que é original.
 window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(studioTeamsV3ReadFull());
 window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(state);
 const names=studioTeamsV3RestoreNames(state),attrs=studioTeamsV3RestoreAttrs(state),tacs=studioTeamsV3RestoreTactics(state);
 try{syncModelsFromRom()}catch(_){}try{renderEverything?.()}catch(_){}
 console.info('ISSSD Studio teamsV1 v3 restaurado por fieldState',{names:!!names,attributes:attrs,tactics:tacs});return !!names||attrs>0||tacs>0;
}
`;
replaceBlock('function studioTeamsV1Snapshot(){','function studioCustomTeamState(team){',wrappers);

if(!html.includes('window.__ISSSD_TEAMS_BASELINE_V1__'))throw new Error('fieldState: baseline da ROM não foi instalado.');
if(!html.includes("name:'original',number:'original',position:'original'"))throw new Error('fieldState: estado original/custom não foi instalado.');
if(/STUDIO_TEAMS_V3_ID_TO_POS\[/.test(html)||/STUDIO_TEAMS_V3_POS_TO_ID\[/.test(html))throw new Error('fieldState: referência TDZ aos mapas de posição permaneceu no HTML final.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: fieldState original/custom instalado; somente campos customizados são restaurados; TDZ de posição eliminado.');
