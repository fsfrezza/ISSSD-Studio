import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalProjectState} from '../src/core/project-state.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function hexByte(v){return `0x${Number(v).toString(16).padStart(2,'0').toUpperCase()}`;}
function hexPc(v){return `0x${Number(v).toString(16).padStart(6,'0').toUpperCase()}`;}

const [romPath,projectPath]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/inspect-persisted-range0-plus.mjs <clean-plus.sfc> <project.issdproj>');
  process.exit(2);
}

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const canonical=canonicalProjectState(project,{baseSize:base.length});
const range=canonical.patches[0];
if(!range) throw new Error('Project has no canonical persisted patches');

const persisted=[...range.data];
const original=[...base.slice(range.off,range.off+persisted.length)];
const changed=[];
for(let i=0;i<persisted.length;i++){
  if(persisted[i]!==original[i]){
    changed.push({
      index:i,
      pcOffset:range.off+i,
      pcOffsetHex:hexPc(range.off+i),
      base:original[i],
      baseHex:hexByte(original[i]),
      persisted:persisted[i],
      persistedHex:hexByte(persisted[i]),
    });
  }
}
const contextStart=Math.max(0,range.off-8);
const contextEnd=Math.min(base.length,range.off+persisted.length+8);
const summary={
  mode:'inspect-persisted-range0',
  totalCanonicalPersistedRanges:canonical.patches.length,
  rangeIndex:0,
  rangeOffset:range.off,
  rangeOffsetHex:hexPc(range.off),
  rangeLength:persisted.length,
  baseBytes:original,
  baseBytesHex:original.map(hexByte),
  persistedBytes:persisted,
  persistedBytesHex:persisted.map(hexByte),
  changedByteCount:changed.length,
  changedBytes:changed,
  firstPersistedByte:{
    pcOffset:range.off,
    pcOffsetHex:hexPc(range.off),
    base:original[0],
    baseHex:hexByte(original[0]),
    persisted:persisted[0],
    persistedHex:hexByte(persisted[0]),
    differs:persisted[0]!==original[0],
  },
  baseContext:{
    start:contextStart,
    startHex:hexPc(contextStart),
    endExclusive:contextEnd,
    bytes:[...base.slice(contextStart,contextEnd)],
    bytesHex:[...base.slice(contextStart,contextEnd)].map(hexByte),
  },
};
console.log(JSON.stringify(summary,null,2));
