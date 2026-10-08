import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus Windows workflow builds exactly one full integrity-reconciled project ROM for manual validation',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/build-full-plus-project\.mjs/);
  assert.doesNotMatch(text,/inspect-plus-f8-references\.mjs/);
  assert.doesNotMatch(text,/build-persisted-focus-atom-omit-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-ddmin-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.match(text,/Generating ONE full project ROM/i);
  assert.match(text,/persisted patches, semantic writers, and Plus player integrity reconciliation/i);
  assert.match(text,/ISSSD-Plus-project-integrity-fixed\.sfc/);
  assert.match(text,/No Mesen probe will run/i);
  assert.match(text,/ROM TO TEST MANUALLY/);
  assert.match(text,/PASSA if it advances normally beyond the first screen; otherwise TRAVA/i);
});
