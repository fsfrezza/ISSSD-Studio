import {applyCanonicalPatches} from './canonical-patches.mjs';
import {buildPlusRom} from './build-plus.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {canonicalizePlusTacticsState} from './plus-tactics-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

function semanticStateFromProject(project){
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

export function buildPlusProjectRom(baseRom,project,options={}){
  const canonical=canonicalProjectState(project,{baseSize:baseRom?.length});
  const patchedBase=applyCanonicalPatches(baseRom,canonical.patches);
  const semanticState=semanticStateFromProject(project);

  const result=buildPlusRom(patchedBase,{
    ...options,
    semanticState,
  });

  return {
    ...result,
    diff:diffRanges(baseRom,result.rom),
    projectState:canonical,
  };
}
