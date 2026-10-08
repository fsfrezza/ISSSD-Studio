import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project Windows diagnostic inspects player tail mirror transforms without generating ROMs',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/inspect-player-tail-mirrors-plus\.mjs/);
  assert.doesNotMatch(text,/inspect-brazil-pre-mirror-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-focus-atom-omit-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-ddmin-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.doesNotMatch(text,/ROMs TO TEST MANUALLY/);
  assert.match(text,/exact 6-byte player-tail mirrors/i);
  assert.match(text,/No ROM will be generated/i);
  assert.match(text,/NO ROM GENERATED/);
});
