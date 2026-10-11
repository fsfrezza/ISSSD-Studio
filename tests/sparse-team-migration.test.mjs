import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'scripts','migrate-sparse-team-overrides.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('preparação do projeto sempre termina em sparse overrides',()=>{
 assert.match(pkg.scripts['ensure:plus-preparation'],/migrate-sparse-team-overrides\.mjs/);
 assert.match(src,/mode:'sparse-overrides'/);
 assert.match(src,/originalSource:'immutable-base-rom'/);
 assert.match(src,/field-present-means-override; field-absent-means-preserve-rom/);
});

test('atributos originais são comparados com a ROM-base',()=>{
 assert.match(src,/0x150000/);
 assert.match(src,/decodeAttr\(teamId,slot\)/);
 assert.match(src,/!same\(value,baseValue\)/);
 assert.match(src,/skillKeys/);
 assert.match(src,/appearance/);
});

test('fieldState é somente entrada de migração e não aparece na saída',()=>{
 assert.match(src,/const fs=p\?\.fieldState\|\|\{\}/);
 assert.match(src,/const fs=ts\?\.fieldState\|\|\{\}/);
 assert.doesNotMatch(src,/fieldState\s*:/);
 assert.match(src,/fieldState removido/);
});

test('saída contém apenas slot e custom quando houver diferença',()=>{
 assert.match(src,/const row=\{slot:i\+1\}/);
 assert.match(src,/if\(c\)\{row\.custom=c/);
 assert.match(src,/entry\.players\.push\(row\)/);
});
