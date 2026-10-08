import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project Windows diagnostic builds four dependency-safe persisted-patch ddmin ROMs',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/build-persisted-patch-ddmin-plus\.mjs/);
  assert.doesNotMatch(text,/inspect-brazil-mirror-patches-plus\.mjs/);
  assert.doesNotMatch(text,/build-persisted-patch-bisect-plus\.mjs/);
  assert.doesNotMatch(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.match(text,/FOUR dependency-safe delta-debug ROMs/i);
  assert.match(text,/mirror\/main pairs are kept together atomically/i);
  assert.match(text,/--parts' '4/);
  assert.match(text,/ROMs TO TEST MANUALLY/);
  assert.match(text,/Q1\/Q2\/Q3\/Q4 = TRAVA or PASSA/);
});
