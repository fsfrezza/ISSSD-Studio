import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patchPath=path.join(root,'scripts','patch-desired-internal-title-button.mjs');
const src=fs.readFileSync(patchPath,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('patch do nome interno desejado é JavaScript válido e integra o build',()=>{
 execFileSync(process.execPath,['--check',patchPath],{stdio:'pipe'});
 assert.match(pkg.scripts['build:editor'],/post-build-project-structure\.mjs && node scripts\/patch-desired-internal-title-button\.mjs && node scripts\/patch-global-file-offset\.mjs/);
});

test('botão é instalado no campo romMetaTitleDesired',()=>{
 assert.match(src,/romMetaTitleDesired/);
 assert.match(src,/romMetaTitleDesiredImplementBtn/);
 assert.match(src,/Implementar nome desejado/);
});

test('nome completo permanece no projeto e ROM recebe até 21 bytes',()=>{
 assert.match(src,/window\.__ISSSD_INTERNAL_TITLE_DESIRED__=full/);
 assert.match(src,/window\.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=romTitle/);
 assert.match(src,/slice\(0,21\)/);
 assert.match(src,/full\.length>21\?'Implementado · ROM: 21 bytes':'Implementado'/);
});

test('implementação usa o gravador canônico já existente',()=>{
 assert.match(src,/__ISSSD_ROM_META_WRITE_TITLE__\?\.\(romTitle,'Nome interno desejado do projeto'\)/);
 assert.match(src,/title\.dispatchEvent\(new Event\('input',\{bubbles:true\}\)\)/);
 assert.match(src,/desired\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
});
