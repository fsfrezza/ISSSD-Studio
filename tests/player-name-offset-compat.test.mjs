import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-player-name-offset-compat.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('build corrige o restore de nomes logo após player-id',()=>{
  assert.match(pkg.scripts['build:editor'],/patch-player-identity-v1\.mjs && node scripts\/patch-player-name-offset-compat\.mjs && node scripts\/patch-player-position-model\.mjs/);
});

test('restore de nomes substitui a chamada indefinida pelo destino canônico',()=>{
  assert.match(patch,/studioTeamsV3NameRecord\(t,slot-1\)\?\.no/);
  assert.match(patch,/Number\.isInteger\(dst\)/);
  assert.match(patch,/const oldLine=.*playerNameFileOffset/);
  assert.match(patch,/chamada antiga permaneceu em studioTeamsV3RestoreNames/);
  assert.match(patch,/destino canônico de nome não foi instalado/);
});
