import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {PLUS_BASELINE,assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {readSnesChecksum} from '../src/core/rom-integrity.mjs';

function sha256(bytes){
  return createHash('sha256').update(bytes).digest('hex');
}

function equalBytes(a,b){
  if(a.length!==b.length)return false;
  for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;
  return true;
}

function usage(){
  console.error('Usage: node scripts/verify-real-plus-project.mjs <clean-plus.sfc> <project1.issdproj> [project2.issdproj ...] [--out-dir <dir>]');
}

const args=process.argv.slice(2);
let outDir=null;
const outAt=args.indexOf('--out-dir');
if(outAt>=0){
  outDir=args[outAt+1]??null;
  args.splice(outAt,2);
}
if(args.length<2){usage();process.exit(2);}

const [romPath,...projectPaths]=args;
const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});

if(outDir)await mkdir(outDir,{recursive:true});

console.log(JSON.stringify({
  base:{path:romPath,size:base.length,sha256:PLUS_BASELINE.sha256},
  projects:projectPaths.length,
},null,2));

const outputs=[];
for(const projectPath of projectPaths){
  const project=JSON.parse(await readFile(projectPath,'utf8'));
  const first=buildPlusProjectRom(base,project);
  const second=buildPlusProjectRom(base,project);
  if(!equalBytes(first.rom,second.rom))throw new Error(`non-deterministic build: ${projectPath}`);

  const digest=sha256(first.rom);
  const checksum=readSnesChecksum(first.rom);
  const result={
    project:projectPath,
    outputSize:first.rom.length,
    outputSha256:digest,
    changedBytes:first.diff.changedBytes,
    ranges:first.diff.ranges.length,
    checksum,
    deterministic:true,
  };

  if(outDir){
    const stem=basename(projectPath).replace(/\.issdproj$/i,'');
    const outputPath=join(outDir,`${stem}-verified.sfc`);
    await writeFile(outputPath,first.rom);
    result.outputPath=outputPath;
  }

  outputs.push({path:projectPath,rom:first.rom,digest});
  console.log(JSON.stringify(result,null,2));
}

if(outputs.length>1){
  const reference=outputs[0];
  for(const candidate of outputs.slice(1)){
    console.log(JSON.stringify({
      compare:[reference.path,candidate.path],
      identical:equalBytes(reference.rom,candidate.rom),
      referenceSha256:reference.digest,
      candidateSha256:candidate.digest,
    },null,2));
  }
}
