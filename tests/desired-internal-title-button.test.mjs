import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patchPath=path.join(root,'scripts','patch-desired-internal-title-button.mjs');
const src=fs.readFileSync(patchPath,'utf8');
const bridge=fs.readFileSync(path.join(root,'editor-src','visual-bridge-overrides.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('patch do nome interno desejado é JavaScript válido e integra o build',()=>{
 execFileSync(process.execPath,['--check',patchPath],{stdio:'pipe'});
 const build=String(pkg.scripts['build:editor']||'');
 const post=build.indexOf('post-build-project-structure.mjs');
 const desired=build.indexOf('patch-desired-internal-title-button.mjs');
 const fo=build.indexOf('patch-global-file-offset.mjs');
 assert.ok(post>=0,'post-build-project-structure.mjs ausente do build');
 assert.ok(desired>post,'patch-desired-internal-title-button.mjs deve rodar depois do post-build');
 assert.ok(fo>desired,'patch-global-file-offset.mjs deve permanecer depois do patch do nome interno');
});

test('botão e status ficam embutidos no helper que cria romMetaTitleDesired',()=>{
 assert.match(src,/helperTail/);
 assert.match(src,/helperReplacement/);
 assert.match(src,/id=\"romMetaTitleDesiredImplementBtn\"/);
 assert.match(src,/id=\"romMetaTitleDesiredImplementStatus\"/);
 assert.match(src,/Implementar nome desejado/);
 assert.match(src,/if\(!html\.includes\(helperTail\)\)throw new Error/);
});

test('nome completo permanece no projeto e ROM recebe até 21 bytes',()=>{
 assert.match(src,/window\.__ISSSD_INTERNAL_TITLE_DESIRED__=full/);
 assert.match(src,/window\.__ISSSD_INTERNAL_TITLE_IMPLEMENTED__=romTitle/);
 assert.match(src,/slice\(0,21\)/);
 assert.match(src,/full\.length>21\?'Implementado · ROM: 21 bytes':'Implementado'/);
 // A estrutura canônica do projeto deve persistir explicitamente o valor completo.
 assert.match(bridge,/__ISSSD_INTERNAL_TITLE_DESIRED__/);
});

test('implementação usa o gravador canônico já existente',()=>{
 assert.match(src,/__ISSSD_ROM_META_WRITE_TITLE__\?\.\(romTitle,'Nome interno desejado do projeto'\)/);
 assert.match(src,/title\.dispatchEvent\(new Event\('input',\{bubbles:true\}\)\)/);
 assert.match(src,/desired\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
});
