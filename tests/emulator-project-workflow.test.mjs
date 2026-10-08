import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project Windows diagnostic inspects Brazil mirror/main counterparts without generating another ROM',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/inspect-brazil-mirror-patches-plus\.mjs/);
  assert.doesNotMatch(text,/inspect-persisted-range0-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-bisect-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.doesNotMatch(text,/ROM TO TEST MANUALLY/);
  assert.match(text,/No ROM will be generated/i);
  assert.match(text,/BRAZIL MIRROR DIAGNOSIS/);
  assert.match(text,/Inconsistent mirror\/main pairs/);
  assert.match(text,/mainPatched/);
  assert.match(text,/mirrorPatched/);
  assert.match(text,/NO ROM GENERATED/);
});
