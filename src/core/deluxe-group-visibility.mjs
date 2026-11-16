import {readDeluxeGroups,DELUXE_GROUP_TABLE} from './deluxe-groups.mjs';
import {structureGroupRows} from './deluxe-team-identity.mjs';
const word=(b,p)=>b[p]|b[p+1]<<8,pc=(b,p)=>((b[p+2]&127)*32768)+(word(b,p)&32767),w=n=>[n&255,n>>8&255];
export function validateHiddenGroups(project,base){
 const s=project.changes.structure,rows=s?structureGroupRows(s):project.changes.groups??readDeluxeGroups(base),hidden=project.changes.hiddenGroups??[];
 if(!Array.isArray(hidden)||hidden.some(i=>!Number.isInteger(i)||i<0||i>=rows.length)||new Set(hidden).size!==hidden.length)throw Error('Grupos ocultos inválidos');
 const normal=s?.secret?rows.length-1:rows.length;
 if(Array.from({length:normal},(_,i)=>i).every(i=>hidden.includes(i)))throw Error('Mantenha pelo menos um grupo normal ativo.');
 return {rows,hidden,normal};
}
// Compact only the selection directory, never the team IDs or roster tables.
// The extra native All-Star/challenge carriers are retained after the visible pages.
export function applyDeluxeGroupVisibility(out,base,project){
 const {rows,hidden,normal}=validateHiddenGroups(project,base);if(!hidden.length)return out;
 const s=project.changes.structure,active=Array.from({length:normal},(_,i)=>i).filter(i=>!hidden.includes(i)),secret=s?.secret?normal:-1,showSecret=secret<0||!hidden.includes(secret),pages=active.length;
 const sourceTable=s?pc(out,0x2ff01):DELUXE_GROUP_TABLE,sourceTitle=s?pc(out,0x2ad30):0x3c54f;
 const carrier=out.slice(sourceTable+rows.length*6,sourceTable+rows.length*6+7),originalTitles=out.slice(sourceTitle,sourceTitle+(normal+1)*2);
 const table=s?sourceTable:0x2ff40,title=s?sourceTitle:0x2ff80;
 if(!s){
  if(out.slice(0x2ff00,0x2ff05).some(v=>v!==255)||out.slice(table,title+14).some(v=>v!==255))throw Error('Visibilidade de grupos: espaço ocupado');
  out.set([0xbf,0x40,0xff,0x85,0x60],0x2ff00);
  for(const at of [0x2aea1,0x2aef2,0x2af4a,0x2af7d,0x2af87]){if(out[at]!==0xbd||word(out,at+1)!==0xda3f)throw Error('Visibilidade de grupos: tabela incompatível');out.set([0x20,0,0xff],at);}
  out.set([0x80,0xff,0x85],0x2ad30);
 }
 const visible=active.flatMap(i=>rows[i]);if(secret>=0&&showSecret)visible.push(...rows[secret]);
 const data=Uint8Array.from([...visible.map(i=>i*2),...carrier]);
 out.set(data,table);
 for(let i=0;i<active.length;i++)out.set(originalTitles.slice(active[i]*2,active[i]*2+2),title+i*2);
 if(secret>=0&&showSecret)out.set(originalTitles.slice(normal*2,normal*2+2),title+pages*2);
 else if(secret<0)out.set(originalTitles.slice(normal*2,normal*2+2),title+pages*2);
 out[0x2a567]=pages;out[0x2a573]=pages+(showSecret?1:0);out[0x2ac95]=pages;
 // A stored default may belong to an inhibited group. On lookup failure,
 // start from the first active team instead of an invalid page.
 const limit=visible.length+(secret<0?7:0),helper=0x2ff20;
 if(out.slice(helper,helper+13).some(v=>v!==255)||out[0x2af97]!==0x8a||out[0x2af98]!==0xa0)throw Error('Visibilidade de grupos: rotina incompatível');
 out[0x2af93]=limit;out.set([0x20,0x20,0xff,0xea],0x2af97);
 out.set([0xe0,...w(limit),0x90,3,0xa2,0,0,0x8a,0xa0,6,0,0x60],helper);
 return out;
}
