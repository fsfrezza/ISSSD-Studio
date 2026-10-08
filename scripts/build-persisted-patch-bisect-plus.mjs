import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {canonicalProjectState} from '../src/core/project-state.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {readSnesChecksum} from '../src/core/rom-integrity.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}

const [romPath,projectPath,...rest]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/build-persisted-patch-bisect-plus.mjs <clean-plus.sfc> <project.issdproj> [--out-dir <dir>] [--start <n>] [--end <n>] [--part <n> --parts <n>] [--byte-part <n> --byte-parts <n>]');
  process.exit(2);
}
function argValue(name){const i=rest.indexOf(name);return i>=0?rest[i+1]:null;}
const outDir=argValue('--out-dir');

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const canonical=canonicalProjectState(project,{baseSize:base.length});
const total=canonical.patches.length;

const partRaw=argValue('--part');
const partsRaw=argValue('--parts');
let start;
let end;
if(partRaw!==null||partsRaw!==null){
  const part=Number(partRaw);
  const parts=Number(partsRaw);
  if(!Number.isInteger(part)||!Number.isInteger(parts)||parts<1||part<0||part>=parts){
    throw new RangeError(`invalid patch partition part=${partRaw} parts=${partsRaw}`);
  }
  start=Math.ceil(total*part/parts);
  end=Math.ceil(total*(part+1)/parts);
}else{
  start=Number(argValue('--start') ?? 0);
  const endRaw=argValue('--end');
  end=endRaw==null?Math.ceil(total/2):Number(endRaw);
}
if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>total){
  throw new RangeError(`invalid patch slice ${start}..${end} for ${total} canonical persisted ranges`);
}

let subset=canonical.patches.slice(start,end).map(p=>({off:p.off,data:[...p.data]}));
let byteSelection=null;
const bytePartRaw=argValue('--byte-part');
const bytePartsRaw=argValue('--byte-parts');
if(bytePartRaw!==null||bytePartsRaw!==null){
  if(subset.length!==1) throw new RangeError('byte partitioning requires exactly one selected canonical range');
  const bytePart=Number(bytePartRaw);
  const byteParts=Number(bytePartsRaw);
  if(!Number.isInteger(bytePart)||!Number.isInteger(byteParts)||byteParts<1||bytePart<0||bytePart>=byteParts){
    throw new RangeError(`invalid byte partition bytePart=${bytePartRaw} byteParts=${bytePartsRaw}`);
  }
  const source=subset[0];
  const sourceLength=source.data.length;
  const byteStart=Math.ceil(sourceLength*bytePart/byteParts);
  const byteEnd=Math.ceil(sourceLength*(bytePart+1)/byteParts);
  const sliced=source.data.slice(byteStart,byteEnd);
  if(sliced.length===0) throw new RangeError(`byte partition ${bytePart}/${byteParts} is empty for range length ${sourceLength}`);
  subset=[{off:source.off+byteStart,data:sliced}];
  byteSelection={
    sourceRangeIndex:start,
    sourceRangeOffset:source.off,
    sourceRangeLength:sourceLength,
    bytePart,
    byteParts,
    startInclusive:byteStart,
    endExclusive:byteEnd,
    count:byteEnd-byteStart,
  };
}

const diagnostic=structuredClone(project);
diagnostic.state=diagnostic.state&&typeof diagnostic.state==='object'&&!Array.isArray(diagnostic.state)?diagnostic.state:{};
diagnostic.state.targetLength=base.length;
diagnostic.state.patchesCompact=subset;
delete diagnostic.state.patches;
delete diagnostic.patchesCompact;
delete diagnostic.patches;
delete diagnostic.targetLength;

const result=buildPlusProjectRom(base,diagnostic);
const digest=sha256(result.rom);
const checksum=readSnesChecksum(result.rom);
const selectedBytes=subset.reduce((n,p)=>n+p.data.length,0);
const first=subset[0]??null,last=subset.at(-1)??null;
const summary={
  project:projectPath,
  mode:'persisted-patch-bisect',
  totalCanonicalPersistedRanges:total,
  selectedRangeIndexes:{startInclusive:start,endExclusive:end,count:end-start},
  byteSelection,
  selectedBytes,
  selectedPcSpan:first&&last?{start:first.off,endExclusive:last.off+last.data.length}:null,
  outputSize:result.rom.length,
  outputSha256:digest,
  changedBytes:result.diff.changedBytes,
  ranges:result.diff.ranges.length,
  checksum,
};
if(outDir){
  await mkdir(outDir,{recursive:true});
  const stem=basename(projectPath).replace(/\.issdproj$/i,'');
  const byteSuffix=byteSelection?`-bytes-${byteSelection.startInclusive}-${byteSelection.endExclusive}`:'';
  const outputPath=join(outDir,`${stem}-patch-bisect-${start}-${end}${byteSuffix}.sfc`);
  await writeFile(outputPath,result.rom);
  summary.outputPath=outputPath;
}
console.log(JSON.stringify(summary,null,2));
