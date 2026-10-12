import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=path.join(root,'scripts','patch-single-internal-title.mjs');
const src=fs.readFileSync(patch,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('título interno único integra o build e é JavaScript válido',()=>{
 execFileSync(process.execPath,['--check',patch],{stdio:'pipe'});
 const build=String(pkg.scripts['build:editor']||'');
 assert.match(build,/post-build-project-structure\.mjs/);
 assert.match(build,/patch-single-internal-title\.mjs/);
 assert.doesNotMatch(build,/patch-desired-internal-title-button\.mjs/);
});

test('helper visual do campo desejado é neutralizado sem cortar scripts do HTML',()=>{
 assert.match(src,/isssd-v328-internal-title-helper/);
 assert.match(src,/campo desejado aposentado/);
 assert.match(src,/html\.slice\(0,helperStart\)\+neutralized\+html\.slice\(helperEnd\+9\)/);
 assert.doesNotMatch(src,/html=html\.replace\(\/<script id=.*isssd-v328-internal-title-helper/);
 assert.match(src,/const opens=\(html\.match\(\/<script\\b\/gi\)\|\|\[\]\)\.length/);
 assert.match(src,/if\(opens!==closes\)throw new Error/);
});

test('UI legado é removido em runtime caso algum código antigo tente recriá-lo',()=>{
 assert.match(src,/getElementById\('romMetaTitleDesired'\)/);
 assert.match(src,/closest\('\.rommeta-field'\)/);
 assert.match(src,/MutationObserver/);
});

test('projeto novo não persiste romInternalTitleDesired',()=>{
 assert.match(src,/delete sem\.romInternalTitleDesired/);
 assert.match(src,/studioProjectObject/);
});

test('projeto legado migra desejado para título interno somente quando necessário',()=>{
 assert.match(src,/typeof sem\.romInternalTitleDesired==='string'/);
 assert.match(src,/sem\.romInternalTitle=clean\(sem\.romInternalTitleDesired\)/);
 assert.match(src,/delete sem\.romInternalTitleDesired/);
});
