import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=path.join(root,'scripts','normalize-generated-html.mjs');
const src=fs.readFileSync(patch,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('normalizador HTML é válido e roda imediatamente após build-editor',()=>{
  execFileSync(process.execPath,['--check',patch],{stdio:'pipe'});
  const build=String(pkg.scripts['build:editor']||'');
  const base=build.indexOf('scripts/build-editor.mjs');
  const norm=build.indexOf('scripts/normalize-generated-html.mjs');
  const lineup=build.indexOf('scripts/fix-lineup-swap.mjs');
  assert.ok(base>=0&&norm>base&&lineup>norm);
});

test('normalizador move conteúdo pós-html para dentro do body',()=>{
  assert.match(src,/trailing=html\.slice\(closeHtml\+7\)/);
  assert.match(src,/html=html\.slice\(0,closeBody\)\+'\\n'\+trailing\.trim\(\)\+'\\n<\/body>\\n<\/html>\\n'/);
});

test('normalizador corrige wrappers literais e JavaScript órfão conhecido',()=>{
  assert.match(src,/replace\(\/\\\\n\(\?=<script\\b\)\/g,'\\n'\)/);
  assert.match(src,/__ISSSD_MAIN_MENU_VERTICAL_OFFSET__/);
  assert.match(src,/isssd-main-menu-vertical-offset-bootstrap/);
});

test('normalizador impede conteúdo residual após html',()=>{
  assert.match(src,/html\.slice\(lastHtml\+7\)\.trim\(\)/);
  assert.match(src,/ainda existe conteúdo após <\/html>/);
});
