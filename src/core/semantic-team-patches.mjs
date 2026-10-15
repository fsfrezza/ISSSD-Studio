import {teamsV3Entries} from './teams-v3-writer.mjs';
import {playerOffset,knownMirrorSlices} from './plus-player.mjs';
import {resolvePlusPlayerNameOffset} from './plus-player-name.mjs';
import {resolvePlusTacticalRecord} from './plus-tactics-address.mjs';

// teamsV1 v3 owns these bytes semantically. Historical binary snapshots must
// not override absent fields (which mean preserve the immutable baseline).
export function withoutLegacyTeamSnapshots(base,state,patches){
 const ranges=[];
 for(const {team} of teamsV3Entries(state)){
  ranges.push([playerOffset(team,0),playerOffset(team,19)+7]);
  try{const off=resolvePlusPlayerNameOffset(base,team,0);ranges.push([off,off+160]);}catch{/* writer validates edited names */}
  const record=resolvePlusTacticalRecord(base,team);if(record)ranges.push([record.recordPc,record.recordPc+31]);
  for(let p=0;p<20;p++)for(const s of knownMirrorSlices(team,p))ranges.push([s.mirror,s.mirror+s.length]);
 }
 if(!ranges.length)return patches;
 ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
 for(const r of ranges){const last=merged.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push([...r]);}
 const out=[];
 for(const p of patches){let at=p.off;const end=p.off+p.data.length;
  for(const [a,b] of merged){if(b<=at)continue;if(a>=end)break;
   if(a>at)out.push({off:at,data:p.data.slice(at-p.off,a-p.off)});
   at=Math.max(at,b);if(at>=end)break;
  }
  if(at<end)out.push({off:at,data:p.data.slice(at-p.off)});
 }
 return out;
}
