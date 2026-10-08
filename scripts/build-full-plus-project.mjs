import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {readSnesChecksum} from '../src/core/rom-integrity.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}

const [romPath,projectPath,...rest]=process.argv.slice(2);
if(!romPath||!projectPath){
  console.error('Usage: node scripts/build-full-plus-project.mjs <clean-plus.sfc> <project.issdproj> --output <output.sfc>');
  process.exit(2);
}
const outputAt=rest.indexOf('--output');
const outputPath=outputAt>=0?rest[outputAt+1]:null;
if(!outputPath){
  console.error('--output <output.sfc> is required');
  process.exit(2);
}

const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
const result=buildPlusProjectRom(base,project);
await writeFile(outputPath,result.rom);
const summary={
  mode:'full-project-integrity-reconciled',
  project:resolve(projectPath),
  persistedPatchesApplied:true,
  outputPath:resolve(outputPath),
  outputSize:result.rom.length,
  outputSha256:sha256(result.rom),
  changedBytes:result.diff.changedBytes,
  ranges:result.diff.ranges.length,
  checksum:readSnesChecksum(result.rom),
};
console.log(JSON.stringify(summary,null,2));
