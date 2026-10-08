import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {canonicalProjectState} from '../src/core/project-state.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {playerOffset,knownMirrorOffset} from '../src/core/plus-player.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function overlaps(p,start,end){return p.off<end && (p.off+p.data.length)>start;}
function clonePatch(p){return {off:p.off,data:[...p.data]};}
function splitBounds(start,end,part,parts){
  const count=end-start;
  return {
    start:start+Math.ceil(count*part/parts),
    end:start+Math.ceil(count*(part+1)/parts),
  };
}

const [romPath,projectPath,...rest]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/build-persisted-patch-ddmin-plus.mjs <clean-plus.sfc> <project.issdproj> --out-dir <dir> [--parts <n>] [--focus-path <comma-separated zero-based parts>]');
  process.exit(2);
}
function argValue(name){const i=rest.indexOf(name);return i>=0?rest[i+1]:null;}
const outDir=argValue('--out-dir');
const parts=Number(argValue('--parts')??4);
const focusPathRaw=argValue('--focus-path');
const focusPath=focusPathRaw==null||focusPathRaw.trim()===''?[]:focusPathRaw.split(',').map(Number);
if(!outDir) throw new Error('--out-dir is required');
if(!Number.isInteger(parts)||parts<2||parts>16) throw new RangeError('--parts must be 2..16');
if(focusPath.some(part=>!Number.isInteger(part)||part<0||part>=parts)) throw new RangeError(`invalid --focus-path for ${parts} parts: ${focusPathRaw}`);

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const canonical=canonicalProjectState(project,{baseSize:base.length});
const patches=canonical.patches;

// Known Plus invariant: Brazil internal team 30, players 2..7 have a 7-byte
// low-ROM mirror that must remain synchronized with the 7-byte main record.
const dependencyRegions=[];
for(let player=2;player<=7;player++){
  const main=playerOffset(30,player);
  const mirror=knownMirrorOffset(30,player);
  dependencyRegions.push({key:`brazil-player-${player}`,regions:[[main,main+7],[mirror,mirror+7]]});
}

const assigned=new Set();
const atoms=[];
for(const dep of dependencyRegions){
  const indexes=[];
  for(let i=0;i<patches.length;i++){
    if(dep.regions.some(([s,e])=>overlaps(patches[i],s,e))){indexes.push(i);assigned.add(i);}
  }
  if(indexes.length) atoms.push({key:dep.key,indexes});
}
for(let i=0;i<patches.length;i++) if(!assigned.has(i)) atoms.push({key:`range-${i}`,indexes:[i]});
atoms.sort((a,b)=>Math.min(...a.indexes)-Math.min(...b.indexes));

let focusStart=0;
let focusEnd=atoms.length;
const resolvedFocus=[];
for(const part of focusPath){
  const next=splitBounds(focusStart,focusEnd,part,parts);
  if(next.end<=next.start) throw new RangeError(`focus path enters empty partition at ${resolvedFocus.concat(part).join(',')}`);
  focusStart=next.start;
  focusEnd=next.end;
  resolvedFocus.push(part);
}

await mkdir(outDir,{recursive:true});
const stem=basename(projectPath).replace(/\.issdproj$/i,'');
const outputs=[];
for(let part=0;part<parts;part++){
  const bounds=splitBounds(focusStart,focusEnd,part,parts);
  const atomStart=bounds.start;
  const atomEnd=bounds.end;
  const omitted=new Set();
  for(const atom of atoms.slice(atomStart,atomEnd)) for(const idx of atom.indexes) omitted.add(idx);
  const subset=patches.filter((_,i)=>!omitted.has(i)).map(clonePatch);
  const diagnostic=structuredClone(project);
  diagnostic.state=diagnostic.state&&typeof diagnostic.state==='object'&&!Array.isArray(diagnostic.state)?diagnostic.state:{};
  diagnostic.state.targetLength=base.length;
  diagnostic.state.patchesCompact=subset;
  delete diagnostic.state.patches;
  delete diagnostic.patchesCompact;
  delete diagnostic.patches;
  delete diagnostic.targetLength;
  const result=buildPlusProjectRom(base,diagnostic);
  const focusLabel=focusPath.length?`focus-${focusPath.map(x=>x+1).join('-')}-`:' ';
  const cleanFocusLabel=focusLabel.trim();
  const label=`${cleanFocusLabel?cleanFocusLabel+'-':''}omit-q${part+1}-of-${parts}`;
  const outputPath=join(outDir,`${stem}-ddmin-${label}.sfc`);
  await writeFile(outputPath,result.rom);
  outputs.push({
    part:part+1,
    parts,
    focusPathZeroBased:focusPath,
    focusPathOneBased:focusPath.map(x=>x+1),
    focusAtomIndexes:{startInclusive:focusStart,endExclusive:focusEnd,count:focusEnd-focusStart},
    omittedAtomIndexes:{startInclusive:atomStart,endExclusive:atomEnd,count:atomEnd-atomStart},
    omittedPatchCount:omitted.size,
    includedPatchCount:subset.length,
    outputPath,
    outputSha256:sha256(result.rom),
    outputSize:result.rom.length,
  });
}

console.log(JSON.stringify({
  mode:'persisted-patch-ddmin-complements',
  totalCanonicalPersistedRanges:patches.length,
  totalDependencySafeAtoms:atoms.length,
  protectedDependencies:dependencyRegions.map(x=>x.key),
  parts,
  focusPathZeroBased:focusPath,
  focusPathOneBased:focusPath.map(x=>x+1),
  focusAtomIndexes:{startInclusive:focusStart,endExclusive:focusEnd,count:focusEnd-focusStart},
  outputs,
},null,2));
