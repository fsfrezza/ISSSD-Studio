import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-project-open-semantic-only.mjs',import.meta.url),'utf8');
const pkg=fs.readFileSync(new URL('../package.json',import.meta.url),'utf8');

test('abertura do projeto hidrata UI sem reaplicar estado semântico diretamente na ROM',()=>{
  assert.match(patch,/const reapplyProjectP=.*__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
  assert.match(patch,/html=html\.replace\(reapplyProjectP,'void 0;'\)/);
  assert.match(patch,/hydrateDom\\s\*\\\(\\s\*p/);
  assert.match(patch,/reaplicação pós-importação ainda presente/);
});

test('hidratador visual pode ser reposto da fonte canônica versionada',()=>{
  assert.match(patch,/project-import-v11\.mjs/);
  assert.match(patch,/projectImportSource=fs\.readFileSync/);
  assert.match(patch,/isssd-git-project-import-v11/);
  assert.match(patch,/canonicalModule/);
  assert.match(patch,/hidratação visual do projeto não pôde ser restaurada/);
});

test('neutralização pós-importação não depende da existência textual de applyFull',()=>{
  assert.doesNotMatch(patch,/applyFullRx/);
  assert.doesNotMatch(patch,/applyFullMatch/);
  assert.doesNotMatch(patch,/applyFullBlock/);
});

test('recusa de writer físico durante abertura semantic-only não aborta o projeto',()=>{
  assert.match(patch,/semanticWriterRefusal/);
  assert.match(patch,/Os textos do projeto foram restaurados, mas não puderam ser aplicados automaticamente à ROM/);
  assert.match(patch,/if\(!semanticWriterRefusal\.test\(message\)\)throw e/);
  assert.match(patch,/__ISSSD_SEMANTIC_OPEN_WRITER_BYPASSED__/);
  assert.match(patch,/let result=true/);
});

test('ciclo legado de abertura fica em modo semântico e não monta ROM parcial',()=>{
  assert.match(patch,/window\.__ISSSD_SEMANTIC_OPEN_ONLY__=true/);
  assert.match(patch,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)\{\$\{physical\}\}/);
  assert.match(patch,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)\$\{mandatory\}/);
  assert.match(patch,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)window\.__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
  assert.match(patch,/if\(window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)return false/);
  assert.doesNotMatch(patch,/legacyApply\(d,new Uint8Array\(baseBytes\),baseName\)/);
});

test('ROM autoritativa é sempre recolocada na base limpa durante abertura',()=>{
  assert.match(patch,/rom=new Uint8Array\(baseBytes\)/);
  assert.match(patch,/__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true/);
  assert.match(patch,/__ISSSD_PLUS_4MB_MANDATORY__=false/);
});

test('barreira semântica roda depois do export canônico e antes do verificador final',()=>{
  const build=JSON.parse(pkg).scripts['build:editor'];
  const exportPos=build.indexOf('patch-canonical-rom-export.mjs');
  const openPos=build.indexOf('patch-project-open-semantic-only.mjs');
  const verifyPos=build.indexOf('verify-final-editor-invariants.mjs');
  assert.ok(exportPos>=0&&openPos>exportPos&&verifyPos>openPos);
});
