import test from 'node:test';
import assert from 'node:assert/strict';
import {bulkSkillEdits,rosterImportEdits} from '../deluxe-editor/roster-tools.mjs';
import {PLAYER_SKILLS} from '../src/core/deluxe-players.mjs';

test('bulk attributes affect only selected slots and preserve other edits',()=>{
 const original={'2:0':{name:'GK',skills:{speed:2,shot:3}},'2:1':{name:'A'},'3:0':{skills:{speed:4}}};
 const next=bulkSkillEdits(original,2,[0,1,1],'speed',9);
 assert.equal(next['2:0'].skills.speed,9);assert.equal(next['2:0'].skills.shot,3);assert.equal(next['2:1'].skills.speed,9);assert.deepEqual(next['3:0'],original['3:0']);assert.equal(original['2:0'].skills.speed,2);
 for(const value of [0,11,2.5,NaN])assert.throws(()=>bulkSkillEdits(original,2,[0],'speed',value));assert.throws(()=>bulkSkillEdits(original,2,[20],'speed',6));assert.throws(()=>bulkSkillEdits(original,2,[1],'unknown',6));
});

test('roster import targets the destination slots and rejects duplicate or malformed records',()=>{
 const p={slot:1,name:'Cafu',jersey:2,naturalPosition:2,skills:Object.fromEntries(Object.keys(PLAYER_SKILLS).map(k=>[k,5]))},edits={'0:1':{name:'A'},'5:1':{appearance:{hair:2,palette:0}},'5:2':{name:'B'}};
 const data={schema:'isssd-deluxe-roster-v1',team:'Brasil',players:[p]},next=rosterImportEdits(edits,5,data);
 assert.equal(next['5:1'].name,'Cafu');assert.equal(next['5:1'].appearance.hair,2);assert.deepEqual(next['0:1'],edits['0:1']);assert.deepEqual(next['5:2'],edits['5:2']);assert.equal(edits['5:1'].name,undefined);
 assert.throws(()=>rosterImportEdits(edits,5,{...data,players:[p,p]}),/repetido/);assert.throws(()=>rosterImportEdits(edits,5,{...data,players:[{...p,slot:20}]}));assert.throws(()=>rosterImportEdits(edits,5,{...data,players:[{slot:1,name:'X'}]}));
});
