import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

test('project build starts from immutable base and applies canonical persisted patches before writers',()=>{
  const base=new Uint8Array(0x200000);
  base[0x100]=0x10;
  const project={
    state:{
      targetLength:0x200000,
      patchesCompact:[
        {off:0x100,data:'22'},
        {offset:0x100,data:[0x22]},
      ],
      semantic:{marker:0x44},
    }
  };
  const before=base.slice();
  const {rom,diff}=buildPlusProjectRom(base,project,{
    writers:[(work,state)=>{
      assert.equal(work[0x100],0x22);
      assert.equal(state.marker,0x44);
      work[0x101]=state.marker;
    }],
    writeChecksum:false,
  });
  assert.equal(rom[0x100],0x22);
  assert.equal(rom[0x101],0x44);
  assert.deepEqual(base,before);
  assert.equal(diff.changedBytes,2);
});

test('project build normalizes legacy tactical rawHex before writers see semantic state',()=>{
  const base=new Uint8Array(0x200000);
  const project={state:{targetLength:0x200000,patchesCompact:[],semantic:{teamsV1:{schema:'isssd-teams-v1',version:2,tactics:{schema:'isssd-custom-tactics-v1',version:2,teams:{'30':{teamId:30,formationIndex:3,formationLabel:'4-4-2',rawHex:'AA'.repeat(31),players:[{index:0,rosterSlot:1,x:-20,y:5,attack:false},{index:1,rosterSlot:9,x:18,y:-4,attack:true}]}}}}}}};
  const snapshot=structuredClone(project);
  buildPlusProjectRom(base,project,{
    writers:[(_work,state)=>{
      assert.equal(state.teamsV1.tactics,undefined);
      assert.equal(state.plusTactics.schema,'isssd-plus-tactics-v1');
      assert.equal(state.plusTactics.teams['30'].formationIndex,3);
      assert.equal(state.plusTactics.teams['30'].players[1].rosterSlot,9);
      assert.equal(state.plusTactics.teams['30'].players[1].attack,true);
      assert.equal('rawHex' in state.plusTactics.teams['30'],false);
    }],
    writeChecksum:false,
  });
  assert.deepEqual(project,snapshot);
});

test('project build rejects persisted expanded targetLength before infrastructure runs',()=>{
  const base=new Uint8Array(0x200000);
  let prepared=false;
  assert.throws(()=>buildPlusProjectRom(base,{
    state:{targetLength:0x400000,patchesCompact:[]}
  },{
    prepareInfrastructure:()=>{prepared=true;}
  }),/targetLength.*immutable base/i);
  assert.equal(prepared,false);
});

test('project build rejects persisted patch crossing immutable base boundary',()=>{
  const base=new Uint8Array(0x200000);
  assert.throws(()=>buildPlusProjectRom(base,{
    state:{
      targetLength:0x200000,
      patchesCompact:[{off:0x1FFFFF,data:[1,2]}]
    }
  }),/immutable base boundary/i);
});

test('generated infrastructure may expand output without changing persisted project state',()=>{
  const base=new Uint8Array(0x200000);
  const project={state:{targetLength:0x200000,patchesCompact:[],semantic:{marker:7}}};
  const snapshot=structuredClone(project);
  const {rom}=buildPlusProjectRom(base,project,{
    prepareInfrastructure:work=>{
      const expanded=new Uint8Array(0x400000);
      expanded.set(work);
      expanded[0x200000]=0xA5;
      return expanded;
    },
    writeChecksum:false,
  });
  assert.equal(rom.length,0x400000);
  assert.equal(rom[0x200000],0xA5);
  assert.deepEqual(project,snapshot);
});

test('same base and logical project build deterministically regardless of duplicate patch representation',()=>{
  const base=new Uint8Array(0x200000);
  const a={state:{targetLength:0x200000,patchesCompact:[{off:3,data:'AABB'}],semantic:{}}};
  const b={state:{targetLength:0x200000,patchesCompact:[{offset:3,data:[0xAA,0xBB]},{off:3,data:'AABB'}],semantic:{}}};
  const outA=buildPlusProjectRom(base,a,{writeChecksum:false}).rom;
  const outB=buildPlusProjectRom(base,b,{writeChecksum:false}).rom;
  assert.deepEqual(outA,outB);
});
