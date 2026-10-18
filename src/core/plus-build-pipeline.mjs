import {plusMatchStatisticsWriter} from './plus-match-statistics.mjs';
import {plusMatchAnnouncementsWriter} from './plus-match-announcements.mjs';
import {plusTeamNamesWriter} from './plus-team-names.mjs';
import {plusGroupTitlesWriter} from './plus-group-titles.mjs';
import {plusGroupIdentityWriter} from './plus-group-identity.mjs';
import {plusPrematchGraphicsWriter} from './plus-prematch-graphics.mjs';
import {plusLinkedScreenTextWriter} from './plus-linked-screen-text.mjs';
import {plusGraphicalLabelsWriter} from './plus-graphical-labels.mjs';
import {plusNativeMenuTextWriter} from './plus-native-menu-text.mjs';
import {plusCursorTextWriter} from './plus-cursor-text.mjs';
import {teamsV3PlayerSteps,teamsV3TacticalSteps,hasTeamsV3Tactics,applySteps} from './teams-v3-writer.mjs';
import {runBuildPipeline} from './build-pipeline.mjs';
import {PLUS,reconcileKnownPlayerIntegrityMirrors} from './plus-player.mjs';
import {expandPlusTo4MiB,preparePlusTacticalInfrastructure} from './plus-tactics-infrastructure.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {plusTacticsWriter} from './plus-tactics-writer.mjs';
import {plusStrategyTextWriter} from './plus-strategy-text.mjs';
import {plusControllerTextWriter} from './plus-controller-text.mjs';
import {plusNativeScreenTextWriter} from './plus-native-screen-text.mjs';
import {plusMainMenuWriter} from './plus-main-menu-renderer.mjs';
import {plusRomMetaWriter} from './plus-rom-meta.mjs';
import {syncPlusRuntimeMirrors,validatePlusRuntimeMirrors,writeFinalSnesChecksum} from './plus-export-finalizer.mjs';

function hasTacticalEdits(state){
  const teams=state?.plusTactics?.teams;
  return (!!teams&&typeof teams==='object'&&!Array.isArray(teams)&&Object.keys(teams).length>0)||hasTeamsV3Tactics(state);
}

function applyValidatedPatches(work,patches){
  for(const patch of patches){
    if(!Number.isInteger(patch?.off)||!(patch?.data instanceof Uint8Array))throw new TypeError('canonical patch required');
    if(patch.off<0||patch.off+patch.data.length>PLUS.baseSize)throw new RangeError('persisted patch crosses immutable base boundary');
    work.set(patch.data,patch.off);
  }
  return work;
}

export function createPlusBuildStages({baseRom,patches=[],extraWriters=[],writeChecksum=true,forceTacticalInfrastructure=false,selectedAreas=null}={}){
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
      id:'04-player-edits',kind:'semantic',when:!selectedAreas||selectedAreas.includes('jogadores'),
      run:(work,state)=>plusPlayerWriter(work,state),
    },
    {
      id:'04b-teams-v3-players',kind:'semantic',when:!selectedAreas||selectedAreas.includes('jogadores'),
      run:(work,state)=>applySteps(work,teamsV3PlayerSteps(baseRom,state)),
    },
    {
      id:'05-tactical-infrastructure',kind:'derived',
      when:state=>forceTacticalInfrastructure||hasTacticalEdits(state),
      run:work=>preparePlusTacticalInfrastructure(work),
    },
    {
      id:'06-tactics',kind:'semantic',
      when:state=>(!selectedAreas||selectedAreas.includes('formacoes'))&&hasTacticalEdits(state),
      run:(work,state)=>plusTacticsWriter(work,state),
    },
    {
      id:'06b-teams-v3-tactics',kind:'semantic',when:!selectedAreas||selectedAreas.includes('formacoes'),
      run:(work,state)=>applySteps(work,teamsV3TacticalSteps(baseRom,state)),
    },
    {
      id:'07-strategy-text',kind:'semantic',when:!selectedAreas||selectedAreas.includes('textos-estrategias'),
      run:(work,state)=>plusStrategyTextWriter(work,state),
    },
    {
      id:'07b-native-screen-text',kind:'semantic',when:!selectedAreas||selectedAreas.some(a=>a==='pre-partida'||a==='textos-estrategias'),
      run:(work,state)=>plusNativeScreenTextWriter(work,state,selectedAreas),
    },
    {
      id:'07b-cursor-help-text',kind:'semantic',when:!selectedAreas||selectedAreas.includes('pre-partida'),
      run:(work,state)=>plusCursorTextWriter(work,state,baseRom,selectedAreas),
    },
    {id:'07b-native-menu-pool',kind:'semantic',run:(work,state)=>plusNativeMenuTextWriter(work,state,baseRom,selectedAreas)},
    {id:'07b-prematch-graphics',kind:'semantic',run:(work,state)=>plusPrematchGraphicsWriter(work,state,baseRom,selectedAreas)},
    {id:'07b-linked-screen-text',kind:'semantic',run:(work,state)=>plusLinkedScreenTextWriter(work,state,baseRom,selectedAreas)},
    {id:'07b-graphical-labels',kind:'semantic',run:(work,state)=>plusGraphicalLabelsWriter(work,state,baseRom,selectedAreas)},
    {
      id:'07c-controller-text',kind:'semantic',when:!selectedAreas||selectedAreas.includes('pre-partida'),
      run:(work,state)=>plusControllerTextWriter(work,state,baseRom),
    },
    {
      // Selecting the cumulative menu phase is explicit renderer opt-in. The
      // historical default build policy remains unchanged.
      id:'07d-main-menu-text',kind:'semantic',when:state=>!!selectedAreas?.includes('menu-principal')&&state.plusMainMenu?.nativeCommitted===true,
      run:(work,state)=>plusMainMenuWriter(work,state),
    },
    {id:'07e-team-names',kind:'semantic',run:(work,state)=>plusTeamNamesWriter(work,state,baseRom,selectedAreas)},
    {id:'07e-team-group-identity',kind:'semantic',when:!!selectedAreas?.includes('selecao-equipes'),run:(work,state)=>plusGroupIdentityWriter(work,state,baseRom,selectedAreas)},
    {id:'07e-team-group-titles',kind:'semantic',when:!!selectedAreas?.includes('selecao-equipes'),run:(work,state)=>plusGroupTitlesWriter(work,state,baseRom,selectedAreas)},
    {id:'07g-match-statistics',kind:'semantic',run:(work,state)=>plusMatchStatisticsWriter(work,state,baseRom,selectedAreas)},
    {id:'07f-match-announcements',kind:'semantic',run:(work,state)=>plusMatchAnnouncementsWriter(work,state,baseRom,selectedAreas)},
    {
      id:'08-rom-metadata',kind:'semantic',when:!selectedAreas||selectedAreas.includes('metadados'),
      run:(work,state)=>plusRomMetaWriter(work,state),
    },
  ];

  extraWriters.forEach((writer,index)=>stages.push({
    id:`09-custom-${String(index+1).padStart(2,'0')}`,
    kind:'semantic',
    run:(work,state)=>writer(work,state),
  }));

  // Esta é a mesma regra de integridade que foi validada na ROM corrigida
  // manualmente: ao final de TODAS as etapas semânticas, as cópias runtime
  // conhecidas do Brasil são sincronizadas de forma incondicional e verificadas.
  stages.push({
    id:'90-integrity-mirrors',kind:'derived',
    run:work=>{
      syncPlusRuntimeMirrors(work);
      if(!validatePlusRuntimeMirrors(work))throw new Error('Plus runtime mirrors remain inconsistent after final synchronization');
      return work;
    },
  });

  // O checksum final também usa o procedimento da ROM manual funcional:
  // zera o quarteto, soma a ROM e acrescenta 0x01FE (checksum+complement).
  if(writeChecksum)stages.push({id:'99-checksum',kind:'derived',run:work=>{writeFinalSnesChecksum(work);return work;}});
  return stages;
}

export function buildPlusWithPipeline(baseRom,{semanticState={},patches=[],extraWriters=[],writeChecksum=true,keepCheckpoints=false,forceTacticalInfrastructure=false,selectedAreas=null}={}){
  const stages=createPlusBuildStages({baseRom,patches,extraWriters,writeChecksum,forceTacticalInfrastructure,selectedAreas});
  const result=runBuildPipeline(baseRom,{state:semanticState,stages,keepCheckpoints});
  if(result.rom.length!==0x400000)throw new Error(`Plus pipeline must finish at 4 MiB; got ${result.rom.length} bytes`);
  if(!validatePlusRuntimeMirrors(result.rom))throw new Error('Plus pipeline finished with invalid runtime mirrors');
  return result;
}
