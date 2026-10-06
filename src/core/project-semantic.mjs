import {migrateLegacyPlayerAttributes} from './plus-player-state.mjs';
import {canonicalizePlusTacticsState} from './plus-tactics-state.mjs';

function mergePlayerEdit(base,override){
  return {
    ...base,
    ...override,
    ...((base?.skills||override?.skills)?{skills:{...(base?.skills||{}),...(override?.skills||{})}}:{}),
  };
}

function mergePlayerEdits(legacy,explicit){
  if(explicit!==undefined&&!Array.isArray(explicit))throw new TypeError('playerEdits must be an array');
  const map=new Map(),order=[];
  const add=edit=>{
    if(!edit||typeof edit!=='object'||Array.isArray(edit))throw new TypeError('player edit must be an object');
    const key=String(edit.team)+':'+String(edit.player);
    if(!map.has(key)){order.push(key);map.set(key,structuredClone(edit));}
    else map.set(key,mergePlayerEdit(map.get(key),structuredClone(edit)));
  };
  for(const edit of legacy||[])add(edit);
  for(const edit of explicit||[])add(edit);
  return order.map(key=>map.get(key));
}

export function canonicalProjectSemantic(project){
  const semantic=project?.state?.semantic ?? project?.semantic ?? {};
  if(semantic===null || typeof semantic!=='object' || Array.isArray(semantic)) {
    throw new TypeError('project semantic state must be an object');
  }
  const out=structuredClone(semantic);

  if(out.teamsV1&&typeof out.teamsV1==='object'&&!Array.isArray(out.teamsV1)){
    const migrated=migrateLegacyPlayerAttributes(out.teamsV1);
    out.teamsV1=migrated.teamsV1;
    if(migrated.edits.length||migrated.quarantined.length){
      out.playerEdits=mergePlayerEdits(migrated.edits,out.playerEdits);
    }
    if(migrated.quarantined.length){
      const existing=Array.isArray(out.legacyPlayerAttributeQuarantine)?out.legacyPlayerAttributeQuarantine:[];
      out.legacyPlayerAttributeQuarantine=[...existing,...migrated.quarantined];
    }
  }

  const legacyTactics=out?.teamsV1?.tactics ?? out?.plusTactics ?? null;
  if(legacyTactics){
    out.plusTactics=canonicalizePlusTacticsState(legacyTactics);
    if(out.teamsV1&&typeof out.teamsV1==='object')delete out.teamsV1.tactics;
  }
  return out;
}
