import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPlusRom} from '../src/core/build-plus.mjs';
import {canonicalProjectSemantic} from '../src/core/project-semantic.mjs';
import {plusPlayerWriter} from '../src/core/plus-player-writer.mjs';
import {plusRomMetaWriter} from '../src/core/plus-rom-meta.mjs';
import {plusStrategyTextWriter} from '../src/core/plus-strategy-text.mjs';
import {preparePlusTacticalInfrastructure} from '../src/core/plus-tactics-infrastructure.mjs';
import {plusTacticsWriter} from '../src/core/plus-tactics-writer.mjs';
import {PLUS_BASELINE,assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function hasTacticalEdits(state){
  const teams=state?.plusTactics?.teams;
  return !!teams&&typeof teams==='object'&&!Array.isArray(teams)&&Object.keys(teams).length>0;
}
function playerNamesOnlyState(state){
  const edits=(state?.playerEdits??[])
    .filter(edit=>edit?.name!==undefined)
    .map(edit=>({
      team:edit.team,
      player:edit.player,
      name:edit.name,
      ...(edit.alignment!==undefined?{alignment:edit.alignment}:{}),
      ...(edit.manualFixed!==undefined?{manualFixed:edit.manualFixed}:{}),
    }));
  return {...state,playerEdits:edits};
}
function playerAttributesOnlyState(state){
  const edits=(state?.playerEdits??[]).map(edit=>{
    const out={team:edit.team,player:edit.player};
    if(edit.skills!==undefined)out.skills=edit.skills;
    if(edit.naturalPosition!==undefined)out.naturalPosition=edit.naturalPosition;
    if(edit.jersey!==undefined)out.jersey=edit.jersey;
    if(edit.appearanceRaw!==undefined)out.appearanceRaw=edit.appearanceRaw;
    return out;
  });
  return {...state,playerEdits:edits};
}
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
const semantic=canonicalProjectSemantic(project);
await mkdir(outDir,{recursive:true});
const stem=basename(projectPath).replace(/\.issdproj$/i,'');

const variants=[
  {id:'00-base-exact',exactBase:true},
  {id:'01-rom-meta-only',writers:[plusRomMetaWriter]},
  {id:'02-players-only',writers:[plusPlayerWriter]},
  {id:'02a-player-names-only',writers:[plusPlayerWriter],state:playerNamesOnlyState(semantic)},
  {id:'02b-player-attributes-only',writers:[plusPlayerWriter],state:playerAttributesOnlyState(semantic)},
  {id:'02c-players-no-checksum',writers:[plusPlayerWriter],writeChecksum:false},
  {id:'03-strategies-only',writers:[plusStrategyTextWriter]},
  {id:'04-safe-combined',writers:[plusPlayerWriter,plusStrategyTextWriter,plusRomMetaWriter]},
  {id:'05-tactics-only',writers:[plusTacticsWriter],tactics:true},
];

const results=[];
for(const variant of variants){
  let rom;
  if(variant.exactBase){
    rom=base.slice();
  }else{
    const prepareInfrastructure=variant.tactics&&hasTacticalEdits(semantic)
      ?work=>preparePlusTacticalInfrastructure(work)
      :null;
    rom=buildPlusRom(base,{
      semanticState:variant.state??semantic,
      prepareInfrastructure,
      writers:variant.writers,
      writeChecksum:variant.writeChecksum!==false,
    }).rom;
  }
  const outputPath=join(outDir,`${stem}-${variant.id}.sfc`);
  await writeFile(outputPath,rom);
  const result={
    id:variant.id,
    outputPath,
    size:rom.length,
    sha256:sha256(rom),
    changedBytes:rom.reduce((count,value,index)=>count+(index>=base.length||value!==base[index]?1:0),0),
  };
  results.push(result);
  console.log(JSON.stringify(result,null,2));
}

console.log(JSON.stringify({
  baseSha256:PLUS_BASELINE.sha256,
  playerEdits:(semantic.playerEdits??[]).length,
  playerNameEdits:(semantic.playerEdits??[]).filter(edit=>edit?.name!==undefined).length,
  tacticalEditsPresent:hasTacticalEdits(semantic),
  testOrder:results.map(result=>result.id),
},null,2));
