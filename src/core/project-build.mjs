import {applyCanonicalPatches} from './canonical-patches.mjs';
import {buildPlusRom} from './build-plus.mjs';
import {reconcileKnownPlayerIntegrityMirrors} from './plus-player.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {plusRomMetaWriter} from './plus-rom-meta.mjs';
import {plusStrategyTextWriter} from './plus-strategy-text.mjs';
import {ensureExclusivePlusTacticalRecords} from './plus-tactics-native-individualization.mjs';
import {plusTacticsWriter} from './plus-tactics-writer.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {canonicalProjectState} from './project-state.mjs';
import {diffRanges} from './rom-integrity.mjs';

function tacticalEditTeams(semanticState){
  const teams=semanticState?.plusTactics?.teams;
  if(!teams||typeof teams!=='object'||Array.isArray(teams))return [];
  return Object.keys(teams).map(Number).filter(Number.isInteger).sort((a,b)=>a-b);
}

export function buildPlusProjectRom(baseRom,project,options={}){
  const canonical=canonicalProjectState(project,{baseSize:baseRom?.length});
  const ignorePersistedPatches=options.ignorePersistedPatches===true;
  const persistedBase=ignorePersistedPatches ? baseRom : applyCanonicalPatches(baseRom,canonical.patches);
  const patchedBase=reconcileKnownPlayerIntegrityMirrors(baseRom,persistedBase);
  const semanticState=canonicalProjectSemantic(project);
  const userWriters=options.writers??[];
  if(!Array.isArray(userWriters))throw new TypeError('writers must be functions');
  const userPrepare=options.prepareInfrastructure??null;
  if(userPrepare!==null&&typeof userPrepare!=='function')throw new TypeError('prepareInfrastructure must be a function');
  const tacticalTeams=tacticalEditTeams(semanticState);
  const {writers:_writers,prepareInfrastructure:_prepareInfrastructure,ignorePersistedPatches:_ignorePersistedPatches,...buildOptions}=options;

  const prepareInfrastructure=(userPrepare||tacticalTeams.length)
    ?(work,state)=>{
      let prepared=work;
      if(userPrepare){
        const result=userPrepare(prepared,state);
        if(result!==undefined)prepared=result;
      }
      if(tacticalTeams.length){
        if(prepared.length!==0x200000)throw new Error('Plus tactical semantic build must remain on the canonical 2 MiB ROM before native individualization');
        ensureExclusivePlusTacticalRecords(prepared,tacticalTeams);
      }
      return prepared;
    }
    :null;

  const result=buildPlusRom(patchedBase,{
    ...buildOptions,
    semanticState,
    prepareInfrastructure,
    // Tactical edits are individualized inside unused space in the original
    // bank $8B. No 4 MiB expansion, bank selector or loader JSL patch is part
    // of the normal project build.
    writers:[plusPlayerWriter,plusTacticsWriter,plusStrategyTextWriter,plusRomMetaWriter,...userWriters],
  });

  return {
    ...result,
    diff:diffRanges(baseRom,result.rom),
    projectState:canonical,
    ignoredPersistedPatches:ignorePersistedPatches,
  };
}
