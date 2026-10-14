import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const cmd=pkg.scripts['build:editor'];

test('individualização tática nativa é aplicada depois do player-id',()=>{
  const identity=cmd.indexOf('patch-player-identity-v1.mjs');
  const native=cmd.indexOf('patch-native-tactical-individualization.mjs');
  assert.ok(identity>=0,'patch-player-identity-v1.mjs ausente do build');
  assert.ok(native>identity,'patch-native-tactical-individualization.mjs precisa rodar depois do player-id, pois player-id substitui studioTeamsV3RestoreTactics');
});

test('individualização tática nativa permanece antes das etapas finais de exportação',()=>{
  const native=cmd.indexOf('patch-native-tactical-individualization.mjs');
  const roundtrip=cmd.indexOf('patch-project-roundtrip-safety.mjs');
  const final=cmd.indexOf('patch-canonical-rom-export.mjs');
  assert.ok(native>=0&&roundtrip>native&&final>roundtrip);
});
