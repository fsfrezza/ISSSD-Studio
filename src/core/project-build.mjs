import {applyCanonicalPatches} from './canonical-patches.mjs';
import {buildPlusRom} from './build-plus.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

function semanticStateFromProject(project){
  const semantic=project?.state?.semantic ?? project?.semantic ?? {};
  if(semantic===null || typeof semantic!=='object' || Array.isArray(semantic)) {
    throw new TypeError('project semantic state must be an object');
  }
  return structuredClone(semantic);
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
