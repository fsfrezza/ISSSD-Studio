import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePlusTacticalRecord,encodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';
import {deluxeTacticalRecord,encodeDeluxeSavedTactics} from '../src/core/deluxe-tactics.mjs';

test('saved Deluxe tactics preserve native MC positions and AT attack bits',()=>{
 const raw=new Uint8Array(31);
 raw[0]=1;
 raw[21+4]=2;
 raw[21+8]=3;
 const players=[
  {index:4,x:-21,y:0,className:'MC',attack:false},
  {index:8,x:29,y:-12,className:'AT',attack:true}
 ];
 const tactics={schema:'isssd-deluxe-tactics-v1',version:1,sourceRecords:{0:Array.from(raw)},teams:{0:{formationIndex:1,players}}};
 const project={changes:{tactics}};
 const result=deluxeTacticalRecord(new Uint8Array(0x200000),project,0);
 const decoded=decodePlusTacticalRecord(result);
 assert.equal(decoded.players[4].x,-21);
 assert.equal(decoded.players[8].x,29);
 assert.equal(decoded.players[8].attack,true);
 assert.deepEqual(tactics.teams[0].players,players);
 assert.deepEqual(Array.from(raw),tactics.sourceRecords[0]);
 assert.throws(()=>encodePlusTacticalRecord(raw,{players:[players[0]]}),/MC tactical X/);
 assert.throws(()=>encodePlusTacticalRecord(raw,{players:[players[1]]}),/AT tactical player/);
});

test('extended native coordinates remain bounded and other classes remain strict',()=>{
 const raw=new Uint8Array(31);
 raw[21+0]=2;
 assert.throws(()=>encodeDeluxeSavedTactics(raw,{players:[{index:0,x:-41,y:0,className:'MC',attack:false}]}),/MC tactical X/);
 assert.throws(()=>encodeDeluxeSavedTactics(raw,{players:[{index:0,x:25,y:0,className:'DF',attack:false}]}),/DF tactical X/);
 assert.throws(()=>encodeDeluxeSavedTactics(raw,{players:[{index:0,x:-21,y:40,className:'MC',attack:false}]}),/tactical Y/);
});
