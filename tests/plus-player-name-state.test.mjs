import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateLegacyPlayerNames} from '../src/core/plus-player-name-state.mjs';
import {canonicalProjectSemantic} from '../src/core/project-semantic.mjs';

test('legacy names-only roster becomes semantic player name edits',()=>{
  const legacy={
    schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{
      0:{teamId:0,players:[
        {slot:1,name:'Buffon',nameHex:'69968787908F0000'},
        {slot:18,name:'P.Rossi',nameHex:'7754799094948A00'},
      ]},
    },
  };
  const migrated=migrateLegacyPlayerNames(legacy);
  assert.equal(migrated.handled,true);
  assert.equal(migrated.quarantined.length,0);
  assert.deepEqual(migrated.edits,[
    {team:0,player:0,name:'Buffon',alignment:'left'},
    {team:0,player:17,name:'P.Rossi',alignment:'center'},
  ]);
  assert.deepEqual(legacy.teams[0].players[0],{slot:1,name:'Buffon',nameHex:'69968787908F0000'});
});

test('project semantic migration keeps name edit but quarantines colocated attrHex',()=>{
  const project={state:{semantic:{
    teamsV1:{schema:'isssd-teams-v1',version:2,names:{
      schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{
        30:{teamId:30,players:[{slot:9,name:'Pele',nameHex:'77868D8600000000',attrHex:'99597858670900'}]},
      },
    },tactics:{schema:'isssd-custom-tactics-v1',version:1,teams:{}}},
  }}};
  const semantic=canonicalProjectSemantic(project);
  assert.equal(semantic.teamsV1.names,undefined);
  assert.equal(semantic.teamsV1.tactics,undefined);
  assert.equal(semantic.playerEdits.length,1);
  assert.equal(semantic.playerEdits[0].team,30);
  assert.equal(semantic.playerEdits[0].player,8);
  assert.equal(semantic.playerEdits[0].name,'Pele');
  assert.equal(semantic.playerEdits[0].alignment,'left');
  assert.equal(semantic.playerEdits[0].jersey,undefined);
  assert.equal(semantic.playerEdits[0].skills,undefined);
  assert.equal(semantic.legacyPlayerAttributeQuarantine.length,1);
  assert.equal(semantic.legacyPlayerAttributeQuarantine[0].attrHex,'99597858670900');
});

test('unsupported legacy name bytes are quarantined rather than silently replaced',()=>{
  const legacy={schema:'isssd-name-roster-v1',version:1,mode:'names-only',teams:{
    0:{teamId:0,players:[{slot:1,name:'?',nameHex:'FF00000000000000'}]},
  }};
  const migrated=migrateLegacyPlayerNames(legacy);
  assert.equal(migrated.edits.length,0);
  assert.equal(migrated.quarantined.length,1);
  assert.match(migrated.quarantined[0].reason,/unsupported TallMenuText byte/);
});
