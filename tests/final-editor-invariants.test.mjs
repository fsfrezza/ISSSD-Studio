import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const verifier=fs.readFileSync(new URL('../scripts/verify-final-editor-invariants.mjs',import.meta.url),'utf8');
const cmd=pkg.scripts['build:editor'];

test('verificador final continua sendo a última etapa do build do Editor',()=>{
  assert.match(cmd,/patch-canonical-rom-export\.mjs && node scripts\/patch-team-semantic-overlay\.mjs && node scripts\/patch-project-open-semantic-only\.mjs && node scripts\/patch-team-group-safety\.mjs && node scripts\/patch-retired-team-expansion\.mjs && node scripts\/patch-independent-teams\.mjs && node scripts\/verify-final-editor-invariants\.mjs$/);
});

test('verificador final exige overlay teamsV1 antes da barreira de abertura',()=>{
  const overlay=cmd.indexOf('patch-team-semantic-overlay.mjs');
  const open=cmd.indexOf('patch-project-open-semantic-only.mjs');
  const verify=cmd.indexOf('verify-final-editor-invariants.mjs');
  assert.ok(overlay>=0&&open>overlay&&verify>open);
  assert.match(verifier,/isssd-team-semantic-overlay-v1/);
  assert.match(verifier,/__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__/);
});

test('verificador final exige abertura semântica v4 com sessão inicializada pela ROM-base limpa',()=>{
  assert.match(verifier,/isssd-project-open-semantic-only-v4/);
  assert.match(verifier,/studioCore\(\)\.applyProject\(cleanBase,cleanBase,baseName,d\?\.state\?\.ui\|\|\{\},d\?\.base\?\.profile\|\|null\)/);
  assert.match(verifier,/barreira v4 de abertura semântica não foi instalada/);
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
  assert.match(verifier,/X-ISSSD-Archive/);
  assert.match(verifier,/cumulative-v1/);
});
