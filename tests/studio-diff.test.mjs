import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeStudioDiff} from '../src/core/studio-diff.mjs';

test('Studio diff reports prefix suffix changed range and touched functions',()=>{
  const a=Buffer.from('<script>function alpha(){return 1;} function beta(){return 2;}</script>');
  const b=Buffer.from('<script>function alpha(){return 1;} function beta(){return 3;}</script>');
  const r=analyzeStudioDiff(a,b);
  assert.equal(r.identical,false);
  assert.equal(r.changedBytesA>0,true);
  assert.equal(r.changedBytesB>0,true);
  assert.equal(r.touchedFunctions.includes('beta'),true);
  assert.equal(r.touchedFunctions.includes('alpha'),false);
});

test('identical snapshots produce no changed range',()=>{
  const a=Buffer.from('<html><script>function x(){return 1}</script></html>');
  const r=analyzeStudioDiff(a,a);
  assert.equal(r.identical,true);
  assert.equal(r.firstDifference,null);
  assert.equal(r.lastDifferenceA,null);
  assert.equal(r.lastDifferenceB,null);
  assert.deepEqual(r.touchedFunctions,[]);
});
