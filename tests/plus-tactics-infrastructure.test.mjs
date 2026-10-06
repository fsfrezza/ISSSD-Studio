import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_TACTICAL_POINTER_TABLE_PC,
  PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC,
  PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC,
  plusLoRomPc,
  resolvePlusTacticalRecord,
} from '../src/core/plus-tactics-address.mjs';
import {
  PLUS_TACTICAL_EXPECTED_LOADERS,
  planPlusTacticalInfrastructure,
  preparePlusTacticalInfrastructure,
} from '../src/core/plus-tactics-infrastructure.mjs';

function setPtr(rom,entry,ptr){
  const o=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  rom[o]=ptr&255;rom[o+1]=(ptr>>>8)&255;
}
function installOriginalLoader(rom,e){
  rom.set(new Uint8Array([0xBF,0xD0,0xFD,0x8B,0x85,e.pointerDp,0xA9,0x8B,0x00,0x85,e.bankDp]),e.pc);
}
function fixture(){
  const rom=new Uint8Array(0x200000);rom.fill(0);
  for(let i=0;i<57;i++){
    const ptr=0x9000+i*0x20;
    setPtr(rom,i,ptr);
    const pc=plusLoRomPc(0x8B,ptr);
    for(let j=0;j<31;j++)rom[pc+j]=(i+j)&255;
  }
  // Teams 30 and 31 share exactly the original physical preset of entry 30.
  const shared=0x9000+30*0x20;setPtr(rom,31,shared);
  const sharedPc=plusLoRomPc(0x8B,shared);
  for(let j=0;j<31;j++)rom[sharedPc+j]=(0x80+j)&255;
  for(const e of PLUS_TACTICAL_EXPECTED_LOADERS)installOriginalLoader(rom,e);
  return rom;
}

test('preparer expands immutable 2 MiB input and individualizes shared tactical presets',()=>{
  const base=fixture(),before=base.slice();
  const out=preparePlusTacticalInfrastructure(base);
  assert.equal(out.length,0x400000);
  assert.deepEqual(base,before);
  assert.equal(out[0x7FD7],0x0C);
  const marker=new TextDecoder().decode(out.slice(PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC,PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC+14));
  assert.equal(marker,'ISSDTACTBANKV1');

  const a=resolvePlusTacticalRecord(out,30),b=resolvePlusTacticalRecord(out,31);
  assert.equal(a.ptr,b.ptr);
  assert.equal(a.pointerBank,0x8B);
  assert.equal(b.pointerBank,0xC0);
  assert.notEqual(a.recordPc,b.recordPc);
  assert.deepEqual(a.raw,b.raw);
});

test('planner preserves pointer table and emits bank selector words',()=>{
  const base=fixture();
  const expanded=new Uint8Array(0x400000);expanded.fill(0xFF);expanded.set(base);
  const pointerBefore=expanded.slice(PLUS_TACTICAL_POINTER_TABLE_PC,PLUS_TACTICAL_POINTER_TABLE_PC+57*2);
  const plan=planPlusTacticalInfrastructure(expanded);
  assert.equal(plan.cloneMap.length,1);
  assert.equal(plan.cloneMap[0].entry,31);
  assert.equal(plan.cloneMap[0].targetBank,0xC0);
  assert.equal(plan.bankSelector[30],0x8B);
  assert.equal(plan.bankSelector[31],0xC0);
  const prepared=expanded.slice();for(const w of plan.writes)prepared.set(w.bytes,w.off);
  assert.deepEqual(prepared.slice(PLUS_TACTICAL_POINTER_TABLE_PC,PLUS_TACTICAL_POINTER_TABLE_PC+57*2),pointerBefore);
  assert.equal(prepared[PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC+31*2],0xC0);
});

test('preparer patches all three known loaders and is idempotent',()=>{
  const once=preparePlusTacticalInfrastructure(fixture());
  for(const e of PLUS_TACTICAL_EXPECTED_LOADERS){
    assert.equal(once[e.pc],0xBF);
    assert.equal(once[e.pc+6],0x22); // JSL replaces fixed LDA #$008B
    assert.equal(once[e.pc+10],0xEA);
  }
  const twice=preparePlusTacticalInfrastructure(once);
  assert.deepEqual(twice,once);
});

test('planner refuses incompatible loader fingerprint',()=>{
  const base=fixture();
  const expanded=new Uint8Array(0x400000);expanded.fill(0xFF);expanded.set(base);
  expanded[PLUS_TACTICAL_EXPECTED_LOADERS[0].pc]=0x00;
  assert.throws(()=>planPlusTacticalInfrastructure(expanded),/preflight|loader/i);
});

test('planner refuses occupied incompatible clone destination',()=>{
  const base=fixture();
  const expanded=new Uint8Array(0x400000);expanded.fill(0xFF);expanded.set(base);
  const ptr=0x9000+30*0x20,dst=plusLoRomPc(0xC0,ptr);
  expanded[dst]=0x12;
  assert.throws(()=>planPlusTacticalInfrastructure(expanded),/occupied|incompat/i);
});
