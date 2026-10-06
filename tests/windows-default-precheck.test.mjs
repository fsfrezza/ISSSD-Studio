import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const scriptUrl=new URL('../scripts/check-windows-defaults.ps1',import.meta.url);

test('Windows default precheck validates canonical filenames and Plus ROM identity',async()=>{
  const text=await readFile(scriptUrl,'utf8');
  assert.match(text,/International Superstar Soccer Deluxe Plus\.sfc/);
  assert.match(text,/International-Superstar-Soccer-Deluxe-Plus-projeto\.issdproj/);
  assert.match(text,/2097152/);
  assert.match(text,/ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a/);
  assert.match(text,/PASS: default ROM and project structure is valid/);
});
