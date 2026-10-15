import {canonicalProjectState} from './project-state.mjs';
import {canonicalProjectSemantic} from './project-semantic.mjs';
import {createPlusBuildStages} from './plus-build-pipeline.mjs';
import {buildPlusProjectRom} from './project-build.mjs';
import {teamsV3PlayerSteps,teamsV3TacticalSteps} from './teams-v3-writer.mjs';
import {plusPlayerWriter} from './plus-player-writer.mjs';
import {plusTacticsWriter} from './plus-tactics-writer.mjs';
import {plusStrategyTextWriter} from './plus-strategy-text.mjs';
import {syncPlusRuntimeMirrors,validatePlusRuntimeMirrors,writeFinalSnesChecksum} from './plus-export-finalizer.mjs';

function units(stage,base,state,patches){
 if(stage.id==='02-legacy-patches')return patches.map((p,i)=>({id:`patch-${String(i+1).padStart(4,'0')}-pc-${p.off.toString(16)}`,run:r=>{r.set(p.data,p.off);return r;}}));
 if(stage.id==='04-player-edits')return (state.playerEdits||[]).map((e,i)=>({id:`legacy-player-${e.team}-${e.player+1}-${i}`,run:r=>plusPlayerWriter(r,{playerEdits:[e]})}));
 if(stage.id==='04b-teams-v3-players')return teamsV3PlayerSteps(base,state);
 if(stage.id==='06-tactics')return Object.entries(state.plusTactics?.teams||{}).sort(([a],[b])=>Number(a)-Number(b)).map(([k,t])=>({id:`legacy-tactics-${k}`,run:r=>plusTacticsWriter(r,{plusTactics:{teams:{[k]:t}}})}));
 if(stage.id==='06b-teams-v3-tactics')return teamsV3TacticalSteps(base,state);
 if(stage.id==='07-strategy-text')return Object.keys(state.plusStrategyTexts?.items||{}).sort().map(k=>({id:`strategy-${k}`,run:r=>plusStrategyTextWriter(r,{plusStrategyTexts:{items:{[k]:state.plusStrategyTexts.items[k]}}})}));
 return [stage];
}
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);

// onRom is synchronous: consumers may compress/write each snapshot immediately.
// Only the working ROM and previous finalized snapshot remain in memory.
export function buildCumulativeProject(base,project,{onRom}={}){
 if(typeof onRom!=='function')throw new TypeError('onRom callback required');
 const original=base.slice(),canonical=canonicalProjectState(project,{baseSize:base.length});
 const state=canonicalProjectSemantic(project),stages=createPlusBuildStages({baseRom:base,patches:canonical.patches});
 let work=base.slice(),previous=null;const entries=[],skipped=[];
 for(const stage of stages){
  const enabled=typeof stage.when==='function'?stage.when(state,work):stage.when!==false;
  if(!enabled)continue;
  for(const step of units(stage,base,state,canonical.patches)){
   try{work=step.run(work,state)||work;}catch(e){throw new Error(`Etapa cumulativa ${step.id}: ${e.message}`,{cause:e});}
   const snapshot=work.slice();syncPlusRuntimeMirrors(snapshot);writeFinalSnesChecksum(snapshot);
   if(snapshot.length!==0x400000||!validatePlusRuntimeMirrors(snapshot))throw new Error('Snapshot cumulativo inválido');
   if(previous&&equal(previous,snapshot)){skipped.push(step.id);continue;}
   const index=entries.length+1,name=`${String(index).padStart(4,'0')}-${step.id.replace(/[^a-zA-Z0-9._-]/g,'_')}.sfc`;
   const entry={index,name,stage:stage.id,change:step.id,size:snapshot.length};
   onRom(snapshot,entry);entries.push(entry);previous=snapshot;
  }
 }
 const final=buildPlusProjectRom(base,project).rom;
 if(!previous||!equal(previous,final))throw new Error('Última ROM cumulativa difere do build canônico; ZIP cancelado');
 if(!equal(base,original))throw new Error('ROM-base foi alterada');
 const supported=new Set(['teamsV1','playerEdits','plusTactics','plusStrategyTexts','romInternalTitle']);
 const retainedDomainsWithoutWriter=Object.keys(state).filter(k=>!supported.has(k));
 return {retainedDomainsWithoutWriter,schema:'isssd-cumulative-roms-v1',granularity:'player-record/tactical-player/patch/text/metadata',entries,skippedNoOps:skipped,finalRom:entries.at(-1).name,baseUnchanged:true,finalMatchesCanonicalBuild:true};
}
