import test from 'node:test';
import assert from 'node:assert/strict';
import {readPlusGroupIdentity,plusGroupIdentityWriter,PLUS_GROUP_ORDER,PLUS_GROUP_TITLES} from '../src/core/plus-group-identity.mjs';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {withoutLegacyTeamSnapshots} from '../src/core/semantic-team-patches.mjs';
function fixture(){
 const base=makePlusTacticalFixture();
 for(let physical=0;physical<9;physical++)for(let i=0;i<6;i++)base[0xE7F2+physical*6+i]=(physical*6+i)*2;
 base.set([108,110,112,112,112,112,112,1],0xE828);
 PLUS_GROUP_TITLES.forEach((v,i)=>base.set([v&255,v>>>8],0x3FAC8+i*2));
 const plusGroups=readPlusGroupIdentity(base);
 [plusGroups.groups[0][0],plusGroups.groups[8][5]]=[plusGroups.groups[8][5],plusGroups.groups[0][0]];
 [plusGroups.groups[0],plusGroups.groups[1]]=[plusGroups.groups[1],plusGroups.groups[0]];
 [plusGroups.titlePointers[0],plusGroups.titlePointers[1]]=[plusGroups.titlePointers[1],plusGroups.titlePointers[0]];
 plusGroups.secret.reverse();plusGroups.secret=[54,55,-1,-1,-1,-1];
 return {base,state:{plusGroups}};
}
test('group identity writes logical order and corresponding native graphical titles, preserving adjacent descriptors',()=>{
 const {base,state}=fixture(),before=base.slice(),out=base.slice();
 plusGroupIdentityWriter(out,state,base);
 assert.deepEqual(readPlusGroupIdentity(out),state.plusGroups);
 assert.deepEqual(base,before);
 assert.deepEqual(out.slice(0xE82E,0xE832),before.slice(0xE82E,0xE832));
 assert.equal(out[0xE7F2+PLUS_GROUP_ORDER[0]*6],state.plusGroups.groups[0][0]*2);
 assert.equal(out[0xE828],108);
});
test('invalid or structural group edits fail atomically instead of silently dropping identities',()=>{
 for(const mutate of [s=>s.plusGroups.groups[0][0]=-1,s=>s.plusGroups.groups[0][0]=s.plusGroups.groups[0][1],s=>s.plusGroups.groups[0][0]=56,s=>s.plusGroups.titlePointers[0]=0,s=>s.plusGroups.groups.pop()]){
  const {base,state}=fixture(),out=base.slice();mutate(state);
  assert.throws(()=>plusGroupIdentityWriter(out,state,base),/Grupos:/);
  assert.deepEqual(out,base);
 }
});
test('selection checkbox controls group identity and stale binary group mirrors cannot override project values',()=>{
 const {base,state}=fixture();
 const patches=[{off:0xE7F1,data:Uint8Array.from([9,...Array(64).fill(255)])},{off:0x3FAC8,data:new Uint8Array(20).fill(255)}];
 const kept=withoutLegacyTeamSnapshots(base,state,patches);
 assert.deepEqual(kept.map(p=>[p.off,p.data.length]),[[0xE7F1,1],[0xE830,2]]);
 const project={state:{semantic:state,patchesCompact:[]}};
 const yes=buildCumulativeProject(base,project,{selectedAreas:['infraestrutura','selecao-equipes'],onRom(){}});
 const no=buildCumulativeProject(base,project,{selectedAreas:['infraestrutura'],onRom(){}});
 // The selected snapshot is checked independently of the manifest classification.
 let selected;buildCumulativeProject(base,project,{selectedAreas:['selecao-equipes'],onRom:r=>selected=r});
 assert.deepEqual(readPlusGroupIdentity(selected),state.plusGroups);
 assert.equal(yes.unassignedLegacyRanges.length,0);
 assert.equal(no.entries.length,1);
 const untouched=base.slice();plusGroupIdentityWriter(untouched,state,base,['jogadores']);assert.deepEqual(untouched,base);
});
