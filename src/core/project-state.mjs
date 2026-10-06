import {PLUS_BASE_SIZE,canonicalizePatches} from './canonical-patches.mjs';

function projectPatches(project){
  return project?.state?.patchesCompact ?? project?.patchesCompact ?? [];
}

function projectTargetLength(project,baseSize){
  const raw=project?.state?.targetLength ?? project?.targetLength ?? baseSize;
  const value=Number(raw);
  if(!Number.isInteger(value) || value<0) throw new RangeError('invalid project targetLength');
  return value;
}

export function canonicalProjectState(project,{baseSize=PLUS_BASE_SIZE}={}){
  if(project===null || typeof project!=='object' || Array.isArray(project)) throw new TypeError('project object required');
  const targetLength=projectTargetLength(project,baseSize);
  if(targetLength!==baseSize){
    throw new RangeError('project targetLength must equal immutable base size');
  }
  const patches=canonicalizePatches(projectPatches(project),{
    baseSize,
    rejectPersistedExpansion:true,
  });
  return {
    targetLength,
    patches,
  };
}
