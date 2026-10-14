import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const patch=fs.readFileSync(new URL('../scripts/patch-player-position-model.mjs',import.meta.url),'utf8');
const migrate=fs.readFileSync(new URL('../scripts/migrate-sparse-team-overrides.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('build instala o modelo real de seis posições do jogador após identidade e compatibilidade de nomes',()=>{
 const build=String(pkg.scripts['build:editor']||'');
 const identity=build.indexOf('patch-player-identity-v1.mjs');
 const nameCompat=build.indexOf('patch-player-name-offset-compat.mjs');
 const position=build.indexOf('patch-player-position-model.mjs');
 assert.ok(identity>=0&&nameCompat>identity&&position>nameCompat);
 assert.match(patch,/GO \/ DF \/ DF-MF \/ MF \/ MF-FW \/ FW/);
 assert.match(patch,/\['NONE','GO','DF','DF-MF','MF','MF-FW','FW'\]/);
 assert.match(patch,/'DF-MF':3/);
 assert.match(patch,/'MF-FW':5/);
 assert.match(patch,/VOL:3/);
 assert.match(patch,/MC:4/);
 assert.match(patch,/MO:5/);
 assert.match(patch,/AT:6/);
});

test('campo visual de posição usa os nomes do jogo',()=>{
 assert.match(patch,/3 · DF-MF · Defensor \/ Meio-campista/);
 assert.match(patch,/4 · MF · Meio-campista/);
 assert.match(patch,/5 · MF-FW · Meio-campista \/ Atacante/);
 assert.match(patch,/6 · FW · Atacante/);
});

test('migração sparse preserva identidade lógica e normaliza posição',()=>{
 assert.match(migrate,/identityModel:'player-id-v1'/);
 assert.match(migrate,/playerId:`\$\{teamId\}:\$\{baseSlot\}`/);
 assert.match(migrate,/baseSlot,slot/);
 assert.match(migrate,/VOL:'DF-MF'/);
 assert.match(migrate,/MC:'MF'/);
 assert.match(migrate,/MO:'MF-FW'/);
 assert.match(migrate,/AT:'FW'/);
});
