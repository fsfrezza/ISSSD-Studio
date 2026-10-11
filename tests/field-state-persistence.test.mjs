import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'scripts','patch-team-field-state.mjs');
const src=fs.readFileSync(file,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('patch de fieldState é JavaScript válido e integra o build',()=>{
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 assert.match(pkg.scripts['build:editor'],/patch-canonical-teams-v3\.mjs && node scripts\/patch-team-field-state\.mjs && node scripts\/post-build-project-structure\.mjs/);
});

test('cada jogador distingue campos original e custom',()=>{
 assert.match(src,/fieldState/);
 assert.match(src,/name:'original',number:'original',position:'original'/);
 assert.match(src,/skills:\{\},appearance:\{\},tactical:\{\}/);
 assert.match(src,/\?'original':'custom'/);
 assert.match(src,/studioTeamsV3FieldSource/);
});

test('baseline é capturado antes de restaurar customizações',()=>{
 const baseline=src.indexOf('window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(studioTeamsV3ReadFull())');
 const restore=src.indexOf('const names=studioTeamsV3RestoreNames(state),attrs=studioTeamsV3RestoreAttrs(state),tacs=studioTeamsV3RestoreTactics(state)');
 assert.ok(baseline>=0&&restore>baseline);
});

test('restauração ignora campos originais e aplica apenas custom',()=>{
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'name'\)!=='custom'\)continue/);
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'number'\)==='custom'/);
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'position'\)==='custom'/);
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'skills\.'\+k\)==='custom'/);
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'appearance\.'\+k\)==='custom'/);
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'tactical\.x'\)==='custom'/);
 assert.match(src,/studioTeamsV3FieldSource\(p,bp,'tactical\.attack'\)==='custom'/);
});

test('patch remove referências TDZ dos mapas de posição',()=>{
 assert.match(src,/Evita TDZ/);
 assert.match(src,/STUDIO_TEAMS_V3_ID_TO_POS\\\[/);
 assert.match(src,/STUDIO_TEAMS_V3_POS_TO_ID\\\[/);
 assert.match(src,/referência TDZ aos mapas de posição permaneceu/);
});
