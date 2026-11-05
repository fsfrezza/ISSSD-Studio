import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

test('goalkeeper WRAM tool separates capture-specific versus shared changes',()=>{
  const dir=mkdtempSync(join(tmpdir(),'isssd-gk-'));
  try {
    const b=Buffer.alloc(0x20000),i=Buffer.from(b),l=Buffer.from(b);
    i[10]=1; // illegal only
    i[20]=2;l[20]=2; // common
    i[30]=3;l[30]=4; // divergent
    l[40]=5; // legal only
    const names=['before.bin','illegal.bin','legal.bin'];
    [b,i,l].forEach((buf,n)=>writeFileSync(join(dir,names[n]),buf));
    const run=spawnSync(process.execPath,[resolve('scripts/analyze-goalkeeper-wram.mjs'),...names.map(n=>join(dir,n))],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stdout,/"illegalOnly": 1/);
    assert.match(run.stdout,/"legalOnly": 1/);
    assert.match(run.stdout,/"differentResult": 1/);
    assert.match(run.stdout,/"sharedTransition": 1/);
    assert.match(run.stdout,/0x0000A/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('goalkeeper WRAM tool rejects non-WRAM-sized dumps',()=>{
  const dir=mkdtempSync(join(tmpdir(),'isssd-gk-bad-'));
  try {
    const p=join(dir,'bad.bin');
    writeFileSync(p,Buffer.alloc(3));
    const run=spawnSync(process.execPath,[resolve('scripts/analyze-goalkeeper-wram.mjs'),p,p,p],{encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/expected 131072 bytes/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
