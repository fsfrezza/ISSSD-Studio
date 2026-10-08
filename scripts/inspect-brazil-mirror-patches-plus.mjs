import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalProjectState} from '../src/core/project-state.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {playerOffset,knownMirrorOffset} from '../src/core/plus-player.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function hex(n,w=6){return `0x${Number(n).toString(16).toUpperCase().padStart(w,'0')}`;}
function hexByte(n){return `0x${Number(n).toString(16).toUpperCase().padStart(2,'0')}`;}
function patchByteAt(patches,off){
  for(const p of patches){
    if(off>=p.off && off<p.off+p.data.length) return {value:p.data[off-p.off],rangeOffset:p.off,rangeLength:p.data.length};
  }
  return null;
}
function inspectRegion(base,patches,off,length){
  const bytes=[];
  for(let i=0;i<length;i++){
    const pc=off+i;
    const hit=patchByteAt(patches,pc);
    bytes.push({
      index:i,
      pcOffset:pc,
      pcOffsetHex:hex(pc),
      base:base[pc],
      baseHex:hexByte(base[pc]),
      persisted:hit?.value ?? null,
      persistedHex:hit?hexByte(hit.value):null,
      patched:Boolean(hit),
      differs:hit?hit.value!==base[pc]:false,
      sourceRangeOffset:hit?.rangeOffset ?? null,
      sourceRangeOffsetHex:hit?hex(hit.rangeOffset):null,
      sourceRangeLength:hit?.rangeLength ?? null,
    });
  }
  return bytes;
}

const [romPath,projectPath]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/inspect-brazil-mirror-patches-plus.mjs <clean-plus.sfc> <project.issdproj>');
  process.exit(2);
}

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const canonical=canonicalProjectState(project,{baseSize:base.length});

const players=[];
for(let player=2;player<=7;player++){
  const mainOffset=playerOffset(30,player);
  const mirrorOffset=knownMirrorOffset(30,player);
  const main=inspectRegion(base,canonical.patches,mainOffset,7);
  const mirror=inspectRegion(base,canonical.patches,mirrorOffset,7);
  const mismatches=[];
  for(let i=0;i<7;i++){
    const mainValue=main[i].patched?main[i].persisted:main[i].base;
    const mirrorValue=mirror[i].patched?mirror[i].persisted:mirror[i].base;
    if(mainValue!==mirrorValue){
      mismatches.push({index:i,mainValue,mainValueHex:hexByte(mainValue),mirrorValue,mirrorValueHex:hexByte(mirrorValue)});
    }
  }
  players.push({
    team:30,
    player,
    mainOffset,
    mainOffsetHex:hex(mainOffset),
    mirrorOffset,
    mirrorOffsetHex:hex(mirrorOffset),
    mainPatchedBytes:main.filter(x=>x.patched).length,
    mirrorPatchedBytes:mirror.filter(x=>x.patched).length,
    effectiveMismatchCount:mismatches.length,
    mismatches,
    main,
    mirror,
  });
}

const summary={
  mode:'inspect-brazil-mirror-patches',
  totalCanonicalPersistedRanges:canonical.patches.length,
  players,
  inconsistentPairs:players.filter(p=>p.effectiveMismatchCount>0).map(p=>({
    player:p.player,
    mainOffsetHex:p.mainOffsetHex,
    mirrorOffsetHex:p.mirrorOffsetHex,
    mainPatchedBytes:p.mainPatchedBytes,
    mirrorPatchedBytes:p.mirrorPatchedBytes,
    effectiveMismatchCount:p.effectiveMismatchCount,
    mismatches:p.mismatches,
  })),
};
console.log(JSON.stringify(summary,null,2));
