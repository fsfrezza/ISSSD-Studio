import {applyCanonicalPatches} from './canonical-patches.mjs';
import {buildPlusRom} from './build-plus.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {plusRomMetaWriter} from './plus-rom-meta.mjs';
import {preparePlusTacticalInfrastructure} from './plus-tactics-infrastructure.mjs';
import {plusTacticsWriter} from './plus-tactics-writer.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

function hasTacticalEdits(semanticState){
  const teams=semanticState?.plusTactics?.teams;
  return !!teams && typeof teams==='object' && !Array.isArray(teams) && Object.keys(teams).length>0;
}

export function buildPlusProjectRom(baseRom,project,options={}){
  const canonical=canonicalProjectState(project,{baseSize:baseRom?.length});
  const patchedBase=applyCanonicalPatches(baseRom,canonical.patches);
  const semanticState=canonicalProjectSemantic(project);
  const userWriters=options.writers??[];
  if(!Array.isArray(userWriters))throw new TypeError('writers must be functions');
  const userPrepare=options.prepareInfrastructure??null;
  if(userPrepare!==null&&typeof userPrepare!=='function')throw new TypeError('prepareInfrastructure must be a function');
  const tacticalEdits=hasTacticalEdits(semanticState);
  const {writers:_writers,prepareInfrastructure:_prepareInfrastructure,...buildOptions}=options;

  const prepareInfrastructure=(userPrepare||tacticalEdits)
    ?(work,state)=>{
      let prepared=work;
      if(userPrepare){
        const result=userPrepare(prepared,state);
        if(result!==undefined)prepared=result;
      }
      if(tacticalEdits)prepared=preparePlusTacticalInfrastructure(prepared);
      return prepared;
    }
    :null;

  const result=buildPlusRom(patchedBase,{
    ...buildOptions,
    semanticState,
    prepareInfrastructure,
    // Generated infrastructure is complete before semantic writers run.
    // Player attributes use verified surgical writes; tactics write only to
    // resolved exclusive records and refuse shared presets. ROM metadata is
    // semantic too and is applied before the derived SNES checksum is written.
    writers:[plusPlayerWriter,plusTacticsWriter,plusRomMetaWriter,...userWriters],
  });

  return {
    ...result,
    diff:diffRanges(baseRom,result.rom),
    projectState:canonical,
  };
}
