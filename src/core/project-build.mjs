import {applyCanonicalPatches} from './canonical-patches.mjs';
import {buildPlusRom} from './build-plus.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

export function buildPlusProjectRom(baseRom,project,options={}){
  const canonical=canonicalProjectState(project,{baseSize:baseRom?.length});
  const patchedBase=applyCanonicalPatches(baseRom,canonical.patches);
  const semanticState=canonicalProjectSemantic(project);
  const userWriters=options.writers??[];
  if(!Array.isArray(userWriters))throw new TypeError('writers must be functions');
  const {writers:_writers,...buildOptions}=options;

  const result=buildPlusRom(patchedBase,{
    ...buildOptions,
    semanticState,
    // Player edits are a validated built-in semantic writer. It runs after any
    // generated infrastructure and before optional caller-supplied writers.
    writers:[plusPlayerWriter,...userWriters],
  });

  return {
    ...result,
    diff:diffRanges(baseRom,result.rom),
    projectState:canonical,
  };
}
