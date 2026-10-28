import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../editor-src/special-rules.mjs',import.meta.url),'utf8');
const builder=readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
const pipeline=readFileSync(new URL('../src/core/project-build.mjs',import.meta.url),'utf8');

test('editor bundles special rules into generated HTML',()=>{
  assert.match(builder,/editor-src\/special-rules\.mjs/);
  assert.match(builder,/uniformRuntime\+'\\n'\+specialRulesRuntime/);
});
test('special rule saves and restores the same semantic key',()=>{
  assert.match(script,/const KEY='goalkeeperBackpassNoHands'/);
  assert.match(script,/specialRulesV1=getState\(\)/);
  assert.match(script,/setState\(project\?\.state\?\.semantic\)/);
  assert.match(script,/Regras Especiais/);
});
test('enabled but unimplemented gameplay patch fails closed in the ROM pipeline',()=>{
  assert.match(pipeline,/specialRulesV1\?\.goalkeeperBackpassNoHands===true/);
  assert.match(pipeline,/throw new Error\('Regras Especiais:/);
});
