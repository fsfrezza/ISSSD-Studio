import test from 'node:test';
import assert from 'node:assert/strict';
import {rankProbeCandidates,normalizeProbeReport} from '../src/emulator/mesen-probe-analyzer.mjs';

test('probe report normalization validates and detaches candidate data',()=>{
  const source={mode:'probe',frames:1200,candidates:[
    {address:0x123,addressHex:'0x00123',value:4,mask:0x16,changes:3},
  ]};
  const out=normalizeProbeReport(source);
  assert.deepEqual(out.candidates,[{address:0x123,addressHex:'0x00123',value:4,mask:0x16,changes:3}]);
  out.candidates[0].value=9;
  assert.equal(source.candidates[0].value,4);
});

test('probe analyzer accepts the exact report schema emitted by mesen-smoke',()=>{
  const source={
    schema:'isssd-mesen-probe-v1',
    romPath:'C:/roms/output.sfc',
    frames:1200,
    totalCandidates:1,
    emittedCandidates:1,
    candidates:[{address:0x123,addressHex:'0x00123',value:4,mask:0x16,maskHex:'0x16',changes:3}],
  };
  const out=normalizeProbeReport(source);
  assert.equal(out.mode,'probe');
  assert.equal(out.schema,'isssd-mesen-probe-v1');
  assert.equal(out.frames,1200);
  assert.equal(out.candidates[0].address,0x123);
});

test('probe candidate ranking favors multi-transition low-value state-like variables',()=>{
  const ranked=rankProbeCandidates({mode:'probe',frames:1200,candidates:[
    {address:0x30,addressHex:'0x00030',value:1,mask:0x02,changes:1},
    {address:0x20,addressHex:'0x00020',value:250,mask:0x3E,changes:5},
    {address:0x10,addressHex:'0x00010',value:4,mask:0x16,changes:3},
    {address:0x40,addressHex:'0x00040',value:2,mask:0x3E,changes:5},
  ]});
  assert.equal(ranked[0].address,0x40);
  assert.equal(ranked[1].address,0x10);
  assert.ok(ranked[0].score>ranked[1].score);
  assert.ok(ranked.every(row=>Number.isFinite(row.score)));
});

test('probe analyzer rejects malformed reports',()=>{
  assert.throws(()=>normalizeProbeReport({mode:'nav',candidates:[]}),/probe/i);
  assert.throws(()=>normalizeProbeReport({schema:'wrong',candidates:[]}),/probe/i);
  assert.throws(()=>normalizeProbeReport({mode:'probe',candidates:[{address:-1,value:0,mask:0,changes:0}]}),/address/i);
});
