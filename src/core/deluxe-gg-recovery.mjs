import {DELUXE_PROJECT_TO_PLUS} from './deluxe-team-identity.mjs';
import {validateDeluxeStructure} from './deluxe-structure.mjs';
import {decodePlayerRecord} from './plus-player.mjs';
import {decodeFixedPlayerName} from './plus-player-name.mjs';
import {PLUS_GROUP_LOGICAL_TO_PHYSICAL} from './plus-groups.mjs';
import {DELUXE_TEAMS} from './deluxe-team-catalog.mjs';
import {PLAYER_SKILLS} from './deluxe-players.mjs';
import {PLUS_TEAM_CATALOG} from './plus-team-catalog.mjs';

// Explicit recovery from a materialized GG ROM, not an automatic Plus project importer.
// Template remains detached; unrelated Deluxe graphics/text/audio edits are preserved.
export function recoverDeluxeGGRosters(rom,template,source){
 if(!(rom instanceof Uint8Array)||rom.length!==0x400000)throw Error('Recuperação GG exige a ROM de referência de 4 MB.');
 const bytes=rom.slice(0x2ef000,0x2f0000),end=bytes.indexOf(255);let allocation;
 try{allocation=JSON.parse(new TextDecoder().decode(end<0?bytes:bytes.slice(0,end)));}catch{throw Error('Índice de alocação GG ausente ou inválido.');}
 if(allocation.schema!=='isssd-independent-allocation-v1'||allocation.teams!==60||allocation.group?.length!==6)throw Error('Índice GG incompatível.');
 const model=source?.state?.semantic?.independentTeamsV1,labels=source?.state?.semantic?.plusGroups?.labels;
 if(!model||!Array.isArray(labels)||labels.length!==10||labels[9]!=='GG')throw Error('Identidades GG de referência ausentes.');
 const ids=DELUXE_PROJECT_TO_PLUS,slots=new Map(ids.map((id,slot)=>[id,slot]));
 const normal=PLUS_GROUP_LOGICAL_TO_PHYSICAL.map(g=>Array.from(rom.slice(0xe7f2+g*6,0xe7f8+g*6),v=>v/2));
 const secret=Array.from(rom.slice(0xe828,0xe82e),v=>v/2);
 if(secret.length!==6||new Set(secret).size!==6||secret.some(id=>id<54||id>59))throw Error('A ROM não contém as seis equipes GG no grupo secreto.');
 const gg=allocation.group[0],namesBase=gg.names-54*160;
 if(namesBase<0||namesBase+60*160>rom.length)throw Error('Tabela de nomes GG fora da ROM.');
 for(let i=0;i<6;i++){
  const row=allocation.group[i],id=54+i,t=model.teams?.[id];
  if(!t||row.teamId!==id||row.names!==namesBase+id*160||row.attributes!==0x150000+id*140)throw Error('Alocação GG divergente.');
  // Recover only from a matching full identity reference, never manufacture missing players.
  for(const key of ['attributes','names','tactics','pattern']){
   const expected=t.data?.[key],at=row[key];
   if(!Array.isArray(expected)||!Number.isInteger(at)||at<0||at+expected.length>rom.length||expected.some((v,j)=>rom[at+j]!==v))throw Error('Dados GG de referência divergentes: '+id+' / '+key);
  }
 }
 const teams=ids.map((plusId,slot)=>({name:plusId>=54?model.teams[plusId].name:(source.state.semantic.teamNamesV1?.values?.[plusId]?.full??source.state.semantic.teamsV1?.teams?.[plusId]?.custom?.teamName??(slot<36?DELUXE_TEAMS[slot]:PLUS_TEAM_CATALOG[plusId].name)),sourceTeam:slot<36?slot:plusId>=54?slots.get(model.teams[plusId].sourceTeam)??30:30,plusId}));
 const structure={schema:'isssd-deluxe-structure-v1',experimental:true,teams,groups:normal.map(row=>row.map(id=>slots.get(id))),secret:secret.map(id=>slots.get(id)),labels:labels.slice()};
 validateDeluxeStructure(structure);const result=structuredClone(template),players={};
 ids.forEach((plusId,slot)=>{for(let player=0;player<20;player++){
  const at=0x150000+(plusId*20+player)*7,r=decodePlayerRecord(rom.slice(at,at+7));
  players[slot+':'+player]={name:decodeFixedPlayerName(rom.slice(namesBase+plusId*160+player*8,namesBase+plusId*160+player*8+8)).trim(),jersey:r.jersey,naturalPosition:r.naturalPosition,skills:Object.fromEntries(Object.keys(PLAYER_SKILLS).map(k=>[k,r[k]+1]))};
 }});
 result.changes.structure=structure;result.changes.players=players;delete result.changes.groups;delete result.changes.groupLabels;
 return result;
}
