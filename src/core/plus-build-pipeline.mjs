import {runBuildPipeline} from './build-pipeline.mjs';
import {PLUS,reconcileKnownPlayerIntegrityMirrors} from './plus-player.mjs';
import {expandPlusTo4MiB,preparePlusTacticalInfrastructure} from './plus-tactics-infrastructure.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {plusTacticsWriter} from './plus-tactics-writer.mjs';
import {plusStrategyTextWriter} from './plus-strategy-text.mjs';
import {plusRomMetaWriter} from './plus-rom-meta.mjs';
import {writeSnesChecksum} from './rom-integrity.mjs';

function hasTacticalEdits(state){
  const teams=state?.plusTactics?.teams;
  return !!teams&&typeof teams==='object'&&!Array.isArray(teams)&&Object.keys(teams).length>0;
}

function applyValidatedPatches(work,patches){
  for(const patch of patches){
    if(!Number.isInteger(patch?.off)||!(patch?.data instanceof Uint8Array))throw new TypeError('canonical patch required');
    if(patch.off<0||patch.off+patch.data.length>PLUS.baseSize)throw new RangeError('persisted patch crosses immutable base boundary');
    work.set(patch.data,patch.off);
  }
  return work;
}

export function createPlusBuildStages({baseRom,patches=[],extraWriters=[],writeChecksum=true}={}){
  if(!(baseRom instanceof Uint8Array)||baseRom.length!==PLUS.baseSize)throw new RangeError('canonical Plus base ROM must be exactly 2 MiB');
  if(!Array.isArray(patches))throw new TypeError('patches must be an array');
  if(!Array.isArray(extraWriters)||extraWriters.some(writer=>typeof writer!=='function'))throw new TypeError('extraWriters must be functions');

  const stages=[
    {
      id:'01-expand-4mb',kind:'derived',
      run:work=>expandPlusTo4MiB(work),
    },
    {
      id:'02-legacy-patches',kind:'semantic',
      when:patches.length>0,
      run:work=>applyValidatedPatches(work,patches),
    },
    {
      id:'03-legacy-integrity-reconcile',kind:'derived',
      when:patches.length>0,
      run:work=>{
        const lower=work.slice(0,PLUS.baseSize);
        const reconciled=reconcileKnownPlayerIntegrityMirrors(baseRom,lower);
        work.set(reconciled,0);
        return work;
      },
    },
    {
      id:'04-player-edits',kind:'semantic',
      run:(work,state)=>plusPlayerWriter(work,state),
    },
    {
      id:'05-tactical-infrastructure',kind:'derived',
      when:state=>hasTacticalEdits(state),
      run:work=>preparePlusTacticalInfrastructure(work),
    },
    {
      id:'06-tactics',kind:'semantic',
      when:state=>hasTacticalEdits(state),
      run:(work,state)=>plusTacticsWriter(work,state),
    },
    {
      id:'07-strategy-text',kind:'semantic',
      run:(work,state)=>plusStrategyTextWriter(work,state),
    },
    {
      id:'08-rom-metadata',kind:'semantic',
      run:(work,state)=>plusRomMetaWriter(work,state),
    },
  ];

  extraWriters.forEach((writer,index)=>stages.push({
    id:`09-custom-${String(index+1).padStart(2,'0')}`,
    kind:'semantic',
    run:(work,state)=>writer(work,state),
  }));

  stages.push({
    id:'90-integrity-mirrors',kind:'derived',
    run:work=>{
      const lower=work.slice(0,PLUS.baseSize);
      const reconciled=reconcileKnownPlayerIntegrityMirrors(baseRom,lower);
      work.set(reconciled,0);
      return work;
    },
  });

  if(writeChecksum)stages.push({id:'99-checksum',kind:'derived',run:work=>{writeSnesChecksum(work);return work;}});
  return stages;
}

export function buildPlusWithPipeline(baseRom,{semanticState={},patches=[],extraWriters=[],writeChecksum=true,keepCheckpoints=false}={}){
  const stages=createPlusBuildStages({baseRom,patches,extraWriters,writeChecksum});
  const result=runBuildPipeline(baseRom,{state:semanticState,stages,keepCheckpoints});
  if(result.rom.length!==0x400000)throw new Error(`Plus pipeline must finish at 4 MiB; got ${result.rom.length} bytes`);
  return result;
}
