import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-project-open-semantic-only.mjs',import.meta.url),'utf8');
const pkg=fs.readFileSync(new URL('../package.json',import.meta.url),'utf8');

test('abertura do projeto hidrata UI sem reaplicar estado semântico diretamente na ROM',()=>{
  assert.match(patch,/const oldApplyFull=.*__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
  const line=patch.split('\n').find(x=>x.startsWith('const newApplyFull='));
  assert.ok(line);
  assert.match(line,/hydrateDom\(p\)/);
  assert.doesNotMatch(line,/__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
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
