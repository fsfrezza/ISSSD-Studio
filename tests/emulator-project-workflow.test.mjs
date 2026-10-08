import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project Windows diagnostic inspects isolated Q1.4.2.3 atoms without generating another ROM',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/inspect-persisted-focus-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-ddmin-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.doesNotMatch(text,/ROMs TO TEST MANUALLY/);
  assert.match(text,/Q1\.4\.2\.3/);
  assert.match(text,/--parts' '4' '--focus-path' '0,3,1,2/);
  assert.match(text,/FOCUSED ATOM DIAGNOSIS/);
  assert.match(text,/Dependency-safe atoms in focus/);
  assert.match(text,/NO ROM GENERATED/);
});
