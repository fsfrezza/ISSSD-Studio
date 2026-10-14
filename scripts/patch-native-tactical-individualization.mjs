import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const start='function studioTeamsV3RestoreTactics(state){';
const end='function studioTeamsV1Snapshot(){';
const a=html.indexOf(start),b=html.indexOf(end,a);
if(a<0||b<0)throw new Error('Táticas 4 MiB: bloco studioTeamsV3RestoreTactics não encontrado.');

const replacement=String.raw`function studioTeamsV3TacticalUsers(recordPc){
 const users=[];for(let team=0;team<56;team++){let r=null;try{r=plusTacticalRecordForTeam(team)}catch(_){}if(r&&Number(r.recordPc)===Number(recordPc))users.push(team)}return users;
}
function studioTeamsV3NativeBaselineTactical(team,baseSlot){
 if(baseSlot===1)return {x:-57,y:0,className:'GO',attack:false,fixed:true};
 if(baseSlot<2||baseSlot>11)return null;
 const raw=window.__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__?.teams?.[String(team)]?.raw;
 if(!Array.isArray(raw)||raw.length!==31)throw new Error('Baseline tática nativa ausente para equipe '+team+'.');
 const j=baseSlot-2,flag=Number(raw[21+j])||0,bits=flag&3,cls=bits===1?'DF':bits===2?'MC':'AT';
 return {x:studioTeamsV3GlobalX(cls,studioTeamsV3Signed8(raw[1+j*2])),y:studioTeamsV3Clamp(studioTeamsV3Signed8(raw[2+j*2]),-39,39,0),className:cls,attack:!!(flag&4),rawFlag:flag};
}
function studioTeamsV3RequireExclusive4MiBTactic(team){
 let rec=null;try{rec=plusTacticalRecordForTeam(team)}catch(_){}
 if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)throw new Error('Tática não resolvida para equipe '+team);
 const hs=(rom?.length%0x8000===0x200)?0x200:0,body=(rom?.length||0)-hs;
 if(body!==0x400000)throw new Error('A tática da equipe '+team+' exige a preparação obrigatória de 4 MiB; obtido '+body+' bytes.');
 const users=studioTeamsV3TacticalUsers(rec.recordPc);
 if(users.length!==1||users[0]!==team)throw new Error('A equipe '+team+' ainda compartilha registro tático após a preparação obrigatória de 4 MiB.');
 return rec;
}
function studioTeamsV3RestoreTactics(state){
 let count=0;
 for(const [key,ts] of Object.entries(state?.teams||{})){
  const t=Number(ts?.teamId??key);if(!Number.isInteger(t)||t<0||t>=56||!Array.isArray(ts?.players))continue;
  const base=studioTeamsV3BaselineTeam(t),teamCustom=studioTeamsV3LegacyTeamCustom(ts,base);let needsTactic=!!(teamCustom?.formation&&studioTeamsV3Has(teamCustom.formation,'index'));
  for(let i=0;i<ts.players.length&&!needsTactic;i++){
   const p=ts.players[i],slot=Number(p?.slot)||i+1,baseSlot=studioTeamsV3BaseSlot(t,p,slot),custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[slot-1]);
   if((slot>=2&&slot<=11&&baseSlot!==slot)||(custom?.tactical&&Object.keys(custom.tactical).length))needsTactic=true;
  }
  if(!needsTactic)continue;
  const rec=studioTeamsV3RequireExclusive4MiBTactic(t),target=new Uint8Array(rec.raw);let changed=false;
  if(studioTeamsV3Has(teamCustom.formation,'index')&&Number.isInteger(Number(teamCustom.formation.index))){target[0]=studioTeamsV3Clamp(Number(teamCustom.formation.index),0,15,target[0]);changed=true}
  for(let i=0;i<ts.players.length;i++){
   const p=ts.players[i],slot=Number(p?.slot)||i+1;if(slot<2||slot>11)continue;
   const baseSlot=studioTeamsV3BaseSlot(t,p,slot),orig=studioTeamsV3NativeBaselineTactical(t,baseSlot);if(!orig||orig.fixed)continue;
   const custom=studioTeamsV3LegacyPlayerCustom(p,base?.players?.[slot-1]),q={...orig,...(custom.tactical||{})},j=slot-2,cls=studioTeamsV3Class(q.className);
   target[1+j*2]=((studioTeamsV3NativeDx(cls,q.x)%256)+256)%256;
   target[2+j*2]=((studioTeamsV3Clamp(q.y,-39,39,0)%256)+256)%256;
   const currentFlag=target[21+j]||0;
   target[21+j]=(currentFlag&0xF8)|studioTeamsV3ClassBits(cls)|(q.attack?0x04:0);
   changed=true;
  }
  if(!changed)continue;
  rom.set(target,studioTeamsV3FileOffset(rec.recordPc));count++;
 }
 return count;
}
`;

html=html.slice(0,a)+replacement+html.slice(b);
if(html.includes('const slots=[0x5FE9F,0x5FEBE]'))throw new Error('Táticas 4 MiB: lógica antiga de dois slots nativos permaneceu.');
if(!html.includes('__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__'))throw new Error('Táticas 4 MiB: restauração não usa baseline nativa pré-expansão.');
if(!html.includes('studioTeamsV3BaseSlot(t,p,slot)'))throw new Error('Táticas 4 MiB: restauração não está vinculada à identidade lógica do jogador.');
if(!html.includes('body!==0x400000'))throw new Error('Táticas 4 MiB: validação obrigatória de 4 MiB ausente.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: restauração tática 4 MiB usa baseline nativa pré-expansão e identidade lógica; posições salvas acompanham cada jogador no round-trip.');
