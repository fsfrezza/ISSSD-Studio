import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePlusTacticalRecord,encodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';

test('decodes proven 31-byte Plus tactical layout',()=>{
  const raw=new Uint8Array(31);
  raw[0]=1;
  raw[1]=0xF6; // -10 native DF dx => global -49
  raw[2]=5;
  raw[21]=0xA5; // high bits preserved, DF + attack
  raw[3]=18; // MC native dx => global 18
  raw[4]=0xF9; // -7 y
  raw[22]=0x02; // MC

  const state=decodePlusTacticalRecord(raw);
  assert.equal(state.formationIndex,1);
  assert.deepEqual(state.players[0],{
    index:0,nativeDx:-10,nativeDy:5,x:-49,y:5,className:'DF',attack:true,flag:0xA5,
  });
  assert.equal(state.players[1].x,18);
  assert.equal(state.players[1].y,-7);
  assert.equal(state.players[1].className,'MC');
  assert.equal(state.players[1].attack,false);
});

test('encodes semantic tactic while preserving unknown flag bits',()=>{
  const base=new Uint8Array(31);
  base[21]=0xA0;
  base[22]=0xD8;
  const out=encodePlusTacticalRecord(base,{
    formationIndex:3,
    players:[
      {index:0,x:-57,y:-39,className:'DF',attack:true},
      {index:1,x:18,y:39,className:'MC',attack:false},
    ]
  });

  assert.notEqual(out,base);
  assert.equal(base[0],0);
  assert.equal(out[0],3);
  assert.equal(out[1],0xEE); // -18 native dx from DF base -39
  assert.equal(out[2],0xD9); // -39 signed
  assert.equal(out[21],0xA5); // 0xA0 unknown bits + DF + attack
  assert.equal(out[3],18);
  assert.equal(out[4],39);
  assert.equal(out[22],0xDA); // 0xD8 high bits + MC
});

test('codec round-trips semantic coordinates at zone edges',()=>{
  const base=new Uint8Array(31);
  const semantic={formationIndex:0,players:[
    {index:0,x:-18,y:0,className:'DF',attack:false},
    {index:1,x:18,y:1,className:'MC',attack:true},
    {index:2,x:57,y:-1,className:'AT',attack:false},
  ]};
  const decoded=decodePlusTacticalRecord(encodePlusTacticalRecord(base,semantic));
  for(let i=0;i<3;i++){
    assert.equal(decoded.players[i].x,semantic.players[i].x);
    assert.equal(decoded.players[i].y,semantic.players[i].y);
    assert.equal(decoded.players[i].className,semantic.players[i].className);
    assert.equal(decoded.players[i].attack,semantic.players[i].attack);
  }
});

test('encoder rejects class and global X mismatch instead of silently clamping',()=>{
  const base=new Uint8Array(31);
  assert.throws(()=>encodePlusTacticalRecord(base,{players:[{index:0,x:10,y:0,className:'DF'}]}),/DF.*X|X.*DF/i);
  assert.throws(()=>encodePlusTacticalRecord(base,{players:[{index:0,x:30,y:0,className:'MC'}]}),/MC.*X|X.*MC/i);
  assert.throws(()=>encodePlusTacticalRecord(base,{players:[{index:0,x:0,y:0,className:'AT'}]}),/AT.*X|X.*AT/i);
});

test('codec validates record size and formation range',()=>{
  assert.throws(()=>decodePlusTacticalRecord(new Uint8Array(30)),/31-byte/i);
  assert.throws(()=>encodePlusTacticalRecord(new Uint8Array(31),{formationIndex:16}),/formation/i);
});
