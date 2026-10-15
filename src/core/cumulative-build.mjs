import {buildPlusProjectRom} from './project-build.mjs';
import {preparePlusTacticalInfrastructure} from './plus-tactics-infrastructure.mjs';
import {syncPlusRuntimeMirrors,validatePlusRuntimeMirrors,writeFinalSnesChecksum} from './plus-export-finalizer.mjs';
import {CUMULATIVE_AREAS,areaClassifier} from './cumulative-areas.mjs';
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function finalize(rom){syncPlusRuntimeMirrors(rom);writeFinalSnesChecksum(rom);return rom;}

// Resolve once through the canonical pipeline. Partition its effective writes by
// verified game area, then apply each complete area's write set atomically.
export function buildCumulativeProject(base,project,{onRom}={}){
 if(typeof onRom!=='function')throw new TypeError('onRom callback required');
 const original=base.slice(),work=finalize(preparePlusTacticalInfrastructure(base));
 let target;
 try{target=buildPlusProjectRom(base,project,{
  forceTacticalInfrastructure:true,
 }).rom;}catch(e){throw new Error('Etapa cumulativa: '+e.message,{cause:e});}
 const classify=areaClassifier(target),writes=new Map(CUMULATIVE_AREAS.map(a=>[a.id,[]]));
 // Coalesce only adjacent bytes of the same area, preserving boundary splits.
 let current=null;
 for(let off=0;off<target.length;off++){
  if(target[off]===work[off]){current=null;continue;}
  const area=classify(off);if(!area){current=null;continue;}
  if(current?.area===area&&current.end===off)current.end++;
  else{current={area,start:off,end:off+1};writes.get(area).push(current);}
 }
 const entries=[],skipped=[];
 const emit=(id,label,ranges=[])=>{
  const index=entries.length+1,name=`${String(index).padStart(2,'0')}-${id}.sfc`;
  const snapshot=finalize(work.slice());
  if(snapshot.length!==0x400000||!validatePlusRuntimeMirrors(snapshot))throw new Error('Snapshot cumulativo inválido');
  const entry={index,name,stage:id,change:id,area:label,size:snapshot.length,
   status:ranges.length?'aplicada':id==='infraestrutura'?'obrigatoria':'sem-alteracao-binaria',
   changedBytes:ranges.reduce((n,r)=>n+r.end-r.start,0),ranges:ranges.map(r=>({start:r.start,end:r.end}))};
  onRom(snapshot,entry);entries.push(entry);return snapshot;
 };
 emit('infraestrutura','Expansão para 4 MiB e individualização obrigatória');
 let last;
 for(const area of CUMULATIVE_AREAS){
  const ranges=writes.get(area.id);
  if(!ranges.length&&!area.always){skipped.push(area.id);continue;}
  for(const r of ranges)work.set(target.subarray(r.start,r.end),r.start);
  last=emit(area.id,area.label,ranges);
 }
 if(!last||!equal(last,target))throw new Error('Última ROM cumulativa difere do build canônico preparado; ZIP cancelado');
 if(!equal(base,original))throw new Error('ROM-base foi alterada');
 return {schema:'isssd-cumulative-roms-v1',version:2,granularity:'game-area',entries,skippedNoOps:skipped,
  finalRom:entries.at(-1).name,baseUnchanged:true,finalMatchesCanonicalBuild:true,
  canonicalBuildOptions:{forceExpansionAndIndividualization:true},
  notes:['Tela inicial e menu principal mantêm suas posições no ZIP mesmo sem mudanças binárias.',
   'Áreas sem writer semântico só incluem alterações já materializadas por patches suportados pelo build.',
   'Offsets sem área confirmada ficam agrupados em outros-legados; não são atribuídos a uma tela por suposição.']};
}
