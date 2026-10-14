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
  if(!needsTactic)for(let i=0;i<ts.players.length;i++){const p=ts.players[i],bp=base?.players?.[(Number(p?.slot)||i+1)-1],custom=studioTeamsV3LegacyPlayerCustom(p,bp);if(custom?.tactical&&Object.keys(custom.tactical).length){needsTactic=true;break}}
  if(!needsTactic)continue;
  const rec=studioTeamsV3RequireExclusive4MiBTactic(t);
  const target=new Uint8Array(rec.raw);let changed=false;
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

html=html.slice(0,a)+replacement+html.slice(b);
if(html.includes('const slots=[0x5FE9F,0x5FEBE]'))throw new Error('Táticas 4 MiB: lógica antiga de dois slots nativos permaneceu.');
if(!html.includes('body!==0x400000'))throw new Error('Táticas 4 MiB: validação obrigatória de 4 MiB ausente.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: restauração tática usa exclusivamente o banco individualizado da preparação obrigatória de 4 MiB; limite de dois slots nativos removido.');
