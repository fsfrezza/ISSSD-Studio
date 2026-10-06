import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_SIZE=0x200000;

function audit(patches,targetLength=BASE_SIZE){
  const seen=new Set();
  let duplicates=0, fullExpansion=0;
  for(const p of patches){
    const k=JSON.stringify(p);
    if(seen.has(k)) duplicates++; else seen.add(k);
    const off=Number(p.off ?? p.offset ?? -1);
    const len=Number(p.len ?? p.length ?? -1);
    if(off===BASE_SIZE && len===BASE_SIZE) fullExpansion++;
  }
  return {duplicates,fullExpansion,persistsGeneratedExpansion:targetLength>BASE_SIZE&&fullExpansion>0};
}

test('clean surgical player patches are accepted',()=>{
  assert.deepEqual(audit([{off:0x15109a,len:1},{off:0x78ea,len:1}]),{duplicates:0,fullExpansion:0,persistsGeneratedExpansion:false});
});

test('Brazil high+known low mirror is not classified as duplicate',()=>{
  const r=audit([{off:0x15109a,len:1,data:'97'},{off:0x78ea,len:1,data:'97'}]);
  assert.equal(r.duplicates,0);
});

test('exact duplicate patches are detected',()=>{
  assert.equal(audit([{off:10,len:1,data:'AA'},{off:10,len:1,data:'AA'}]).duplicates,1);
});

test('historical 2 MiB expansion persistence signature is detected',()=>{
  const r=audit([{off:0x200000,len:0x200000,data:'...'}],0x400000);
  assert.equal(r.fullExpansion,1);
  assert.equal(r.persistsGeneratedExpansion,true);
});
