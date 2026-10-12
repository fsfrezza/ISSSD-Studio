import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=path.join(root,'scripts','patch-immutable-player-attr-baseline.mjs');
const src=fs.readFileSync(patch,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('baseline imutável de atributos integra o build e é JavaScript válido',()=>{
 execFileSync(process.execPath,['--check',patch],{stdio:'pipe'});
 assert.match(String(pkg.scripts['build:editor']||''),/patch-immutable-player-attr-baseline\.mjs/);
});

test('camisa, posição, skills e aparência são comparadas com original',()=>{
 assert.match(src,/typeof original!=='undefined'/);
 assert.match(src,/0x150000/);
 assert.match(src,/studioTeamsV3DecodeAttr\(src\.slice\(off,off\+7\)\)/);
 assert.match(src,/for\(const k of \['number','position'\]\)/);
 assert.match(src,/attrBase\?\.skills/);
 assert.match(src,/attrBase\?\.appearance/);
});

test('snapshot passa o registro original ao cálculo de overrides',()=>{
 assert.match(src,/studioTeamsV3OriginalAttrs\(Number\(team\.teamId\?\?id\),i\)/);
});
