import {diffRanges} from './rom-integrity.mjs';

function requireBytes(value,label){
  if(!(value instanceof Uint8Array))throw new TypeError(`${label} must be Uint8Array`);
  return value;
}

function cloneReport(report){
  return report.map(stage=>({
    ...stage,
    diff:stage.diff?{...stage.diff,ranges:stage.diff.ranges?.map(r=>({...r}))}:stage.diff,
  }));
}

export class BuildStageError extends Error{
  constructor(stageId,cause,{report,lastSuccessfulStage}={}){
    super(`Build stage ${stageId} failed: ${cause?.message||String(cause)}`);
    this.name='BuildStageError';
    this.stageId=stageId;
    this.cause=cause;
    this.lastSuccessfulStage=lastSuccessfulStage??null;
    this.report=cloneReport(report||[]);
  }
}

export function runBuildPipeline(baseRom,{state={},stages=[],keepCheckpoints=false}={}){
  requireBytes(baseRom,'base ROM');
  if(!Array.isArray(stages))throw new TypeError('stages must be an array');
  const immutableBase=baseRom.slice();
  let work=baseRom.slice();
  const report=[];
  const checkpoints=[];
  let lastSuccessfulStage=null;

  for(let index=0;index<stages.length;index++){
    const stage=stages[index];
    if(!stage||typeof stage!=='object'||typeof stage.id!=='string'||!stage.id)throw new TypeError(`invalid build stage at index ${index}`);
    if(typeof stage.run!=='function')throw new TypeError(`build stage ${stage.id} requires run()`);
    const kind=stage.kind??'semantic';
    if(kind!=='semantic'&&kind!=='derived')throw new TypeError(`build stage ${stage.id} has invalid kind`);
    const enabled=typeof stage.when==='function'?!!stage.when(state,work):stage.when!==false;
    if(!enabled){
      report.push({id:stage.id,kind,status:'skipped',inputLength:work.length,outputLength:work.length,diff:{changedBytes:0,ranges:[]}});
      continue;
    }

    const before=work.slice();
    try{
      const returned=stage.run(work,state,{index,stageId:stage.id,kind});
      if(returned!==undefined)work=requireBytes(returned,`build stage ${stage.id} result`);
      const diff=diffRanges(before,work);
      const entry={id:stage.id,kind,status:'ok',inputLength:before.length,outputLength:work.length,diff};
      report.push(entry);
      lastSuccessfulStage=stage.id;
      if(keepCheckpoints)checkpoints.push({id:stage.id,kind,rom:work.slice(),diff});
    }catch(error){
      report.push({id:stage.id,kind,status:'failed',inputLength:before.length,outputLength:work.length,error:error?.message||String(error)});
      throw new BuildStageError(stage.id,error,{report,lastSuccessfulStage});
    }
  }

  if(baseRom.length!==immutableBase.length||baseRom.some((value,index)=>value!==immutableBase[index]))throw new Error('build pipeline mutated immutable base ROM');

  return {rom:work,report,checkpoints,lastSuccessfulStage};
}
