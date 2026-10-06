import {canonicalProjectState} from './project-state.mjs';
import {PLUS_BASELINE} from './plus-baseline.mjs';

function semanticStateFromProject(project){
  const semantic=project?.state?.semantic ?? project?.semantic ?? {};
  if(semantic===null || typeof semantic!=='object' || Array.isArray(semantic)) {
    throw new TypeError('project semantic state must be an object');
  }
  return structuredClone(semantic);
}

// Opening a project is intentionally data-only. No ROM buffer is accepted here,
// so raw player/tactical records cannot be written as a side effect of loading.
export function canonicalProjectOpen(project,{baseSize=PLUS_BASELINE.size}={}){
  const state=canonicalProjectState(project,{baseSize});
  return {
    targetLength:state.targetLength,
    patches:state.patches.map(p=>({off:p.off,data:Uint8Array.from(p.data)})),
    semantic:semanticStateFromProject(project),
  };
}
