import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-project-open-semantic-only.mjs',import.meta.url),'utf8');
const pkg=fs.readFileSync(new URL('../package.json',import.meta.url),'utf8');

test('abertura do projeto deixa de reaplicar estado semântico diretamente na ROM',()=>{
  assert.match(patch,/const oldApplyFull=.*__ISSSD_GIT_REAPPLY_PROJECT_STATE__/s);
  assert.match(patch,/const newApplyFull=.*hydrateDom\(p\)/s);
  assert.doesNotMatch(patch,/const newApplyFull=.*__ISSSD_GIT_REAPPLY_PROJECT_STATE__/s);
});

test('importador legado roda sobre cópia e restaura bytes imutáveis da ROM-base',()=>{
  assert.match(patch,/const pristine=new Uint8Array\(baseBytes\)/);
  assert.match(patch,/legacyApply\(d,new Uint8Array\(baseBytes\),baseName\)/);
  assert.match(patch,/rom=pristine/);
  assert.match(patch,/__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true/);
});

test('barreira semântica roda depois do export canônico e antes do verificador final',()=>{
  const build=JSON.parse(pkg).scripts['build:editor'];
  const exportPos=build.indexOf('patch-canonical-rom-export.mjs');
  const openPos=build.indexOf('patch-project-open-semantic-only.mjs');
  const verifyPos=build.indexOf('verify-final-editor-invariants.mjs');
  assert.ok(exportPos>=0&&openPos>exportPos&&verifyPos>openPos);
});
