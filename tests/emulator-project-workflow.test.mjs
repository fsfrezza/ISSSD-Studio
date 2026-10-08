import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project Windows diagnostic inspects canonical persisted range 0 without generating another ROM',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/inspect-persisted-range0-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-bisect-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.doesNotMatch(text,/ROM TO TEST MANUALLY/);
  assert.match(text,/No ROM will be generated/i);
  assert.match(text,/Range 0 PC offset/);
  assert.match(text,/Base bytes/);
  assert.match(text,/Persisted bytes/);
  assert.match(text,/First byte/);
  assert.match(text,/NO ROM GENERATED/);
});
