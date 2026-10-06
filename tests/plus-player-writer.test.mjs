import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusRom} from '../src/core/build-plus.mjs';
import {plusPlayerWriter,readPlusPlayer} from '../src/core/plus-player-writer.mjs';
import {playerOffset,knownMirrorOffset} from '../src/core/plus-player.mjs';

test('semantic player skill edit changes only main and known Brazil mirror byte',()=>{
  const base=new Uint8Array(0x200000);
  const off=playerOffset(30,7);
  base.set([0x12,0x34,0x56,0x78,0x31,0x07,0xAB],off);
  base.set([0x12,0x34,0x56,0x78,0x31,0x07,0xAB],knownMirrorOffset(30,7));

  const {rom,diff}=buildPlusRom(base,{
    semanticState:{playerEdits:[{team:30,player:7,skills:{shot:10}}]},
    writers:[plusPlayerWriter],
    writeChecksum:false,
  });

  assert.equal(rom[off+1],0x94);
  assert.equal(rom[knownMirrorOffset(30,7)+1],0x94);
  assert.equal(rom[off+6],0xAB);
  assert.equal(diff.changedBytes,2);
});

test('Argentina semantic edit writes main bank only',()=>{
  const base=new Uint8Array(0x200000);
  const off=playerOffset(31,7);
  base.set([0x12,0x34,0x56,0x78,0x31,0x07,0xCD],off);

  const {rom,diff}=buildPlusRom(base,{
    semanticState:{playerEdits:[{team:31,player:7,skills:{shot:10}}]},
    writers:[plusPlayerWriter],
    writeChecksum:false,
  });
  assert.equal(rom[off+1],0x94);
  assert.equal(rom[off+6],0xCD);
  assert.equal(diff.changedBytes,1);
});

test('combined skill jersey and position edit preserves raw appearance',()=>{
  const base=new Uint8Array(0x200000);
  const off=playerOffset(0,0);
  base.set([0x12,0x34,0x56,0x78,0x31,0x07,0xEF],off);

  const {rom}=buildPlusRom(base,{
    semanticState:{playerEdits:[{
      team:0,player:0,skills:{speed:10,curve:8,energy:6},jersey:20,naturalPosition:6
    }]},
    writers:[plusPlayerWriter],
    writeChecksum:false,
  });
  const p=readPlusPlayer(rom,0,0);
  assert.equal(p.speed,9);
  assert.equal(p.curve,7);
  assert.equal(p.energy,5);
  assert.equal(p.jersey,20);
  assert.equal(p.naturalPosition,6);
  assert.equal(p.appearanceRaw,0xEF);
});

test('appearance cannot be modified through semantic player state yet',()=>{
  const base=new Uint8Array(0x200000);
  const off=playerOffset(0,0);
  base.set([1,2,3,4,5,6,0xAA],off);
  const {rom}=buildPlusRom(base,{
    semanticState:{playerEdits:[{team:0,player:0,appearanceRaw:0x11}]},
    writers:[plusPlayerWriter],
    writeChecksum:false,
  });
  assert.equal(rom[off+6],0xAA);
});

test('same semantic player state builds deterministically',()=>{
  const base=new Uint8Array(0x200000);
  const state={playerEdits:[
    {team:30,player:2,skills:{acceleration:10},jersey:9},
    {team:31,player:4,naturalPosition:5,skills:{dribbling:8}}
  ]};
  const a=buildPlusRom(base,{semanticState:state,writers:[plusPlayerWriter]}).rom;
  const b=buildPlusRom(base,{semanticState:structuredClone(state),writers:[plusPlayerWriter]}).rom;
  assert.deepEqual(a,b);
});
