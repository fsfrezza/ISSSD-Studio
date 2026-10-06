import {canonicalProjectState} from './project-state.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {PLUS_BASELINE} from './plus-baseline.mjs';

// Opening a project is intentionally data-only. No ROM buffer is accepted here,
// so raw player/tactical records cannot be written as a side effect of loading.
export function canonicalProjectOpen(project,{baseSize=PLUS_BASELINE.size}={}){
  const state=canonicalProjectState(project,{baseSize});
  return {
    targetLength:state.targetLength,
    patches:state.patches.map(p=>({off:p.off,data:Uint8Array.from(p.data)})),
    semantic:canonicalProjectSemantic(project),
  };
}
