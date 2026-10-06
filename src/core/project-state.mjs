import {PLUS_BASE_SIZE,canonicalizePatches} from './canonical-patches.mjs';

const SNES_CHECKSUM_START=0x7FDC;
const SNES_CHECKSUM_END=0x7FE0;

function projectPatches(project){
  return project?.state?.patchesCompact
    ?? project?.patchesCompact
    ?? project?.state?.patches
    ?? project?.patches
    ?? [];
}

function projectTargetLength(project,baseSize){
  const raw=project?.state?.targetLength ?? project?.targetLength ?? baseSize;
  const value=Number(raw);
  if(!Number.isInteger(value) || value<0) throw new RangeError('invalid project targetLength');
  return value;
}

function sanitizeDerivedProjectPatches(patches){
  const out=[];
  for(const patch of patches){
    const start=patch.off;
    const end=patch.off+patch.data.length;
    const overlapsChecksum=start<SNES_CHECKSUM_END && end>SNES_CHECKSUM_START;
    if(!overlapsChecksum){
      out.push(patch);
      continue;
    }
    const whollyChecksum=start>=SNES_CHECKSUM_START && end<=SNES_CHECKSUM_END;
    if(whollyChecksum)continue;
    throw new RangeError('persisted patch crosses generated checksum boundary');
  }
  return out;
}

export function canonicalProjectState(project,{baseSize=PLUS_BASE_SIZE}={}){
  if(project===null || typeof project!=='object' || Array.isArray(project)) throw new TypeError('project object required');
  const targetLength=projectTargetLength(project,baseSize);
  if(targetLength!==baseSize){
    throw new RangeError('project targetLength must equal immutable base size');
  }
  const patches=sanitizeDerivedProjectPatches(canonicalizePatches(projectPatches(project),{
    baseSize,
    rejectPersistedExpansion:true,
  }));
  return {
    targetLength,
    patches,
  };
}
