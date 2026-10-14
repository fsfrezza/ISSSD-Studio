import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const verifier=fs.readFileSync(new URL('../scripts/verify-final-editor-invariants.mjs',import.meta.url),'utf8');
const cmd=pkg.scripts['build:editor'];

test('verificador final é a última etapa do build do Editor',()=>{
  assert.match(cmd,/patch-canonical-rom-export\.mjs && node scripts\/verify-final-editor-invariants\.mjs$/);
});

test('verificador final bloqueia restore de teamsV1 antes de 4 MiB',()=>{
  assert.match(verifier,/studioRestoreTeamsV1\(/);
  assert.match(verifier,/studioEnsureMandatoryPlus4MiB/);
  assert.match(verifier,/restore-guard>260/);
  assert.match(verifier,/teamsV1 pode ser restaurado antes da garantia obrigatória de 4 MiB/);
});

test('verificador final cobre restore tático, round-trip e exportação canônica',()=>{
  assert.match(verifier,/studioTeamsV3RequireExclusive4MiBTactic/);
  assert.match(verifier,/body!==0x400000/);
  assert.match(verifier,/semantic-first-v3/);
  assert.match(verifier,/finalize-plus-rom/);
});
