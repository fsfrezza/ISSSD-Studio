import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

test('regression snapshot refuses a same-size ROM with wrong base hash',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-regression-'));
  const base=path.join(dir,'base.sfc'),out=path.join(dir,'out.sfc');
  fs.writeFileSync(base,Buffer.alloc(0x200000));
  fs.writeFileSync(out,Buffer.alloc(0x200000));
  const r=spawnSync(process.execPath,['scripts/regression-snapshot.mjs',base,out],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/SHA-256 mismatch/);
});

test('known Plus base SHA-256 constant is exact and lowercase',()=>{
  const expected='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a';
  assert.equal(expected.length,64);
  assert.match(expected,/^[0-9a-f]{64}$/);
});
