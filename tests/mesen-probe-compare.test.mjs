import test from 'node:test';
import assert from 'node:assert/strict';
import {compareProbeReports} from '../src/emulator/mesen-probe-compare.mjs';

const base={schema:'isssd-mesen-probe-v1',frames:1200,candidates:[
  {address:0x10,value:2,mask:0x16,changes:3},
  {address:0x20,value:5,mask:0x3E,changes:5},
  {address:0x30,value:9,mask:0x06,changes:2},
  {address:0x40,value:1,mask:0x02,changes:1},
]};

const generated={schema:'isssd-mesen-probe-v1',frames:1200,candidates:[
  {address:0x10,value:2,mask:0x16,changes:3},
  {address:0x20,value:5,mask:0x3E,changes:4},
  {address:0x30,value:10,mask:0x06,changes:2},
  {address:0x50,value:1,mask:0x02,changes:1},
]};

test('cross-ROM probe comparison classifies exact compatible and divergent candidates',()=>{
  const out=compareProbeReports(base,generated);
  assert.equal(out.sharedAddresses,3);
  assert.deepEqual(out.promotable.map(row=>[row.address,row.classification]),[
    [0x10,'exact'],
    [0x20,'compatible'],
  ]);
  assert.equal(out.divergent.length,1);
  assert.equal(out.divergent[0].address,0x30);
  assert.equal(out.onlyBase.length,1);
  assert.equal(out.onlyGenerated.length,1);
});

test('exact cross-ROM candidates rank ahead of compatible candidates',()=>{
  const out=compareProbeReports(base,generated);
  assert.ok(out.promotable[0].score>out.promotable[1].score);
  assert.equal(out.promotable[0].addressHex,'0x00010');
});

test('cross-ROM probe comparison accepts legacy normalized probe shape too',()=>{
  const a={mode:'probe',frames:1200,candidates:[{address:1,value:1,mask:2,changes:1}]};
  const b={mode:'probe',frames:1200,candidates:[{address:1,value:1,mask:2,changes:1}]};
  assert.equal(compareProbeReports(a,b).promotable[0].classification,'exact');
});
