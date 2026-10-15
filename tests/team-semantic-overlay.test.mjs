import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-team-semantic-overlay.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('build instala overlay antes da barreira semantic-only',()=>{
  const cmd=pkg.scripts['build:editor'];
  const overlay=cmd.indexOf('patch-team-semantic-overlay.mjs');
  const open=cmd.indexOf('patch-project-open-semantic-only.mjs');
  const verify=cmd.indexOf('verify-final-editor-invariants.mjs');
  assert.ok(overlay>=0&&open>overlay&&verify>open);
});

test('overlay mantém projeto e estado resolvido separados da ROM',()=>{
  assert.match(patch,/__ISSSD_TEAMS_PROJECT_OVERLAY_V1__/);
  assert.match(patch,/__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__/);
  assert.match(patch,/__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__/);
  assert.doesNotMatch(patch,/rom\.set\s*\(/);
  assert.doesNotMatch(patch,/rom\s*\[[^\]]+\]\s*=/);
});

test('resolução usa identidade fixa e slot apenas como ordem atual',()=>{
  assert.match(patch,/studioTeamsV3BaseSlot/);
  assert.match(patch,/studioTeamsV3OriginalPlayer/);
  assert.match(patch,/out\.baseSlot=baseSlot;out\.slot=slot/);
  assert.match(patch,/p\?\.custom/);
});

test('overlay projeta campos de jogador, formação e tática nos modelos de UI',()=>{
  for(const field of ['name','number','position','skills','appearance','tactical'])assert.match(patch,new RegExp(field));
  assert.match(patch,/formationIndex/);
  assert.match(patch,/plusTacticalRecordForTeam=function/);
  assert.match(patch,/studioTeamsV3ReadFull=function/);
});
