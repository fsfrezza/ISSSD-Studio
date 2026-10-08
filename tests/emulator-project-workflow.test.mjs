import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/test-plus-project-emulator-windows.ps1',import.meta.url);

test('Plus project emulator workflow builds one persisted-patch bisect ROM before cross-ROM probing',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/build-persisted-patch-bisect-plus\.mjs/);
  assert.doesNotMatch(text,/build-semantic-only-plus-project\.mjs/);
  assert.doesNotMatch(text,/verify-real-plus-project\.mjs/);
  assert.match(text,/discover-mesen-cross-rom-windows\.ps1/);
  assert.match(text,/\.tools\\mesen-runs/);
  assert.match(text,/probe-comparison\.json/);
  assert.match(text,/ROM TO TEST MANUALLY/);
  assert.match(text,/first thirty-second of canonical ranges/i);
  assert.match(text,/--part' '0' '--parts' '32/);
});
