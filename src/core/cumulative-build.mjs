import {buildPlusProjectRom} from './project-build.mjs';
import {preparePlusTacticalInfrastructure} from './plus-tactics-infrastructure.mjs';
import {syncPlusRuntimeMirrors,validatePlusRuntimeMirrors,writeFinalSnesChecksum} from './plus-export-finalizer.mjs';
import {CUMULATIVE_AREAS,areaClassifier,selectedCumulativeAreas} from './cumulative-areas.mjs';
import {applyNativeTitleGraphics} from './native-title-graphics.mjs';
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function finalize(rom){syncPlusRuntimeMirrors(rom);writeFinalSnesChecksum(rom);return rom;}

export function buildCumulativeProject(base,project,{onRom,selectedAreas,titleGraphics}={}){
 if(typeof onRom!=='function')throw new TypeError('onRom callback required');
 const selected=selectedCumulativeAreas(selectedAreas),original=base.slice();
 const foundation=finalize(preparePlusTacticalInfrastructure(base)),work=foundation.slice();
 let target;
 try{
  target=buildPlusProjectRom(base,project,{forceTacticalInfrastructure:true,selectedAreas:selected}).rom;
  if(selected.includes('tela-inicial'))applyNativeTitleGraphics(target,base,project,titleGraphics);
  finalize(target);
 }catch(e){throw new Error('Etapa cumulativa: '+e.message,{cause:e});}
 const classify=areaClassifier(target,base),writes=new Map(CUMULATIVE_AREAS.map(a=>[a.id,[]]));
 const unassigned=[];let current=null;
 for(let off=0;off<target.length;off++){
  if(target[off]===work[off]){current=null;continue;}
  const area=classify(off);if(area===null){current=null;continue;}
  const key=area??'unassigned';
  if(current?.area===key&&current.end===off)current.end++;
  else{current={area:key,start:off,end:off+1};(area?writes.get(area):unassigned).push(current);}
 }
 const entries=[];
 for(const area of CUMULATIVE_AREAS){
  if(!selected.includes(area.id))continue;
  const ranges=writes.get(area.id);
  for(const r of ranges)work.set(target.subarray(r.start,r.end),r.start);
  const name=`${String(area.number).padStart(2,'0')}-${area.id}.sfc`,snapshot=finalize(work.slice());
  if(snapshot.length!==0x400000||!validatePlusRuntimeMirrors(snapshot))throw new Error('Snapshot cumulativo inválido');
  const entry={index:area.number,name,stage:area.id,change:area.id,area:area.label,size:snapshot.length,
   status:ranges.length?'aplicada':area.id==='infraestrutura'?'obrigatoria':'sem-alteracao-binaria',
   changedBytes:ranges.reduce((n,r)=>n+r.end-r.start,0),ranges:ranges.map(r=>({start:r.start,end:r.end}))};
  onRom(snapshot,entry);entries.push(entry);
 }
 // Independently construct the selected-area reference. Unselected domains and
 // unclassified legacy writes must never leak into later cumulative snapshots.
 const expected=foundation.slice();
 for(const area of CUMULATIVE_AREAS)if(selected.includes(area.id))for(const r of writes.get(area.id))expected.set(target.subarray(r.start,r.end),r.start);
 finalize(expected);const final=finalize(work.slice());
 if(!equal(final,expected))throw new Error('Última ROM não corresponde às fases selecionadas');
 if(!equal(base,original))throw new Error('ROM-base foi alterada');
 return {schema:'isssd-cumulative-roms-v1',version:3,granularity:'selected-game-area',selectedAreas:selected,entries,
  skippedAreas:CUMULATIVE_AREAS.filter(a=>!selected.includes(a.id)).map(a=>a.id),
  unassignedLegacyRanges:unassigned.map(r=>({start:r.start,end:r.end})),
  finalRom:entries.at(-1).name,baseUnchanged:true,finalMatchesSelectedAreas:true,
  notes:['Preparação obrigatória em todas as ROMs; seleção da fase 01 controla apenas seu arquivo.',
   'Fases desmarcadas não são aplicadas nem geram ROM. A numeração 01–09 é fixa.',
   'Bytes legados sem área confirmada são reportados e não são aplicados por suposição.']};
}
