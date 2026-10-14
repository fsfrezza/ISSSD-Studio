import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const patch=fs.readFileSync(new URL('../scripts/patch-mandatory-plus-4mb.mjs',import.meta.url),'utf8');
const tactics=fs.readFileSync(new URL('../scripts/patch-native-tactical-individualization.mjs',import.meta.url),'utf8');
const cmd=pkg.scripts['build:editor'];

test('preparação 4 MiB é obrigatória antes do restore tático',()=>{
  const identity=cmd.indexOf('patch-player-identity-v1.mjs');
  const mandatory=cmd.indexOf('patch-mandatory-plus-4mb.mjs');
  const tactical=cmd.indexOf('patch-native-tactical-individualization.mjs');
  assert.ok(identity>=0&&mandatory>identity&&tactical>mandatory);
});

test('abertura de projeto expande para 4 MiB antes do estado semântico',()=>{
  assert.match(patch,/studioCore\(\)\.applyProject/);
  assert.match(patch,/await studioEnsureMandatoryPlus4MiB\(\)/);
  assert.match(patch,/apply4MiBExpansionOnly/);
  assert.match(patch,/individualizeAllTactics/);
  assert.match(patch,/body!==0x400000/);
});

test('toda exportação Plus exige 4 MiB',()=>{
  assert.match(patch,/async function studioDoSave/);
  assert.match(patch,/Toda ROM Plus do Studio deve ter exatamente 4 MiB/);
});

test('restore tático não depende mais de dois slots livres no banco 8B',()=>{
  assert.doesNotMatch(tactics,/0x5FE9F|0x5FEBE/);
  assert.match(tactics,/body!==0x400000/);
  assert.match(tactics,/ainda compartilha registro tático/);
});
