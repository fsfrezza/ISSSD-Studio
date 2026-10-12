import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'scripts','migrate-sparse-team-overrides.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('preparação do projeto sempre termina em sparse overrides com identidade lógica',()=>{
 assert.match(pkg.scripts['ensure:plus-preparation'],/migrate-sparse-team-overrides\.mjs/);
 assert.match(src,/mode:'sparse-overrides'/);
 assert.match(src,/identityModel:'player-id-v1'/);
 assert.match(src,/originalSource:'immutable-base-rom'/);
 assert.match(src,/field-present-means-override; field-absent-means-preserve-rom/);
});

test('atributos originais são comparados com a ROM-base pelo baseSlot do jogador',()=>{
 assert.match(src,/0x150000/);
 assert.match(src,/decodeAttr\(teamId,baseSlot\)/);
 assert.match(src,/!same\(value,baseValue\)/);
 assert.match(src,/skillKeys/);
 assert.match(src,/appearance/);
});

test('fieldState é somente entrada de migração e não é persistido na saída',()=>{
 assert.match(src,/const fs=p\?\.fieldState\|\|\{\}/);
 assert.match(src,/const fs=ts\?\.fieldState\|\|\{\}/);
 assert.doesNotMatch(src,/fieldState\s*:/);
 assert.match(src,/sem\.teamsV1=out/);
});

test('saída preserva playerId baseSlot e slot e grava custom somente quando houver diferença',()=>{
 assert.match(src,/row=\{playerId:`\$\{teamId\}:\$\{baseSlot\}`,baseSlot,slot\}/);
 assert.match(src,/if\(p\)\{const c=customFromFullPlayer\(p,teamId,baseSlot\);if\(c\)\{row\.custom=c/);
 assert.match(src,/entry\.players\.push\(row\)/);
});

test('posições legadas são normalizadas sem alterar os códigos 1..6 da ROM',()=>{
 assert.match(src,/const POS=\['NONE','GO','DF','DF-MF','MF','MF-FW','FW'\]/);
 assert.match(src,/VOL:'DF-MF'/);
 assert.match(src,/MC:'MF'/);
 assert.match(src,/MO:'MF-FW'/);
 assert.match(src,/AT:'FW'/);
});
