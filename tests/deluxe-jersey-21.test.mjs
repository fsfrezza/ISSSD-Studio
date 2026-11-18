import test from 'node:test';
import assert from 'node:assert/strict';
import {applyDeluxePlayers,planDeluxeJerseySwap} from '../src/core/deluxe-players.mjs';

function baseDeluxe(){
 const base=new Uint8Array(0x200000);
 for(let team=0;team<36;team++){
  const p=0x818e+team*160;
  base[0x38138+team*2]=p&255;
  base[0x38139+team*2]=p>>8;
  for(let player=0;player<20;player++)base[0x50000+(team*20+player)*7+5]=player;
 }
 return base;
}

test('Deluxe serializes shirt 21 without renumbering the player',()=>{
 const base=baseDeluxe(),out=base.slice(),edits={'0:5':{jersey:21}};
 applyDeluxePlayers(out,base,edits);
 assert.equal(out[0x50000+5*7+5],20);
 assert.equal(base[0x50000+5*7+5],5);
 assert.deepEqual(edits,{'0:5':{jersey:21}});
});

test('Deluxe permits 21–99 but rejects duplicate and out-of-range shirts',()=>{
 const base=baseDeluxe();
 assert.equal(planDeluxeJerseySwap(base,{},0,5,21)['0:5'].jersey,21);
 assert.throws(()=>planDeluxeJerseySwap(base,{},0,5,100),/1 a 99/);
 assert.throws(()=>applyDeluxePlayers(base.slice(),base,{'0:5':{jersey:100}}),/1 a 99/);
 assert.throws(()=>applyDeluxePlayers(base.slice(),base,{'0:5':{jersey:1}}),/sem repetição/);
});
