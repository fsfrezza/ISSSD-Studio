import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

function replaceBlock(start,end,replacement){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 if(a<0||b<0)throw new Error(`Bloco não encontrado para sparse overrides: ${start}`);
 html=html.slice(0,a)+replacement+html.slice(b);
}

// Evita TDZ: estas duas tabelas const podiam ser acessadas por funções hoisted antes da inicialização.
html=html.replace(/STUDIO_TEAMS_V3_ID_TO_POS\[\(b\[4\]>>4\)&15\]\|\|'NONE'/g,"(['NONE','GO','DF','VOL','MC','MO','AT'][(b[4]>>4)&15]||'NONE')");
html=html.replace(/STUDIO_TEAMS_V3_POS_TO_ID\[String\(p\?\.position\|\|'NONE'\)\.toUpperCase\(\)\]\?\?0/g,"({NONE:0,GO:1,DF:2,VOL:3,MC:4,MO:5,AT:6}[String(p?.position||'NONE').toUpperCase()]??0)");

const snapshot=String.raw`function studioTeamsV3Same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function studioTeamsV3Has(o,k){return !!o&&Object.prototype.hasOwnProperty.call(o,k)}
function studioTeamsV3BaselineTeam(t){return window.__ISSSD_TEAMS_BASELINE_V1__?.teams?.[String(t)]||null}
function studioTeamsV3BaselinePlayer(t,i){return studioTeamsV3BaselineTeam(t)?.players?.[i]||null}
function studioTeamsV3ReadFull(){
 const out={schema:'isssd-teams-v1',version:3,mode:'resolved-rom-state',teams:{}};
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
   const nr=studioTeamsV3NameRecord(t,i),nameHex=nr?.no!=null?studioTeamsV3Hex(rom.slice(nr.no,nr.no+8)):null;
   const attrs=studioTeamsV3DecodeAttr(rom.slice(studioTeamsV3AttrOffset(t,i),studioTeamsV3AttrOffset(t,i)+7))||{};
   const p={slot:i+1,name:String(nr?.name||('Jogador '+(i+1))),nameHex,number:attrs.number||i+1,position:attrs.position||'NONE',skills:attrs.skills||{},appearance:attrs.appearance||{},tactical:null};
   if(i===0)p.tactical={x:-57,y:0,className:'GO',attack:false,fixed:true};
   else if(i<=10)p.tactical=tacBySlot.get(i+1)||null;
   players.push(p);
  }
  out.teams[String(t)]={teamId:t,teamName:studioTeamsV3TeamName(t),formation:{index:Number(rec?.formationIndex)||0,label:String(rec?.formationLabel||'')},players};
 }
 return out;
}
function studioTeamsV3PlayerOverride(current,base){
 const custom={};
 for(const k of ['name','number','position'])if(!studioTeamsV3Same(current?.[k],base?.[k]))custom[k]=current?.[k];
 if(studioTeamsV3Has(custom,'name')&&current?.nameHex)custom.nameHex=current.nameHex;
 const skills={};
 for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])if(!studioTeamsV3Same(current?.skills?.[k],base?.skills?.[k]))skills[k]=current?.skills?.[k];
 if(Object.keys(skills).length)custom.skills=skills;
 const appearance={};
 for(const k of ['hair','palette'])if(!studioTeamsV3Same(current?.appearance?.[k],base?.appearance?.[k]))appearance[k]=current?.appearance?.[k];
 if(Object.keys(appearance).length)custom.appearance=appearance;
 const tactical={};
 for(const k of ['x','y','className','attack'])if(!studioTeamsV3Same(current?.tactical?.[k],base?.tactical?.[k]))tactical[k]=current?.tactical?.[k];
 if(Object.keys(tactical).length)custom.tactical=tactical;
 return custom;
}
function studioTeamsV3Snapshot(){
 const current=studioTeamsV3ReadFull();
 if(!window.__ISSSD_TEAMS_BASELINE_V1__)window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(current);
 const base=window.__ISSSD_TEAMS_BASELINE_V1__,out={schema:'isssd-teams-v1',version:3,mode:'sparse-overrides',teams:{}};
 for(const [id,team] of Object.entries(current.teams||{})){
  const bt=base?.teams?.[id]||{},entry={teamId:Number(team.teamId??id),players:[]},teamCustom={};
  if(!studioTeamsV3Same(team.teamName,bt.teamName))teamCustom.teamName=team.teamName;
  if(!studioTeamsV3Same(team.formation?.index,bt.formation?.index))teamCustom.formation={index:team.formation?.index};
  if(Object.keys(teamCustom).length)entry.custom=teamCustom;
  for(let i=0;i<(team.players||[]).length;i++){
   const custom=studioTeamsV3PlayerOverride(team.players[i],bt.players?.[i]);
   const p={slot:i+1};if(Object.keys(custom).length)p.custom=custom;entry.players.push(p);
  }
  out.teams[id]=entry;
 }
 window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(out);
 return out;
}
function studioTeamsV3LegacyPlayerCustom(p,bp){
 if(p?.custom&&typeof p.custom==='object')return studioTeamsV3Clone(p.custom)||{};
 const custom={},fs=p?.fieldState||{};
 const take=(path,value,baseValue,flag)=>{if(flag==='custom'||(flag==null&&value!==undefined&&!studioTeamsV3Same(value,baseValue)))return value;return undefined};
 for(const k of ['name','number','position']){const v=take(k,p?.[k],bp?.[k],fs?.[k]);if(v!==undefined)custom[k]=v}
 if(studioTeamsV3Has(custom,'name')&&p?.nameHex)custom.nameHex=p.nameHex;
 const skills={};for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy']){const v=take('skills.'+k,p?.skills?.[k],bp?.skills?.[k],fs?.skills?.[k]);if(v!==undefined)skills[k]=v}if(Object.keys(skills).length)custom.skills=skills;
 const appearance={};for(const k of ['hair','palette']){const v=take('appearance.'+k,p?.appearance?.[k],bp?.appearance?.[k],fs?.appearance?.[k]);if(v!==undefined)appearance[k]=v}if(Object.keys(appearance).length)custom.appearance=appearance;
 const tactical={};for(const k of ['x','y','className','attack']){const v=take('tactical.'+k,p?.tactical?.[k],bp?.tactical?.[k],fs?.tactical?.[k]);if(v!==undefined)tactical[k]=v}if(Object.keys(tactical).length)custom.tactical=tactical;
 return custom;
}
function studioTeamsV3LegacyTeamCustom(ts,base){
 if(ts?.custom&&typeof ts.custom==='object')return studioTeamsV3Clone(ts.custom)||{};
 const custom={},fs=ts?.fieldState||{};
 if(fs?.teamName==='custom'||(fs?.teamName==null&&ts?.teamName!==undefined&&!studioTeamsV3Same(ts.teamName,base?.teamName)))custom.teamName=ts.teamName;
 const formationCustom=fs?.formation?.index==='custom'||(fs?.formation?.index==null&&ts?.formation?.index!==undefined&&!studioTeamsV3Same(ts.formation?.index,base?.formation?.index));
 if(formationCustom)custom.formation={index:ts.formation.index};
 return custom;
}
`;
replaceBlock('function studioTeamsV3Snapshot(){','function studioTeamsV3RestoreNames(state){',snapshot);

const restoreNames=String.raw`function studioTeamsV3RestoreNames(state){
 const names={schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{}};
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||!Array.isArray(ts?.players))continue;
  const base=studioTeamsV3BaselineTeam(t),players=[];
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[i]);if(!studioTeamsV3Has(custom,'name'))continue;
   players.push({slot:Number(p.slot)||i+1,name:String(custom.name||''),nameHex:String(custom.nameHex||'')||null});
  }
  if(players.length)names.teams[String(t)]={teamId:t,teamName:String(studioTeamsV3LegacyTeamCustom(ts,base).teamName||base?.teamName||studioTeamsV3TeamName(t)),players};
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
   const p=ts.players[i],custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[i]),slot=(Number(p?.slot)||i+1)-1;if(!Number.isInteger(slot)||slot<0||slot>=20)continue;
   const off=studioTeamsV3AttrOffset(t,slot),current=studioTeamsV3DecodeAttr(rom.slice(off,off+7))||{};let changed=false;
   if(studioTeamsV3Has(custom,'number')){current.number=custom.number;changed=true}
   if(studioTeamsV3Has(custom,'position')){current.position=custom.position;changed=true}
   current.skills={...(current.skills||{})};for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])if(studioTeamsV3Has(custom.skills,k)){current.skills[k]=custom.skills[k];changed=true}
   current.appearance={...(current.appearance||{})};for(const k of ['hair','palette'])if(studioTeamsV3Has(custom.appearance,k)){current.appearance[k]=custom.appearance[k];changed=true}
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
  const base=studioTeamsV3BaselineTeam(t),target=new Uint8Array(rec.raw),teamCustom=studioTeamsV3LegacyTeamCustom(ts,base);let changed=false;
  if(studioTeamsV3Has(teamCustom.formation,'index')&&Number.isInteger(Number(teamCustom.formation.index))){target[0]=studioTeamsV3Clamp(Number(teamCustom.formation.index),0,15,target[0]);changed=true}
  for(let i=0;i<10;i++){
   const p=ts.players.find(x=>Number(x?.slot)===i+2);if(!p)continue;const custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[i+1]),q=custom.tactical;if(!q)continue;
   const flagIndex=21+i,currentFlag=target[flagIndex],bits=currentFlag&3,currentCls=bits===1?'DF':bits===2?'MC':'AT';
   const className=studioTeamsV3Has(q,'className')?studioTeamsV3Class(q.className):currentCls;
   if(studioTeamsV3Has(q,'x')){target[1+i*2]=((studioTeamsV3NativeDx(className,q.x)%256)+256)%256;changed=true}
   if(studioTeamsV3Has(q,'y')){target[2+i*2]=((studioTeamsV3Clamp(q.y,-39,39,0)%256)+256)%256;changed=true}
   let nextFlag=currentFlag;
   if(studioTeamsV3Has(q,'className')){nextFlag=(nextFlag&0xFC)|studioTeamsV3ClassBits(q.className);changed=true}
   if(studioTeamsV3Has(q,'attack')){nextFlag=q.attack?(nextFlag|0x04):(nextFlag&~0x04);changed=true}
   target[flagIndex]=nextFlag;
  }
  if(!changed)continue;
  rom.set(target,studioTeamsV3FileOffset(rec.recordPc));count++;
 }
 return count;
}
`;
replaceBlock('function studioTeamsV3RestoreTactics(state){','function studioTeamsV1Snapshot(){',restoreTactics);

const wrappers=String.raw`function studioTeamsV1Snapshot(){return studioTeamsV3Snapshot()}
function studioRestoreTeamsV1(state){
 if(!state||state.schema!=='isssd-teams-v1')return false;
 if(Number(state.version)!==3){console.warn('ISSSD Studio: teamsV1 legado deve ser migrado pelo ensure:plus-preparation antes da abertura.');return false}
 // Baseline é capturado ANTES do projeto. Ausência de override significa: preserve exatamente a ROM.
 window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(studioTeamsV3ReadFull());
 window.__ISSSD_TEAMS_V1__=studioTeamsV3Clone(state);
 const names=studioTeamsV3RestoreNames(state),attrs=studioTeamsV3RestoreAttrs(state),tacs=studioTeamsV3RestoreTactics(state);
 try{syncModelsFromRom()}catch(_){}try{renderEverything?.()}catch(_){}
 console.info('ISSSD Studio teamsV1 v3 restaurado por sparse overrides',{names:!!names,attributes:attrs,tactics:tacs});return !!names||attrs>0||tacs>0;
}
`;
replaceBlock('function studioTeamsV1Snapshot(){','function studioCustomTeamState(team){',wrappers);

if(!html.includes("mode:'sparse-overrides'"))throw new Error('Sparse overrides: snapshot não foi instalado.');
if(html.includes('fieldState:{')||html.includes("name:'original',number:'original',position:'original'"))throw new Error('Sparse overrides: fieldState ainda está sendo salvo.');
if(/STUDIO_TEAMS_V3_ID_TO_POS\[/.test(html)||/STUDIO_TEAMS_V3_POS_TO_ID\[/.test(html))throw new Error('Sparse overrides: referência TDZ aos mapas de posição permaneceu no HTML final.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: sparse overrides instalados — presença do campo aplica customização; ausência preserva a ROM; fieldState removido do formato salvo.');
