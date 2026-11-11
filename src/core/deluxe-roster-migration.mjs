import {PLUS_BASELINE} from './plus-baseline.mjs';
import {normalizePatch} from './canonical-patches.mjs';
import {readPlusPlayerName} from './plus-player-name.mjs';
import {readPlusPlayer} from './plus-player-writer.mjs';
import {DELUXE_TEAMS,PLAYER_SKILLS} from './deluxe-players.mjs';
import {DELUXE_TO_PLUS_TEAM} from './deluxe-groups.mjs';
import {addDeluxeStructureGroup} from './deluxe-structure.mjs';
import {buildDeluxeProject,splitRom} from './deluxe-project.mjs';
const EXTRA_NAMES={26:'Arábia Saudita',36:'Venezuela',37:'Equador',38:'Chile',39:'Bolívia',40:'Paraguai',41:'Peru',42:'China',43:'Irã',44:'Uzbequistão',45:'Zâmbia',46:'Gana',47:'África do Sul',48:'Canadá',49:'Honduras',50:'Costa Rica',51:'Austrália',52:'Iugoslávia'};
const positions={NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6};
export async function migratePlusRostersToDeluxe(deluxeFile,plusBase,source,target,{fallbackProjects=[]}={}){
 await buildDeluxeProject(deluxeFile,target);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',plusBase)),v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==PLUS_BASELINE.sha256||source.base?.sha256!==hash||source.base?.size!==plusBase.length)throw Error('ROM ou projeto Plus incompatível');
 const semantic=source.state?.semantic;if(semantic?.teamsV1?.mode!=='sparse-overrides')throw Error('Migração: projeto Plus deve usar overrides esparsos');
 const rom=plusBase.slice();for(const raw of source.state.patchesCompact??[]){const p=normalizePatch(raw);if(p.off+p.data.length>rom.length)throw Error('Patch Plus fora da base');rom.set(p.data,p.off);}
 const sourceIds=[...DELUXE_TO_PLUS_TEAM,...Array.from({length:54},(_,i)=>i).filter(i=>!DELUXE_TO_PLUS_TEAM.includes(i))],inverse=new Map(sourceIds.map((id,i)=>[id,i]));
 const result=structuredClone(target),base=splitRom(deluxeFile).rom;let structure;for(let i=0;i<3;i++)structure=addDeluxeStructureGroup(base,structure);
 structure.teams=sourceIds.map((id,index)=>({name:semantic.teamsV1.teams?.[id]?.custom?.teamName??(index<36?DELUXE_TEAMS[index]:EXTRA_NAMES[id]),sourceTeam:index<36?index:30}));
 const groups=semantic.plusGroups?.groups;if(!Array.isArray(groups)||groups.length!==9||groups.some(g=>!Array.isArray(g)||g.length!==6))throw Error('Projeto Plus não contém nove grupos normais completos');
 structure.groups=groups.map(g=>g.map(id=>{if(!inverse.has(id))throw Error('Grupo contém equipe fora das 54 seleções');return inverse.get(id);}));
 structure.labels=semantic.plusGroups.labels.slice(0,9);const players={};let tacticalFields=0,appearanceFields=0,recoveredNames=0,recoveredSkillFields=0;const jerseyRepairs=[];
 for(let team=0;team<54;team++){
  const originalId=sourceIds[team],rows=semantic.teamsV1.teams?.[originalId]?.players;
  if(!Array.isArray(rows)||rows.length!==20)throw Error('Elenco Plus incompleto: '+originalId);
  const slots=new Set(),identities=new Set();for(const row of rows){const slot=row.slot,baseSlot=row.baseSlot;if(!Number.isInteger(slot)||slot<1||slot>20||slots.has(slot)||!Number.isInteger(baseSlot)||baseSlot<1||baseSlot>20||identities.has(baseSlot))throw Error('Identidade ou vaga Plus inválida');slots.add(slot);identities.add(baseSlot);
   const attrs=readPlusPlayer(rom,originalId,baseSlot-1),baseline=readPlusPlayer(plusBase,originalId,baseSlot-1),custom=row.custom??{},old={};
   for(const backup of fallbackProjects){if(backup.base?.sha256!==hash)throw Error('Backup Plus pertence a outra base');const previous=backup.state?.semantic?.teamsV1?.teams?.[originalId]?.players?.find(p=>p.playerId===row.playerId||p.baseSlot===baseSlot);if(previous?.custom){Object.assign(old,{...previous.custom,skills:{...old.skills,...previous.custom.skills}});}}
   const baseName=readPlusPlayerName(plusBase,originalId,baseSlot-1).name,patchedName=readPlusPlayerName(rom,originalId,baseSlot-1).name;
   const useOldName=custom.name===undefined&&patchedName===baseName&&old.name!==undefined,name=custom.name??(patchedName!==baseName?patchedName:old.name??patchedName);if(useOldName)recoveredNames++;
   const skills=Object.fromEntries(Object.keys(PLAYER_SKILLS).map(k=>{const useOld=custom.skills?.[k]===undefined&&attrs[k]===baseline[k]&&old.skills?.[k]!==undefined;if(useOld)recoveredSkillFields++;return [k,custom.skills?.[k]??(attrs[k]!==baseline[k]?attrs[k]+1:old.skills?.[k]??attrs[k]+1)];}));
   const position=custom.position??(attrs.naturalPosition!==baseline.naturalPosition?undefined:old.position),naturalPosition=position===undefined?attrs.naturalPosition:positions[position];if(naturalPosition===undefined)throw Error('Posição Plus não reconhecida');
   players[team+':'+(slot-1)]={name,jersey:custom.number??(attrs.jersey!==baseline.jersey?attrs.jersey:old.number??attrs.jersey),naturalPosition,skills};
   tacticalFields+=Object.keys(custom.tactical??{}).length;appearanceFields+=Object.keys(custom.appearance??{}).length;
  }
  const assigned=new Map(),repair=[];
  for(const row of rows){const key=team+':'+(row.slot-1),jersey=players[key].jersey,prior=assigned.get(jersey);if(!prior){assigned.set(jersey,row);continue;}const oldExplicit=prior.custom?.number!==undefined,newExplicit=row.custom?.number!==undefined;if(oldExplicit&&newExplicit)throw Error('Duas camisas explícitas iguais na equipe Plus '+originalId);if(newExplicit){repair.push(prior);assigned.set(jersey,row);}else repair.push(row);}
  const missing=Array.from({length:20},(_,i)=>i+1).filter(v=>!assigned.has(v));if(missing.length!==repair.length)throw Error('Numeração Plus fora de 1–20');
  repair.forEach((row,i)=>{const key=team+':'+(row.slot-1);jerseyRepairs.push({plusTeam:originalId,targetTeam:team,slot:row.slot,name:players[key].name,from:players[key].jersey,to:missing[i],reason:'Duplicata no projeto Plus; camisa explícita preservada e número ausente atribuído ao outro jogador'});players[key].jersey=missing[i];});
 }
 result.changes.structure=structure;result.changes.players=players;delete result.changes.groups;
 const built=await buildDeluxeProject(deluxeFile,JSON.parse(JSON.stringify(result)));
 return {project:result,report:{teams:54,players:1080,groups:9,sourceIds,recoveredNames,recoveredSkillFields,jerseyRepairs,excludedPlusTeamIds:[54,55],experimental:true,romBytes:built.rom.length,expanded:built.expanded,emulatorValidated:false,pending:{graphicTeamNames:true,flagsAndKits:true,groupGraphics:true,tactics:true,appearance:true,tacticalOverrideFields:tacticalFields,appearanceOverrideFields:appearanceFields},note:'Os seis portadores especiais originais Deluxe são preservados; os portadores Plus 54 e 55 não foram convertidos.'}};
}
