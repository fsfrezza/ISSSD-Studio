import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const patch=fs.readFileSync(new URL('../scripts/patch-mandatory-plus-4mb.mjs',import.meta.url),'utf8');
const tactics=fs.readFileSync(new URL('../scripts/patch-native-tactical-individualization.mjs',import.meta.url),'utf8');
const cmd=pkg.scripts['build:editor'];

const replacementStart=tactics.indexOf('const replacement=String.raw`');
const replacementEnd=tactics.indexOf('`;\n\nhtml=html.slice',replacementStart);
const replacementBlock=replacementStart>=0&&replacementEnd>replacementStart
  ? tactics.slice(replacementStart,replacementEnd)
  : '';

test('preparação 4 MiB é obrigatória antes do restore tático',()=>{
  const identity=cmd.indexOf('patch-player-identity-v1.mjs');
  const mandatory=cmd.indexOf('patch-mandatory-plus-4mb.mjs');
  const tactical=cmd.indexOf('patch-native-tactical-individualization.mjs');
  assert.ok(identity>=0&&mandatory>identity&&tactical>mandatory);
});

test('abertura captura baseline nativa e expande o buffer global rom antes do estado semântico',()=>{
  assert.match(patch,/studioCore\(\)\.applyProject/);
  assert.match(patch,/await studioEnsureMandatoryPlus4MiB\(\)/);
  assert.match(patch,/studioCaptureNativePlusTacticsBaseline\(\)/);
  const capture=patch.indexOf('studioCaptureNativePlusTacticsBaseline();');
  const expand=patch.indexOf('await studioAutoPreparePlusTactics();');
  assert.ok(capture>=0&&expand>capture,'baseline tática precisa ser capturada antes da expansão');
  assert.match(patch,/__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__/);
  assert.match(patch,/Object\.keys\(teams\)\.length!==56/);
  assert.match(patch,/rom instanceof Uint8Array/);
  assert.match(patch,/body=rom\.length-hs/);
  assert.match(patch,/await studioAutoPreparePlusTactics\(\)/);
  assert.doesNotMatch(patch,/apply4MiBExpansionOnly\?\.\(\)/);
  assert.match(patch,/body!==0x400000/);
});

test('toda exportação Plus exige 4 MiB no mesmo buffer dos writers',()=>{
  assert.match(patch,/async function studioDoSave/);
  assert.match(patch,/Toda ROM Plus do Studio deve ter exatamente 4 MiB no buffer global/);
  assert.match(patch,/mesmo buffer rom consumido pelos writers/);
});

test('restore tático usa identidade lógica e baseline pré-expansão',()=>{
  assert.ok(replacementBlock.length>0,'bloco de restauração tática 4 MiB não encontrado');
  assert.doesNotMatch(replacementBlock,/const slots=\[0x5FE9F,0x5FEBE\]/);
  assert.match(replacementBlock,/__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__/);
  assert.match(replacementBlock,/studioTeamsV3BaseSlot\(t,p,slot\)/);
  assert.match(replacementBlock,/baseSlot!==slot/);
  assert.match(replacementBlock,/studioTeamsV3NativeBaselineTactical\(t,baseSlot\)/);
  assert.match(replacementBlock,/body!==0x400000/);
  assert.match(replacementBlock,/ainda compartilha registro tático/);
});
