import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-project-roundtrip-safety.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('build instala proteção de round-trip antes do export final',()=>{
  const cmd=pkg.scripts['build:editor'];
  const safe=cmd.indexOf('patch-project-roundtrip-safety.mjs');
  const globalOff=cmd.indexOf('patch-global-file-offset.mjs');
  const final=cmd.indexOf('patch-canonical-rom-export.mjs');
  assert.ok(safe>=0&&globalOff>safe&&final>globalOff);
});

test('abertura saneia patches antes de aplicar projeto',()=>{
  assert.match(patch,/studioApplyProjectWithBase\(d,baseBytes,baseName\)/);
  assert.match(patch,/studioSanitizeProjectPatches/);
  assert.match(patch,/semantic-first-v3/);
});

test('studioBuildRegionSet é opcional sem tocar no binding lexical',()=>{
  assert.match(patch,/typeof globalThis\.studioBuildRegionSet==='function'/);
  assert.match(patch,/globalThis\.studioBuildRegionSet\(\)/);
  assert.match(patch,/new Set\(\)/);
  assert.match(patch,/referência lexical insegura a studioBuildRegionSet permaneceu/);
});

test('loaders C0 legados nunca persistem nem são reaplicados',()=>{
  for(const x of ['0x2AA8E','0x2B166','0x3193A'])assert.match(patch,new RegExp(x));
  assert.match(patch,/patchesCompact/);
  assert.match(patch,/deferredPlayerPatches/);
});
