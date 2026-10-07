import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {readSnesChecksum} from '../src/core/rom-integrity.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}

const [romPath,projectPath,...rest]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/build-semantic-only-plus-project.mjs <clean-plus.sfc> <project.issdproj> [--out-dir <dir>]');
  process.exit(2);
}
let outDir=null;
const outAt=rest.indexOf('--out-dir');
if(outAt>=0)outDir=rest[outAt+1]??null;

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const result=buildPlusProjectRom(base,project,{ignorePersistedPatches:true});
const digest=sha256(result.rom);
const checksum=readSnesChecksum(result.rom);
const summary={
  project:projectPath,
  mode:'semantic-only',
  persistedPatchesApplied:false,
  outputSize:result.rom.length,
  outputSha256:digest,
  changedBytes:result.diff.changedBytes,
  ranges:result.diff.ranges.length,
  checksum,
};
if(outDir){
  await mkdir(outDir,{recursive:true});
  const stem=basename(projectPath).replace(/\.issdproj$/i,'');
  const outputPath=join(outDir,`${stem}-semantic-only.sfc`);
  await writeFile(outputPath,result.rom);
  summary.outputPath=outputPath;
}
console.log(JSON.stringify(summary,null,2));
