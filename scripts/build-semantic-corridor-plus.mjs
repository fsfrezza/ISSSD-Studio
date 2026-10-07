import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPlusRom} from '../src/core/build-plus.mjs';
import {plusPlayerWriter} from '../src/core/plus-player-writer.mjs';
import {PLUS_BASELINE,assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function usage(){
  console.error('Usage: node scripts/build-semantic-corridor-plus.mjs <clean-plus.sfc> <project.issdproj> --out-dir <dir>');
}

const args=process.argv.slice(2);
const outAt=args.indexOf('--out-dir');
if(outAt<0||!args[outAt+1]){usage();process.exit(2);}
const outDir=args[outAt+1];
args.splice(outAt,2);
if(args.length!==2){usage();process.exit(2);}
const [romPath,projectPath]=args;
const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});
const project=JSON.parse(await readFile(projectPath,'utf8'));
await mkdir(outDir,{recursive:true});
const stem=basename(projectPath).replace(/\.issdproj$/i,'');

// Diagnostic intent: do NOT migrate legacy teamsV1.names[*].attrHex here.
// Only modern, explicitly persisted playerEdits are allowed to write attributes.
const sourceSemantic=project?.state?.semantic??project?.semantic??{};
const explicitPlayerEdits=Array.isArray(sourceSemantic?.playerEdits)
  ?structuredClone(sourceSemantic.playerEdits)
  :[];
const semanticState={playerEdits:explicitPlayerEdits};

const rom=buildPlusRom(base,{
  semanticState,
  writers:[plusPlayerWriter],
  writeChecksum:true,
}).rom;
const outputPath=join(outDir,`${stem}-player-explicit-only.sfc`);
await writeFile(outputPath,rom);

console.log(JSON.stringify({
  id:'player-explicit-only',
  outputPath,
  size:rom.length,
  sha256:sha256(rom),
  explicitPlayerEdits:explicitPlayerEdits.length,
  changedBytes:rom.reduce((count,value,index)=>count+(index>=base.length||value!==base[index]?1:0),0),
  note:'legacy attrHex snapshots intentionally ignored',
  baseSha256:PLUS_BASELINE.sha256,
},null,2));
