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
  return {start:start+Math.ceil(count*part/parts),end:start+Math.ceil(count*(part+1)/parts)};
}
function hex(n,width=6){return `0x${Number(n).toString(16).toUpperCase().padStart(width,'0')}`;}

const [romPath,projectPath,...rest]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/build-persisted-focus-atom-omit-plus.mjs <clean-plus.sfc> <project.issdproj> --out-dir <dir> [--parts <n>] [--focus-path <path>]');
  process.exit(2);
}
function argValue(name){const i=rest.indexOf(name);return i>=0?rest[i+1]:null;}
const outDir=argValue('--out-dir');
const parts=Number(argValue('--parts')??4);
const focusPathRaw=argValue('--focus-path')??'0,3,1,2';
const focusPath=focusPathRaw.trim()===''?[]:focusPathRaw.split(',').map(Number);
if(!outDir) throw new Error('--out-dir is required');
if(!Number.isInteger(parts)||parts<2||parts>16) throw new RangeError('--parts must be 2..16');
if(focusPath.some(part=>!Number.isInteger(part)||part<0||part>=parts)) throw new RangeError(`invalid --focus-path for ${parts} parts: ${focusPathRaw}`);

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const canonical=canonicalProjectState(project,{baseSize:base.length});
const patches=canonical.patches;

const dependencies=[];
for(let player=2;player<=7;player++){
  const main=playerOffset(30,player);
  const mirror=knownMirrorOffset(30,player);
  dependencies.push({key:`brazil-player-${player}`,regions:[[main,main+7],[mirror,mirror+7]]});
}

const assigned=new Set();
const atoms=[];
for(const dep of dependencies){
  const indexes=[];
  for(let i=0;i<patches.length;i++) if(dep.regions.some(([s,e])=>overlaps(patches[i],s,e))){indexes.push(i);assigned.add(i);}
  if(indexes.length) atoms.push({key:dep.key,kind:'protected-dependency',indexes});
}
for(let i=0;i<patches.length;i++) if(!assigned.has(i)) atoms.push({key:`range-${i}`,kind:'range',indexes:[i]});
atoms.sort((a,b)=>Math.min(...a.indexes)-Math.min(...b.indexes));

let focusStart=0,focusEnd=atoms.length;
for(const part of focusPath){
  const next=splitBounds(focusStart,focusEnd,part,parts);
  if(next.end<=next.start) throw new RangeError(`focus path enters empty partition at ${part}`);
  focusStart=next.start; focusEnd=next.end;
}
const focusAtoms=atoms.slice(focusStart,focusEnd);
if(focusAtoms.length<1) throw new Error('focused atom set is empty');

await mkdir(outDir,{recursive:true});
const stem=basename(projectPath).replace(/\.issdproj$/i,'');
const outputs=[];
for(let relative=0;relative<focusAtoms.length;relative++){
  const atom=focusAtoms[relative];
  const omitted=new Set(atom.indexes);
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
  const atomIndex=focusStart+relative;
  const firstPatch=patches[atom.indexes[0]];
  const label=`omit-atom-${atomIndex}-${hex(firstPatch.off).replace('0x','')}`;
  const outputPath=join(outDir,`${stem}-${label}.sfc`);
  await writeFile(outputPath,result.rom);
  outputs.push({
    testNumber:relative+1,
    atomIndex,
    key:atom.key,
    kind:atom.kind,
    patchIndexes:atom.indexes,
    firstOffset:firstPatch.off,
    firstOffsetHex:hex(firstPatch.off),
    omittedPatchCount:atom.indexes.length,
    outputPath,
    outputSha256:sha256(result.rom),
    outputSize:result.rom.length,
  });
}

console.log(JSON.stringify({
  mode:'persisted-focus-atom-omission',
  totalCanonicalPersistedRanges:patches.length,
  totalDependencySafeAtoms:atoms.length,
  parts,
  focusPathZeroBased:focusPath,
  focusPathOneBased:focusPath.map(x=>x+1),
  focusAtomIndexes:{startInclusive:focusStart,endExclusive:focusEnd,count:focusEnd-focusStart},
  outputs,
},null,2));
