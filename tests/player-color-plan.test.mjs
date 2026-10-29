import test from'node:test';import assert from'node:assert/strict';import{preparePlayerColorState}from'../src/core/player-color-plan.mjs';import{playerOffset}from'../src/core/plus-player.mjs';
function fixture(){const base=new Uint8Array(0x200000),w=(p,v)=>{base[p]=v&255;base[p+1]=v>>8;},long=(p,v)=>{w(p,v);base[p+2]=v>>16;};
 for(const[site,table]of [[0x5CFD0,0x10274],[0x5CFEA,0x1043C],[0x5CFFB,0x103CA]]){base[site]=0xBF;long(site+1,0x820000|(table&65535));}
 for(const[ptr,n]of [[0x9000,16],[0x8342,5],[0x834E,5],[0x835A,5],[0x8366,5]]){w(0x40000+ptr,n*2-1);for(let i=0;i<n;i++)w(0x40000+ptr+2+i*2,i+1);}
 w(0x10274+30*2,0x9000);for(let p=0;p<20;p++)base[playerOffset(30,p)+4]=0x20;
 return{base,state:{independentTeamsV1:{teams:{}},teamsV1:{schema:'isssd-teams-v1',version:3,teams:{30:{teamId:30,players:[{slot:6,baseSlot:8,playerId:'30:8'},{slot:8,baseSlot:6,playerId:'30:6'}]}}},playerColorsV1:{schema:'isssd-player-colors-v1',version:1,players:{'30:8':{skin:[11,12,13,14,15],hairColor:15}}}}};
}
test('color planning follows identity through slot swaps and leaves original state and ROM immutable',()=>{
 const{base,state}=fixture(),before=base.slice(),saved=structuredClone(state),out=preparePlayerColorState(base,JSON.parse(JSON.stringify(state))),plan=out.__playerColorPlans[30];
 assert.deepEqual(plan.combinations[plan.assignments[6]],state.playerColorsV1.players['30:8']);assert.notEqual(plan.assignments[6],plan.assignments[8]);assert.deepEqual(state,saved);assert.deepEqual(base,before);
});
test('unsupported combinations and unavailable expanded structure stop planning explicitly',()=>{
 const{base,state}=fixture();state.playerColorsV1.players['30:9']={skin:[21,22,23,24,25],hairColor:25};assert.throws(()=>preparePlayerColorState(base,state),/3 combinações/);
 delete state.independentTeamsV1;assert.throws(()=>preparePlayerColorState(base,state),/estrutura atual/);
 const empty={};assert.equal(preparePlayerColorState(base,empty),empty);
});
