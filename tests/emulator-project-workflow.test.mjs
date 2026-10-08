import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project Windows diagnostic builds exact omission ROMs for isolated Q1.4.2.3 atoms',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/build-persisted-focus-atom-omit-plus\.mjs/);
  assert.doesNotMatch(text,/inspect-persisted-focus-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-ddmin-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.match(text,/FIVE exact omission ROMs/i);
  assert.match(text,/omits exactly one dependency-safe atom/i);
  assert.match(text,/--parts' '4' '--focus-path' '0,3,1,2/);
  assert.match(text,/ROMs TO TEST MANUALLY/);
  assert.match(text,/T1\/T2\/T3\/T4\/T5 = TRAVA or PASSA/);
});
