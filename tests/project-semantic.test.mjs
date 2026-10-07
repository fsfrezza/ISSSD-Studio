import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalProjectSemantic} from '../src/core/project-semantic.mjs';

test('canonical project semantic clones and migrates legacy tactical state',()=>{
  const source={
    marker:{nested:true},
    teamsV1:{
      schema:'isssd-teams-v1',version:2,
      names:{teams:{}},
      tactics:{schema:'isssd-custom-tactics-v1',version:2,teams:{
        '30':{teamId:30,formationIndex:4,rawHex:'AA'.repeat(31),players:[
          {index:0,rosterSlot:1,x:-20,y:3,attack:false},
          {index:1,rosterSlot:2,x:12,y:-7,attack:true},
        ]}
      }}
    }
  };
  const before=structuredClone(source);
  const out=canonicalProjectSemantic({state:{semantic:source}});

  assert.deepEqual(source,before);
  assert.deepEqual(out.marker,{nested:true});
  assert.equal(out.teamsV1.tactics,undefined);
  assert.equal(out.plusTactics.schema,'isssd-plus-tactics-v1');
  assert.equal(out.plusTactics.teams['30'].formationIndex,4);
  assert.equal(out.plusTactics.teams['30'].players[1].attack,true);
  assert.equal('rawHex' in out.plusTactics.teams['30'],false);
});

test('canonical project semantic quarantines legacy attrHex while preserving valid name migration',()=>{
  const project={state:{semantic:{teamsV1:{schema:'isssd-teams-v1',version:2,names:{
    schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{
      '30':{teamId:30,players:[{slot:8,name:'PELE',nameHex:'77868D8600000000',attrHex:'012345673909AB'}]}
    }
  }}}}};
  const out=canonicalProjectSemantic(project);
  assert.equal(out.teamsV1.names,undefined);
  assert.equal(out.playerEdits.length,1);
  assert.equal(out.playerEdits[0].team,30);
  assert.equal(out.playerEdits[0].player,7);
  assert.equal(out.playerEdits[0].name,'Pele');
  assert.equal(out.playerEdits[0].skills,undefined);
  assert.equal(out.playerEdits[0].jersey,undefined);
  assert.equal(out.legacyPlayerAttributeQuarantine.length,1);
  assert.equal(out.legacyPlayerAttributeQuarantine[0].attrHex,'012345673909AB');
});

test('explicit player edits remain authoritative while legacy attrHex is quarantined',()=>{
  const project={state:{semantic:{
    playerEdits:[{team:30,player:7,skills:{shot:10}}],
    teamsV1:{names:{
      schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{
        '30':{teamId:30,players:[{slot:8,name:'PELE',nameHex:'77868D8600000000',attrHex:'012345673909AB'}]}
      }
    }}
  }}};
  const out=canonicalProjectSemantic(project);
  assert.equal(out.playerEdits.length,1);
  assert.equal(out.playerEdits[0].skills.shot,10);
  assert.equal(out.playerEdits[0].name,'Pele');
  assert.equal(out.playerEdits[0].skills.speed,undefined);
  assert.equal(out.legacyPlayerAttributeQuarantine.length,1);
});

test('corrupted legacy player snapshot is quarantined without becoming an attribute edit',()=>{
  const project={state:{semantic:{teamsV1:{names:{teams:{'30':{teamId:30,players:[{slot:8,attrHex:'FFFFFFFFFFFFFF'}]}}}}}}};
  const out=canonicalProjectSemantic(project);
  assert.deepEqual(out.playerEdits,[]);
  assert.equal(out.legacyPlayerAttributeQuarantine.length,1);
  assert.equal(out.legacyPlayerAttributeQuarantine[0].team,30);
  assert.equal(out.legacyPlayerAttributeQuarantine[0].attrHex,'FFFFFFFFFFFFFF');
});

test('canonical project semantic accepts root semantic fallback',()=>{
  const out=canonicalProjectSemantic({semantic:{marker:7}});
  assert.equal(out.marker,7);
});

test('canonical project semantic rejects non-object semantic state',()=>{
  assert.throws(()=>canonicalProjectSemantic({state:{semantic:[]}}),/semantic state must be an object/i);
});

test('canonical project semantic result is detached from project',()=>{
  const project={state:{semantic:{marker:{value:1}}}};
  const out=canonicalProjectSemantic(project);
  out.marker.value=9;
  assert.equal(project.state.semantic.marker.value,1);
});
