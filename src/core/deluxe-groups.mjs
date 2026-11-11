// Original USA layout; expanded Plus pages use different tables and consumers.
export const DELUXE_GROUP_TABLE=0xda3f;
export const DELUXE_GROUP_LABELS=['EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA-AFRICA','N.S.AMERICA'];
export const DELUXE_TO_PLUS_TEAM=Object.freeze(Array.from({length:36},(_,id)=>id===21?53:id===26?21:id));
export function readDeluxeGroups(base){
 const groups=Array.from({length:6},(_,g)=>Array.from({length:6},(_,s)=>base[DELUXE_GROUP_TABLE+g*6+s]/2));
 validateDeluxeGroups(groups);return groups;
}
export function validateDeluxeGroups(groups){
 if(!Array.isArray(groups)||groups.length!==6||groups.some(g=>!Array.isArray(g)||g.length!==6))throw Error('Grupos nativos: use seis grupos com seis equipes');
 const flat=groups.flat();if(flat.some(v=>!Number.isInteger(v)||v<0||v>=36)||new Set(flat).size!==36)throw Error('As 36 equipes nativas devem aparecer uma vez, sem duplicatas');return groups;
}
export function moveDeluxeGroupTeam(groups,fromGroup,fromSlot,toGroup,toSlot){
 validateDeluxeGroups(groups);for(const v of [fromGroup,fromSlot,toGroup,toSlot])if(!Number.isInteger(v)||v<0||v>=6)throw Error('Vaga de grupo inválida');
 const next=groups.map(g=>g.slice());[next[fromGroup][fromSlot],next[toGroup][toSlot]]=[next[toGroup][toSlot],next[fromGroup][fromSlot]];return next;
}
export function applyDeluxeGroups(out,base,groups){
 if(groups===undefined)return out;readDeluxeGroups(base);validateDeluxeGroups(groups);out.set(groups.flat().map(v=>v*2),DELUXE_GROUP_TABLE);return out;
}
