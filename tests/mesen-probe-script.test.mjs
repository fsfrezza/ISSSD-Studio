import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const probePath=new URL('../scripts/mesen/probe.lua',import.meta.url);

test('Mesen WRAM probe filters reads through native write access counters',async()=>{
  const source=await readFile(probePath,'utf8');
  assert.match(source,/emu\.getAccessCounters\(emu\.counterType\.writeCount,emu\.memType\.snesWorkRam\)/);
  assert.match(source,/for _,addr in ipairs\(addresses\) do/);
  assert.doesNotMatch(source,/for addr=0,WRAM_SIZE-1 do\s*\n\s*t\[addr\]=emu\.read/);
});
