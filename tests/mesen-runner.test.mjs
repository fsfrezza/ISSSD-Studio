import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMesenSmokeArgs,
  interpretMesenSmokeResult,
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
