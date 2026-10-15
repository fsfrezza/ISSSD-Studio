import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const validator=fs.readFileSync(new URL('../scripts/validate-local-editor.mjs',import.meta.url),'utf8');
const sourceGuard=fs.readFileSync(new URL('../scripts/verify-editor-source.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('há um único comando de validação local antes do teste manual',()=>{
  assert.equal(pkg.scripts['validate:editor:local'],'node scripts/validate-local-editor.mjs');
  assert.match(validator,/npm_execpath/);
  assert.match(validator,/process\.execPath/);
  assert.doesNotMatch(validator,/npm\.cmd/);
  assert.match(validator,/\['test'\]/);
  assert.match(validator,/\['run','build:editor'\]/);
  assert.match(validator,/verify-final-editor-invariants\.mjs/);
});

test('validação protege vendor ROMs projetos e diretórios de recuperação',()=>{
  for(const token of [
    "'.editor-vendor'",
    "'roms'",
    "'project-assets'",
    "'project-data'",
    "'project-recovery'",
    "'project-source'",
    "'recovery'",
    "'imagens'",
    ".endsWith('.issdproj')"
  ])assert.ok(validator.includes(token),`proteção ausente: ${token}`);
  assert.match(validator,/diffSnapshots\(before,after\)/);
  assert.match(validator,/arquivos protegidos: inalterados/);
});

test('baseline contaminado é rejeitado antes de build-editor poder descartá-lo',()=>{
  for(const marker of [
    'ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE',
    'isssd-git-controller-v17',
    'git-controller-ui-v17-native-font',
    'git-controller-ui-v18-stable-no-observer',
    'isssd-project-open-semantic-only-v2'
  ])assert.ok(sourceGuard.includes(marker),`marcador de contaminação ausente: ${marker}`);
  assert.match(sourceGuard,/Build interrompido/);
  assert.match(sourceGuard,/\.editor-vendor preservado/);
});

test('validação não executa migração nem salvamento de projeto',()=>{
  assert.doesNotMatch(validator,/ensure:project/);
  assert.doesNotMatch(validator,/ensure:plus-preparation/);
  assert.doesNotMatch(validator,/restore:project/);
  assert.match(validator,/nenhum \.issdproj foi aberto, migrado ou salvo/);
});
