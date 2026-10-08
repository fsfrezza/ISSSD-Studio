import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus Windows diagnostic traces Plus-specific F8 references without generating ROMs',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/inspect-plus-f8-references\.mjs/);
  assert.doesNotMatch(text,/inspect-player-tail-mirrors-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-focus-atom-omit-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-ddmin-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.doesNotMatch(text,/ROMs TO TEST MANUALLY/);
  assert.match(text,/0x78B8-0x78EF/);
  assert.match(text,/\$80:F828-\$80:FF8F as free bytes/);
  assert.match(text,/No ROM will be generated/i);
  assert.match(text,/NO ROM GENERATED/);
});
