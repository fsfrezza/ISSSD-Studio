import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalProjectState} from '../src/core/project-state.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {playerOffset,knownMirrorOffset} from '../src/core/plus-player.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function overlaps(p,start,end){return p.off<end && (p.off+p.data.length)>start;}
function splitBounds(start,end,part,parts){
  const count=end-start;
  return {start:start+Math.ceil(count*part/parts),end:start+Math.ceil(count*(part+1)/parts)};
}
function hex(n,width=6){return `0x${Number(n).toString(16).toUpperCase().padStart(width,'0')}`;}
function bytesHex(bytes){return [...bytes].map(x=>`0x${x.toString(16).toUpperCase().padStart(2,'0')}`);}

const [romPath,projectPath,...rest]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/inspect-persisted-focus-plus.mjs <clean-plus.sfc> <project.issdproj> [--parts <n>] [--focus-path <comma-separated zero-based parts>]');
  process.exit(2);
}
function argValue(name){const i=rest.indexOf(name);return i>=0?rest[i+1]:null;}
const parts=Number(argValue('--parts')??4);
const focusPathRaw=argValue('--focus-path')??'';
const focusPath=focusPathRaw.trim()===''?[]:focusPathRaw.split(',').map(Number);
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

const selected=atoms.slice(focusStart,focusEnd).map((atom,relativeIndex)=>({
  atomIndex:focusStart+relativeIndex,
  key:atom.key,
  kind:atom.kind,
  patchIndexes:atom.indexes,
  patches:atom.indexes.map(i=>{
    const p=patches[i];
    const baseSlice=base.slice(p.off,p.off+p.data.length);
    return {
      patchIndex:i,
      offset:p.off,
      offsetHex:hex(p.off),
      length:p.data.length,
      baseBytesHex:bytesHex(baseSlice),
      persistedBytesHex:bytesHex(p.data),
      changedByteCount:p.data.reduce((n,v,j)=>n+(v!==baseSlice[j]?1:0),0),
    };
  }),
}));

console.log(JSON.stringify({
  mode:'inspect-persisted-focus',
  totalCanonicalPersistedRanges:patches.length,
  totalDependencySafeAtoms:atoms.length,
  parts,
  focusPathZeroBased:focusPath,
  focusPathOneBased:focusPath.map(x=>x+1),
  focusAtomIndexes:{startInclusive:focusStart,endExclusive:focusEnd,count:focusEnd-focusStart},
  atoms:selected,
},null,2));
