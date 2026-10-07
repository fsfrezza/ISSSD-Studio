import {applyCanonicalPatches} from './canonical-patches.mjs';
import {buildPlusRom} from './build-plus.mjs';
import {plusMainMenuWriter} from './plus-main-menu-renderer.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {plusRomMetaWriter} from './plus-rom-meta.mjs';
import {plusStrategyTextWriter} from './plus-strategy-text.mjs';
import {preparePlusTacticalInfrastructure} from './plus-tactics-infrastructure.mjs';
import {plusTacticsWriter} from './plus-tactics-writer.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

function hasTacticalEdits(semanticState){
  const teams=semanticState?.plusTactics?.teams;
  return !!teams && typeof teams==='object' && !Array.isArray(teams) && Object.keys(teams).length>0;
}

function committedPlusMainMenuWriter(rom,state){
  // Logical text drafts and menuScreenV1 were historically project/preview
  // state only. mainMenuGraphicTextsV600 was created only after verify() had
  // proven all five native blocks fit. Preserve that distinction in the new
  // core: only explicitly committed native graphics may materialize in ROM.
  if(state?.plusMainMenu?.nativeCommitted!==true)return rom;
  return plusMainMenuWriter(rom,state);
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
    // resolved exclusive records and refuse shared presets. Verified strategy
    // phrases use native 2x10 records. Main-menu graphics are rebuilt only for
    // an explicitly native-committed menu. ROM metadata precedes checksum.
    writers:[plusPlayerWriter,plusTacticsWriter,plusStrategyTextWriter,committedPlusMainMenuWriter,plusRomMetaWriter,...userWriters],
  });

  return {
    ...result,
    diff:diffRanges(baseRom,result.rom),
    projectState:canonical,
  };
}
