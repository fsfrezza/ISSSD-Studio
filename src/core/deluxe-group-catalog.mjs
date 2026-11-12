import {PLUS_TEAM_CATALOG,PLUS_NORMAL_GROUPS,PLUS_NORMAL_LABELS} from './plus-team-catalog.mjs';
import {DELUXE_PROJECT_TO_PLUS} from './deluxe-team-identity.mjs';
import {addDeluxeStructureGroup,validateDeluxeStructure} from './deluxe-structure.mjs';
export function projectPlusIds(project){return project.changes.structure?.teams.map((t,i)=>t.plusId??DELUXE_PROJECT_TO_PLUS[i])??DELUXE_PROJECT_TO_PLUS.slice(0,36);}
export function availablePlusTeams(project){const used=new Set(projectPlusIds(project));return PLUS_TEAM_CATALOG.filter(t=>!t.secret&&!used.has(t.plusId));}
export function addPlusCatalogGroup(base,project,plusIds){
 const available=new Set(availablePlusTeams(project).map(t=>t.plusId));
 if(!Array.isArray(plusIds)||plusIds.length!==6||new Set(plusIds).size!==6||plusIds.some(id=>!available.has(id)))throw Error('Escolha seis equipes distintas ainda não habilitadas.');
 const next=structuredClone(project),prior=next.changes.structure,first=prior?.teams.length??36;
 const structure=addDeluxeStructureGroup(base,prior,next.changes.groups,plusIds.map(plusId=>({name:PLUS_TEAM_CATALOG[plusId].name,sourceTeam:30,plusId})));
 if(!prior&&next.changes.groupLabels)structure.labels.splice(0,6,...next.changes.groupLabels);
 // Freeze the meaning of existing slots before appending a differently ordered catalog selection.
 structure.teams.slice(0,first).forEach((t,i)=>t.plusId??=DELUXE_PROJECT_TO_PLUS[i]);
 next.changes.players??={};
 plusIds.forEach((plusId,i)=>{
  const entry=PLUS_TEAM_CATALOG[plusId],slot=first+i;
  structure.teams[slot]={name:entry.name,sourceTeam:30,plusId};
  entry.players.forEach((player,p)=>{next.changes.players[slot+':'+p]=structuredClone(player);});
 });
 validateDeluxeStructure(structure);next.changes.structure=structure;delete next.changes.groups;delete next.changes.groupLabels;
 return next;
}
export function applyPlusGroupOrganization(base,project){
 let next=structuredClone(project),remaining=availablePlusTeams(next).map(t=>t.plusId);
 while(remaining.length){next=addPlusCatalogGroup(base,next,remaining.slice(0,6));remaining=remaining.slice(6);}
 const ids=projectPlusIds(next),slots=new Map(ids.map((id,slot)=>[id,slot]));
 if(slots.size!==54)throw Error('Catálogo de equipes incompatível com a estrutura Plus.');
 next.changes.structure.groups=PLUS_NORMAL_GROUPS.map(row=>row.map(id=>slots.get(id)));
 next.changes.structure.labels=PLUS_NORMAL_LABELS.slice();
 validateDeluxeStructure(next.changes.structure);return next;
}
