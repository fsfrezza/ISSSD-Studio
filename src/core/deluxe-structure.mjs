import {applyDeluxeStructureNames} from './deluxe-structure-names.mjs';
import {DELUXE_TEAMS} from './deluxe-team-catalog.mjs';
import {readDeluxeGroups,DELUXE_GROUP_LABELS} from './deluxe-groups.mjs';
export const STRUCTURE_LAYOUT={marker:0x1764f0,tables:0x176500,attributes:0x17bd20,names:0x185000,a4:0x126180,groupHelper:0x2ff00};
const signature=new TextEncoder().encode('ISSD54V1');
const word=(a,p)=>a[p]|a[p+1]<<8;
const cpu=pc=>((0x80|(pc>>15))<<16)|0x8000|(pc&32767);
const pcOf=a=>((a>>>16)&127)*32768+(a&32767);
const bytes24=n=>[n&255,n>>8&255,n>>16&255];
const u16=n=>[n&255,n>>8&255];
export function structureActive(base){return signature.every((v,i)=>base[STRUCTURE_LAYOUT.marker+i]===v);}
export function expandedPlayerOffsets(base,team,player){
 const count=base[STRUCTURE_LAYOUT.marker+8];if(!structureActive(base)||!Number.isInteger(team)||team<0||team>=count||!Number.isInteger(player)||player<0||player>=20)throw Error('Jogador fora da estrutura ampliada');return {record:STRUCTURE_LAYOUT.attributes+(team*20+player)*7,name:STRUCTURE_LAYOUT.names+team*160+player*8};
}
export function validateDeluxeStructure(s){
 if(!s||s.schema!=='isssd-deluxe-structure-v1'||s.experimental!==true||Object.keys(s).some(k=>!['schema','experimental','teams','groups','labels'].includes(k)))throw Error('Estrutura experimental inválida');
 const n=s.teams?.length;if(![42,48,54].includes(n))throw Error('Estrutura: use 42, 48 ou 54 equipes, em grupos completos');
 for(let i=0;i<n;i++){const t=s.teams[i];if(!t||Object.keys(t).some(k=>!['name','sourceTeam'].includes(k))||typeof t.name!=='string'||!t.name.trim()||t.name.length>32||!Number.isInteger(t.sourceTeam)||t.sourceTeam<0||t.sourceTeam>=36)throw Error('Equipe estrutural inválida');if(i<36&&t.sourceTeam!==i)throw Error('As identidades das 36 equipes nativas devem ser preservadas');}
 if(!Array.isArray(s.groups)||s.groups.length!==n/6||s.groups.some(g=>!Array.isArray(g)||g.length!==6))throw Error('Grupos estruturais inválidos');if(s.labels!==undefined&&(!Array.isArray(s.labels)||s.labels.length!==n/6||s.labels.some(v=>typeof v!=='string'||!v.trim()||v.length>32)))throw Error('Rótulos de grupos inválidos');const all=s.groups.flat();if(all.some(v=>!Number.isInteger(v)||v<0||v>=n)||new Set(all).size!==n)throw Error('Cada equipe deve aparecer uma vez nos grupos');return s;
}
export function addDeluxeStructureGroup(base,current=null,nativeGroups=null){
 const s=current?structuredClone(validateDeluxeStructure(current)):{schema:'isssd-deluxe-structure-v1',experimental:true,labels:DELUXE_GROUP_LABELS.slice(),teams:DELUXE_TEAMS.map((name,sourceTeam)=>({name,sourceTeam})),groups:(nativeGroups??readDeluxeGroups(base)).map(g=>g.slice())};
 const first=s.teams.length;if(first>=54)throw Error('Limite atual: 54 equipes');for(let i=0;i<6;i++)s.teams.push({name:'Equipe '+(first+i+1),sourceTeam:30});s.groups.push(Array.from({length:6},(_,i)=>first+i));if(s.labels)s.labels.push('GRUPO '+s.groups.length);return validateDeluxeStructure(s);
}
export function prepareDeluxeStructure(base,value){
 if(value===undefined)return base.slice();const s=validateDeluxeStructure(value),n=s.teams.length,runtime=n+7,bound=n*2,upper=runtime*2,challenge=(n+6)*2,out=base.slice(),L=STRUCTURE_LAYOUT;
 const patch=(at,old,next)=>{if(old.length!==next.length||old.some((v,i)=>base[at+i]!==v))throw Error('Estrutura: referência divergente em 0x'+at.toString(16));out.set(next,at);};
 const reserve=(at,data)=>{if(at+data.length>base.length||base.slice(at,at+data.length).some(v=>v!==255)||out.slice(at,at+data.length).some(v=>v!==255))throw Error('Estrutura: reserva ocupada em 0x'+at.toString(16));out.set(data,at);};
 const sources=[...s.teams.map(t=>t.sourceTeam),36,37,38,39,40,41,42];let cursor=L.tables;
 const allocate=data=>{const at=cursor;cursor+=data.length;if(cursor>0x177800)throw Error('Estrutura: tabelas excedem a reserva');reserve(at,data);return at;};
 const longRefs=(oldCpu,newCpu,stride=1)=>{let count=0;for(let at=0;at<base.length-4;at++)if(base[at]===0xbf){const a=base[at+1]|base[at+2]<<8|base[at+3]<<16;if(a>=oldCpu&&a<oldCpu+stride){out.set([0xbf,...bytes24(newCpu+a-oldCpu)],at);count++;}}if(!count)throw Error('Estrutura: consumidor não encontrado '+oldCpu.toString(16));return count;};
 const table=(oldCpu,stride)=>{const start=pcOf(oldCpu),data=new Uint8Array(runtime*stride);sources.forEach((src,i)=>data.set(base.slice(start+src*stride,start+(src+1)*stride),i*stride));const at=allocate(data);longRefs(oldCpu,cpu(at),stride);return at;};
 const attrs=new Uint8Array(runtime*140);sources.forEach((src,i)=>attrs.set(base.slice(0x50000+src*140,0x50000+(src+1)*140),i*140));reserve(L.attributes,attrs);
 patch(0x1c6bd,[0x69,0x74,0x7f],[0x69,...u16((cpu(L.attributes)&65535)-140)]);patch(0x1c6ce,[0x54,0x7e,0x8a],[0x54,0x7e,cpu(L.attributes)>>>16]);
 const names=new Uint8Array(n*160),ptrs=new Uint8Array(n*2);s.teams.forEach((t,i)=>{const old=0x30000+word(base,0x38138+t.sourceTeam*2);names.set(base.slice(old,old+160),i*160);ptrs.set(u16((cpu(L.names)&65535)+i*160),i*2);});reserve(L.names,names);const np=allocate(ptrs);longRefs(0x878138,cpu(np),1);
 for(const at of [0x4f48,0x4f6b])patch(at,[0x54,0x7e,0x87],[0x54,0x7e,cpu(L.names)>>>16]);
 for(const [at,lo]of [[0x121cd9,0],[0x121ce0,2],[0x121ce7,4],[0x121cee,6]])patch(at,[0xbf,lo,0,0x87],[0xbf,lo,0,cpu(L.names)>>>16]);
 table(0x8bef48,2);table(0x81e7d8,2);table(0x82f829,2);table(0x81e6c1,2);table(0x82f59a,2);table(0x81e730,4);
 // Selected-team graphic descriptors and the per-team flag selector.
 table(0x82fa5f,2);table(0x82f89d,2);table(0x82f9b3,2);table(0x82f95f,2);table(0x82f91b,1);
 table(0x8a9784,2);table(0x81ce8a,2);
 table(0x82fa35,1);table(0x82fa07,1);table(0x82fab3,1);table(0x82f61c,2);table(0x82f8f1,1);
 table(0x828326,2);table(0x82837c,2);table(0x8283d2,2);table(0x828459,2);table(0x82842e,1);
 const oldPal=0x1027a,oldAlt=oldPal+43*2,pal=new Uint8Array(runtime*4);sources.forEach((src,i)=>{pal.set(base.slice(oldPal+src*2,oldPal+src*2+2),i*2);pal.set(base.slice(oldAlt+src*2,oldAlt+src*2+2),runtime*2+i*2);});const palAt=allocate(pal);longRefs(0x82827a,cpu(palAt),1);patch(0x123c6e,[0xbf,0xd0,0x82,0x82],[0xbf,...bytes24(cpu(palAt+runtime*2))]);
 let a4=L.a4;for(const spec of [{stride:8,refs:[0x124037,0x124042,0x12404d,0x124058]},{stride:4,refs:[0x124008,0x124013]},{stride:4,refs:[0x12401e,0x124029]},{stride:4,refs:[0x123fd7,0x123fe2]}]){const old=0x120000+(word(base,spec.refs[0]+1)&32767),data=new Uint8Array(n*spec.stride);s.teams.forEach((t,i)=>data.set(base.slice(old+t.sourceTeam*spec.stride,old+(t.sourceTeam+1)*spec.stride),i*spec.stride));reserve(a4,data);spec.refs.forEach((at,i)=>patch(at,[0xbd,...u16(word(base,at+1))],[0xbd,...u16((cpu(a4)&65535)+i*2)]));a4+=data.length;}
 for(const [at,op]of [[0x4f2d,0xe0],[0x4f4f,0xe0],[0x123fcb,0xc9],[0x123ff0,0xe9],[0x123ff9,0xc9],[0x123ffe,0xe9],[0x121c8c,0xe9]])patch(at,[op,0x48,0],[op,bound,0]);
 for(const at of [0x2a5f3,0x2a605,0x2bebe,0x2bf1e,0x2bfb7,0x2d63f,0x2d7d6,0x2d814,0x2dc64,0x2e53b,0x2e922,0x2e96f,0x2eaad])patch(at,[0xc9,0x56,0],[0xc9,upper,0]);
 for(const at of [0x5cfcc,0x5d024])patch(at,[0x69,0x56,0],[0x69,upper,0]);
 for(const [at,op]of [[0x267a3,0xc9],[0x125746,0xa0],[0x125798,0xa0]])patch(at,[op,0x54,0],[op,challenge,0]);
 patch(0x2a808,[0xa2,0x54,0],[0xa2,challenge,0]);
 const groups=new Uint8Array(n+7);groups.set(s.groups.flat().map(v=>v*2));groups.set([bound,bound+2,bound+4,bound+6,bound+8,bound+10,challenge],n);const gp=allocate(groups);reserve(L.groupHelper,Uint8Array.from([0xbf,...bytes24(cpu(gp)),0x60]));for(const at of [0x2aea1,0x2aef2,0x2af4a,0x2af7d,0x2af87])patch(at,[0xbd,0x3f,0xda],[0x20,...u16(cpu(L.groupHelper)&65535)]);
 const pages=n/6;patch(0x2a566,[0xa2,6,0],[0xa2,pages,0]);patch(0x2a572,[0xa2,7,0],[0xa2,pages+1,0]);patch(0x2ac94,[0xa9,6,0],[0xa9,pages,0]);patch(0x2af92,[0xe0,43,0],[0xe0,n+7,0]);
 // Native graphic headings are aliases until their dedicated editor is migrated.
 const titles=new Uint8Array((pages+1)*2);for(let i=0;i<pages;i++)titles.set(base.slice(0x3c54f+Math.min(i,5)*2,0x3c551+Math.min(i,5)*2),i*2);titles.set(base.slice(0x3c55b,0x3c55d),pages*2);const tp=allocate(titles);longRefs(0x87c54f,cpu(tp),1);
 applyDeluxeStructureNames(out,base,s,tp);
 reserve(L.marker,Uint8Array.from([...signature,n]));return out;
}
