import {DELUXE_TO_PLUS_TEAM,readDeluxeGroups,DELUXE_GROUP_LABELS} from './deluxe-groups.mjs';
import {DELUXE_TEAMS} from './deluxe-team-catalog.mjs';

// Stable country identities. Legacy project slots are deliberately not renumbered:
// players, prepared graphics and other saved domains still reference those slots.
export const DELUXE_PROJECT_TO_PLUS=Object.freeze([
 ...DELUXE_TO_PLUS_TEAM,
 ...Array.from({length:54},(_,id)=>id).filter(id=>!DELUXE_TO_PLUS_TEAM.includes(id)),54,55,56,57,58,59
]);
export function deluxeTeamIdentity(slot,structure){
 if(!Number.isInteger(slot)||slot<0||slot>=60)throw Error('Identidade de equipe inválida');
 const plusId=structure?.teams[slot]?.plusId??DELUXE_PROJECT_TO_PLUS[slot];
 return {plusId,deluxeId:DELUXE_TO_PLUS_TEAM.indexOf(plusId)>=0?DELUXE_TO_PLUS_TEAM.indexOf(plusId):null,projectSlot:slot};
}
export function structureGroupRows(s){return s.secret?[...s.groups,s.secret]:s.groups;}
export function setStructureGroupRows(s,rows){if(s.secret){s.groups=rows.slice(0,-1);s.secret=rows.at(-1);}else s.groups=rows;}
export function deluxeGroupView(base,project){
 const structure=project.changes.structure;
 const groups=(structure?structureGroupRows(structure):undefined)??project.changes.groups??readDeluxeGroups(base);
 const labels=structure?.labels??project.changes.groupLabels??DELUXE_GROUP_LABELS;
 return groups.map((row,g)=>({name:labels[g]??'GRUPO '+(g+1),teams:row.map(slot=>({...deluxeTeamIdentity(slot,structure),name:structure?.teams[slot]?.name??DELUXE_TEAMS[slot]}))}));
}
export function swapDeluxeProjectGroups(base,project,from,to){
 const view=deluxeGroupView(base,project);
 for(const i of [from,to])if(!Number.isInteger(i)||i<0||i>=view.length)throw Error('Grupo inválido');
 const next=structuredClone(project),structure=next.changes.structure;
 const groups=view.map(g=>g.teams.map(t=>t.projectSlot)),labels=view.map(g=>g.name);
 [groups[from],groups[to]]=[groups[to],groups[from]];
 [labels[from],labels[to]]=[labels[to],labels[from]];
 if(structure){setStructureGroupRows(structure,groups);structure.labels=labels;}else {next.changes.groups=groups;next.changes.groupLabels=labels;}
 return next;
}
