import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const verifier=fs.readFileSync(new URL('../scripts/verify-final-editor-invariants.mjs',import.meta.url),'utf8');
const cmd=pkg.scripts['build:editor'];

test('verificador final é a última etapa do build do Editor',()=>{
  assert.match(cmd,/patch-canonical-rom-export\.mjs && node scripts\/verify-final-editor-invariants\.mjs$/);
});

test('verificador final exige barreira síncrona dentro de studioRestoreTeamsV1',()=>{
  assert.match(verifier,/function studioRestoreTeamsV1\(state\)\{/);
  assert.match(verifier,/studioEnsureMandatoryPlus4MiBSync\(true\)/);
  assert.match(verifier,/pode iniciar sem a barreira síncrona obrigatória de 4 MiB/);
});

test('verificador final exige preparação direta do buffer e rejeita preparador legado',()=>{
  assert.match(verifier,/new Uint8Array\(hs\+0x400000\)/);
  assert.match(verifier,/rom=out;/);
  assert.match(verifier,/ISSDTACTBANKV1/);
  assert.match(verifier,/studioAutoPreparePlusTactics/);
  assert.match(verifier,/ainda depende do preparador legado/);
});

test('verificador final cobre restore tático, round-trip e Build Pipeline v1',()=>{
  assert.match(verifier,/studioTeamsV3RequireExclusive4MiBTactic/);
  assert.match(verifier,/body!==0x400000/);
  assert.match(verifier,/semantic-first-v3/);
  assert.match(verifier,/build-plus-project/);
  assert.match(verifier,/plus-build-pipeline-v1/);
  assert.match(verifier,/studioProjectObject/);
  assert.match(verifier,/payload\.length!==0x400000/);
});
