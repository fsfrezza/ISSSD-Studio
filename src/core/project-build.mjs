import {buildPlusWithPipeline,createPlusBuildStages} from './plus-build-pipeline.mjs';
import {runBuildPipeline} from './build-pipeline.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

export function buildPlusProjectRom(baseRom,project,options={}){
  const canonical=canonicalProjectState(project,{baseSize:baseRom?.length});
  const ignorePersistedPatches=options.ignorePersistedPatches===true;
  const semanticState=canonicalProjectSemantic(project);
  const userWriters=options.writers??[];
  if(!Array.isArray(userWriters)||userWriters.some(writer=>typeof writer!=='function'))throw new TypeError('writers must be functions');
  const keepCheckpoints=options.keepCheckpoints===true;
  const writeChecksum=options.writeChecksum!==false;
  const userPrepare=options.prepareInfrastructure??null;
  if(userPrepare!==null&&typeof userPrepare!=='function')throw new TypeError('prepareInfrastructure must be a function');

  const patches=ignorePersistedPatches?[]:canonical.patches;
  let result;

  if(userPrepare){
    const stages=createPlusBuildStages({baseRom,patches,extraWriters:userWriters,writeChecksum});
    stages.splice(1,0,{
      id:'01b-legacy-caller-infrastructure',kind:'derived',
      run:(work,state)=>{
        const next=userPrepare(work,state);
        return next===undefined?work:next;
      },
    });
    result=runBuildPipeline(baseRom,{state:semanticState,stages,keepCheckpoints});
    if(result.rom.length!==0x400000)throw new Error(`Plus project pipeline must finish at 4 MiB; got ${result.rom.length} bytes`);
  }else{
    result=buildPlusWithPipeline(baseRom,{
      semanticState,
      patches,
      extraWriters:userWriters,
      writeChecksum,
      keepCheckpoints,
    });
  }

  return {
    ...result,
    diff:diffRanges(baseRom,result.rom),
    projectState:canonical,
    ignoredPersistedPatches:ignorePersistedPatches,
    buildPipeline:'isssd-plus-build-pipeline-v1',
  };
}
