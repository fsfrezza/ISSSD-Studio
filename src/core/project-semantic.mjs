import {canonicalizePlusTacticsState} from './plus-tactics-state.mjs';

export function canonicalProjectSemantic(project){
  const semantic=project?.state?.semantic ?? project?.semantic ?? {};
  if(semantic===null || typeof semantic!=='object' || Array.isArray(semantic)) {
    throw new TypeError('project semantic state must be an object');
  }
  const out=structuredClone(semantic);
  const legacyTactics=out?.teamsV1?.tactics ?? out?.plusTactics ?? null;
  if(legacyTactics){
    out.plusTactics=canonicalizePlusTacticsState(legacyTactics);
    if(out.teamsV1&&typeof out.teamsV1==='object')delete out.teamsV1.tactics;
  }
  return out;
}
