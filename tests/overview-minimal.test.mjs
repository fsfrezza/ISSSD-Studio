import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=path.join(root,'scripts','patch-overview-minimal.mjs');
const src=fs.readFileSync(patch,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('Visão Geral mínima integra o build e é JavaScript válido',()=>{
 execFileSync(process.execPath,['--check',patch],{stdio:'pipe'});
 assert.match(String(pkg.scripts['build:editor']||''),/patch-overview-minimal\.mjs/);
});

test('Visão Geral mostra somente fluxo e título sem remover nós exigidos pelo runtime',()=>{
 assert.match(src,/page-dashboard/);
 assert.match(src,/operationalDashboard/);
 assert.match(src,/dashboardBody/);
 assert.match(src,/dashboardInternalTitleCard/);
 assert.match(src,/hide\(document\.getElementById\('dashboardEmpty'\)\)/);
 assert.match(src,/if\(child===branch\)show\(child\);else hide\(child\)/);
 assert.match(src,/if\(isHead\|\|hasFlow\|\|hasBody\)show\(child\);else hide\(child\)/);
 assert.match(src,/mChanges, diffCountBadge e diffOffsets/);
 assert.doesNotMatch(src,/\.remove\(\)/);
});
