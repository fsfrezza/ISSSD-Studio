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

test('patch de sparse overrides é JavaScript válido e integra o build',()=>{
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 assert.match(pkg.scripts['build:editor'],/patch-canonical-teams-v3\.mjs && node scripts\/patch-team-field-state\.mjs && node scripts\/post-build-project-structure\.mjs/);
});

test('snapshot salva somente overrides e não persiste fieldState',()=>{
 assert.match(src,/mode:'sparse-overrides'/);
 assert.match(src,/const p=\{slot:i\+1\};if\(Object\.keys\(custom\)\.length\)p\.custom=custom/);
 assert.match(src,/if\(Object\.keys\(teamCustom\)\.length\)entry\.custom=teamCustom/);
 assert.match(src,/fieldState removido do formato salvo/);
 assert.doesNotMatch(src,/name:'original',number:'original',position:'original'/);
});

test('baseline é capturado antes de restaurar overrides',()=>{
 const baseline=src.indexOf('window.__ISSSD_TEAMS_BASELINE_V1__=studioTeamsV3Clone(studioTeamsV3ReadFull())');
 const restore=src.indexOf('const names=studioTeamsV3RestoreNames(state),attrs=studioTeamsV3RestoreAttrs(state),tacs=studioTeamsV3RestoreTactics(state)');
 assert.ok(baseline>=0&&restore>baseline);
});

test('presença do campo custom aplica e ausência preserva ROM',()=>{
 assert.match(src,/studioTeamsV3Has\(custom,'number'\)/);
 assert.match(src,/studioTeamsV3Has\(custom,'position'\)/);
 assert.match(src,/studioTeamsV3Has\(custom\.skills,k\)/);
 assert.match(src,/studioTeamsV3Has\(custom\.appearance,k\)/);
 assert.match(src,/studioTeamsV3Has\(q,'x'\)/);
 assert.match(src,/studioTeamsV3Has\(q,'attack'\)/);
 assert.match(src,/if\(!changed\)continue/);
});

test('formato cheio e fieldState antigos só existem como compatibilidade de leitura',()=>{
 assert.match(src,/function studioTeamsV3LegacyPlayerCustom/);
 assert.match(src,/p\?\.custom&&typeof p\.custom==='object'/);
 assert.match(src,/const custom=\{\},fs=p\?\.fieldState\|\|\{\}/);
 assert.match(src,/flag==='custom'/);
});

test('patch remove referências TDZ dos mapas de posição',()=>{
 assert.match(src,/Evita TDZ/);
 assert.match(src,/STUDIO_TEAMS_V3_ID_TO_POS\\\[/);
 assert.match(src,/STUDIO_TEAMS_V3_POS_TO_ID\\\[/);
 assert.match(src,/referência TDZ aos mapas de posição permaneceu/);
});
