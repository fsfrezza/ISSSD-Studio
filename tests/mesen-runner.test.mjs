import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMesenSmokeArgs,
  interpretMesenSmokeResult,
  parseMesenProbeCandidates,
  parseMesenSemanticStates,
} from '../src/emulator/mesen-runner.mjs';

test('Mesen smoke args use headless testRunner and stdout logging',()=>{
  assert.deepEqual(
    buildMesenSmokeArgs({luaPath:'C:/repo/scripts/mesen/smoke.lua',romPath:'C:/roms/test.sfc'}),
    ['--enableStdout','--testRunner','C:/repo/scripts/mesen/smoke.lua','C:/roms/test.sfc']
  );
});

test('Mesen smoke result passes only on exit zero with pass marker',()=>{
  const result=interpretMesenSmokeResult({
    exitCode:0,
    stdout:'booting\nISSSD_SMOKE_PASS frames=600\n',
    stderr:'',
    timedOut:false,
  });
  assert.equal(result.ok,true);
  assert.equal(result.frames,600);
  assert.equal(result.mode,'smoke');
});

test('Mesen navigation result accepts navigation completion marker',()=>{
  const result=interpretMesenSmokeResult({
    exitCode:0,
    stdout:'ISSSD_NAV_STEP start frame=360\nISSSD_NAV_PASS frames=1200 steps=5\n',
    stderr:'',
    timedOut:false,
  });
  assert.equal(result.ok,true);
  assert.equal(result.frames,1200);
  assert.equal(result.mode,'nav');
  assert.equal(result.steps,5);
});

test('Mesen probe candidates are parsed into structured WRAM records',()=>{
  const out=[
    'ISSSD_PROBE_CAND addr=0x00123 value=4 mask=0x16 changes=3',
    'ISSSD_PROBE_CAND addr=0x1ABCD value=255 mask=0x02 changes=1',
  ].join('\n');
  assert.deepEqual(parseMesenProbeCandidates(out),[
    {address:0x00123,addressHex:'0x00123',value:4,mask:0x16,maskHex:'0x16',changes:3},
    {address:0x1ABCD,addressHex:'0x1ABCD',value:255,mask:0x02,maskHex:'0x02',changes:1},
  ]);
});

test('Mesen probe result reports stable changing WRAM candidates',()=>{
  const result=interpretMesenSmokeResult({
    exitCode:0,
    stdout:'ISSSD_PROBE_CAND addr=0x00123 value=4 mask=0x16 changes=3\nISSSD_PROBE_PASS frames=1200 candidates=27\n',
    stderr:'',
    timedOut:false,
  });
  assert.equal(result.ok,true);
  assert.equal(result.frames,1200);
  assert.equal(result.mode,'probe');
  assert.equal(result.candidates,27);
  assert.equal(result.probeCandidates.length,1);
  assert.equal(result.probeCandidates[0].address,0x123);
});

test('Mesen semantic result reports reached checkpoints',()=>{
  const stdout=[
    'ISSSD_SEMANTIC_STATE intro frame=240 value=2',
    'ISSSD_SEMANTIC_STATE menu frame=420 value=5',
    'ISSSD_SEMANTIC_PASS frames=1200 checkpoints=2',
  ].join('\n');
  assert.deepEqual(parseMesenSemanticStates(stdout),[
    {name:'intro',frame:240,value:2},
    {name:'menu',frame:420,value:5},
  ]);
  const result=interpretMesenSmokeResult({exitCode:0,stdout,stderr:'',timedOut:false});
  assert.equal(result.ok,true);
  assert.equal(result.mode,'semantic');
  assert.equal(result.checkpoints,2);
  assert.equal(result.semanticStates.length,2);
});

test('Mesen semantic failure preserves missing checkpoint name',()=>{
  const result=interpretMesenSmokeResult({
    exitCode:1,
    stdout:'ISSSD_SEMANTIC_STATE intro frame=240 value=2\nISSSD_SEMANTIC_FAIL checkpoint=menu frame=501\n',
    stderr:'',
    timedOut:false,
  });
  assert.equal(result.ok,false);
  assert.equal(result.mode,'semantic');
  assert.match(result.reason,/menu/);
  assert.equal(result.semanticStates.length,1);
});

test('Mesen smoke result rejects timeout',()=>{
  const result=interpretMesenSmokeResult({exitCode:null,stdout:'',stderr:'',timedOut:true});
  assert.equal(result.ok,false);
  assert.match(result.reason,/timeout/i);
});

test('Mesen smoke result rejects zero exit without completion marker',()=>{
  const result=interpretMesenSmokeResult({exitCode:0,stdout:'partial boot',stderr:'',timedOut:false});
  assert.equal(result.ok,false);
  assert.match(result.reason,/marker/i);
});

test('Mesen smoke result preserves emulator failure diagnostics',()=>{
  const result=interpretMesenSmokeResult({exitCode:3,stdout:'',stderr:'lua failed',timedOut:false});
  assert.equal(result.ok,false);
  assert.equal(result.exitCode,3);
  assert.match(result.reason,/exit code 3/i);
  assert.equal(result.stderr,'lua failed');
});
