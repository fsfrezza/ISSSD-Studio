import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSemanticProfile,renderSemanticLua} from '../src/emulator/mesen-semantic-profile.mjs';

const profile={
  schema:'isssd-mesen-semantic-v1',
  maxFrames:1200,
  pulses:[
    {name:'start',start:360,stop:366,input:{start:true}},
    {name:'confirm',start:520,stop:526,input:{a:true}},
  ],
  checkpoints:[
    {name:'intro',address:0x123,expected:2,start:200,stop:350},
    {name:'menu',address:0x123,expected:5,start:380,stop:500},
    {name:'selection',address:0x456,expected:7,start:540,stop:900},
  ],
};

test('semantic profile normalizes and detaches pulses and checkpoints',()=>{
  const out=normalizeSemanticProfile(profile);
  assert.equal(out.maxFrames,1200);
  assert.deepEqual(out.pulses[0],{name:'start',start:360,stop:366,input:{start:true}});
  assert.deepEqual(out.checkpoints[0],{name:'intro',address:0x123,expected:2,start:200,stop:350});
  out.checkpoints[0].expected=9;
  assert.equal(profile.checkpoints[0].expected,2);
});

test('semantic profile rejects invalid frame windows and WRAM values',()=>{
  assert.throws(()=>normalizeSemanticProfile({...profile,checkpoints:[{name:'bad',address:0x20000,expected:1,start:10,stop:20}]}),/address/i);
  assert.throws(()=>normalizeSemanticProfile({...profile,checkpoints:[{name:'bad',address:1,expected:256,start:10,stop:20}]}),/expected/i);
  assert.throws(()=>normalizeSemanticProfile({...profile,checkpoints:[{name:'bad',address:1,expected:1,start:20,stop:10}]}),/stop/i);
});

test('semantic Lua uses inputPolled, Work RAM reads and pass/fail markers',()=>{
  const lua=renderSemanticLua(profile);
  assert.match(lua,/emu\.eventType\.inputPolled/);
  assert.match(lua,/emu\.memType\.snesWorkRam/);
  assert.match(lua,/ISSSD_SEMANTIC_STATE/);
  assert.match(lua,/name="intro"/);
  assert.match(lua,/ISSSD_SEMANTIC_FAIL/);
  assert.match(lua,/ISSSD_SEMANTIC_PASS/);
});
