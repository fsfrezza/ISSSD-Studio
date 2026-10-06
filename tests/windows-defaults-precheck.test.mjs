import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/check-windows-defaults.ps1',import.meta.url);

test('Windows defaults precheck avoids invalid PowerShell variable-colon interpolation',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/got \$\{actualSha\}: \$romPath/);
  assert.doesNotMatch(text,/got \$actualSha: \$romPath/);
});
