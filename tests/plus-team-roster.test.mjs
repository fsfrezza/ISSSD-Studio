import test from 'node:test';
import assert from 'node:assert/strict';
import {playerOffset} from '../src/core/plus-player.mjs';
import {
  readPlusTeamJerseys,
  validatePlusTeamJerseyPermutation,
  planPlusJerseySwap,
  planPlusTeamJerseyAssignment,
  swapPlusStarterTacticalAssignments,
} from '../src/core/plus-team-roster.mjs';

function romWithJerseys(team=0){
  const rom=new Uint8Array(0x200000);
  for(let player=0;player<20;player++)rom[playerOffset(team,player)+5]=player;
  return rom;
}

test('Plus team jersey reader returns the 1..20 physical roster permutation',()=>{
  const rom=romWithJerseys();
  assert.deepEqual(readPlusTeamJerseys(rom,0),Array.from({length:20},(_,i)=>i+1));
});

test('jersey permutation validator requires each number 1..20 exactly once',()=>{
  assert.equal(validatePlusTeamJerseyPermutation(Array.from({length:20},(_,i)=>i+1)),true);
  const duplicate=Array.from({length:20},(_,i)=>i+1);duplicate[19]=19;
  assert.equal(validatePlusTeamJerseyPermutation(duplicate),false);
  assert.equal(validatePlusTeamJerseyPermutation([1,2,3]),false);
});

test('single-player jersey change swaps with the existing owner of the requested number',()=>{
  const rom=romWithJerseys(5);
  assert.deepEqual(planPlusJerseySwap(rom,{team:5,player:2,jersey:10}),[
    {team:5,player:2,jersey:10},
    {team:5,player:9,jersey:3},
  ]);
});

test('single-player jersey no-op emits no edits',()=>{
  const rom=romWithJerseys();
  assert.deepEqual(planPlusJerseySwap(rom,{team:0,player:4,jersey:5}),[]);
});

test('whole-team jersey assignment is direct only after validating a 1..20 permutation',()=>{
  const shirts=Array.from({length:20},(_,i)=>20-i);
  const edits=planPlusTeamJerseyAssignment(3,shirts);
  assert.equal(edits.length,20);
  assert.deepEqual(edits[0],{team:3,player:0,jersey:20});
  assert.deepEqual(edits[19],{team:3,player:19,jersey:1});
  const invalid=shirts.slice();invalid[19]=2;
  assert.throws(()=>planPlusTeamJerseyAssignment(3,invalid),/unique permutation/);
});

test('starter tactical swap moves only PosX PosY class and attack assignment',()=>{
  const original={teamId:0,formationIndex:2,players:[
    {index:0,rosterSlot:2,name:'A',number:7,x:-30,y:-10,className:'DF',attack:true},
    {index:1,rosterSlot:3,name:'B',number:10,x:5,y:12,className:'MC',attack:false},
  ]};
  const swapped=swapPlusStarterTacticalAssignments(original,2,3);
  assert.deepEqual(swapped.players[0],{index:0,rosterSlot:2,name:'A',number:7,x:5,y:12,className:'MC',attack:false});
  assert.deepEqual(swapped.players[1],{index:1,rosterSlot:3,name:'B',number:10,x:-30,y:-10,className:'DF',attack:true});
  assert.deepEqual(original.players[0],{index:0,rosterSlot:2,name:'A',number:7,x:-30,y:-10,className:'DF',attack:true});
});

test('starter tactical swap refuses goalkeeper and reserve slots',()=>{
  const state={players:[]};
  assert.throws(()=>swapPlusStarterTacticalAssignments(state,1,2),/slot A must be 2..11/);
  assert.throws(()=>swapPlusStarterTacticalAssignments(state,2,12),/slot B must be 2..11/);
});
