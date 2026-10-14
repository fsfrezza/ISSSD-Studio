import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'scripts','patch-team-field-state.mjs');
const nativeTactics=path.join(root,'scripts','patch-native-tactical-individualization.mjs');
const src=fs.readFileSync(file,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const snapshotStart=src.indexOf('const snapshot=String.raw`');
const snapshotEnd=src.indexOf("replaceBlock('function studioTeamsV3Snapshot(){",snapshotStart);
const snapshotBlock=snapshotStart>=0&&snapshotEnd>snapshotStart?src.slice(snapshotStart,snapshotEnd):'';

test('patch de sparse overrides é JavaScript válido e precede identidade e restauração tática final',()=>{
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 execFileSync(process.execPath,['--check',nativeTactics],{stdio:'pipe'});
 const build=String(pkg.scripts['build:editor']||'');
 const canonical=build.indexOf('patch-canonical-teams-v3.mjs');
 const field=build.indexOf('patch-team-field-state.mjs');
 const identity=build.indexOf('patch-player-identity-v1.mjs');
 const mandatory=build.indexOf('patch-mandatory-plus-4mb.mjs');
 const native=build.indexOf('patch-native-tactical-individualization.mjs');
 assert.ok(canonical>=0&&field>canonical&&identity>field&&mandatory>identity&&native>mandatory);
 assert.doesNotMatch(build,/post-build-project-structure\.mjs/);
});

test('snapshot salva somente overrides e não persiste fieldState',()=>{
 assert.ok(snapshotBlock.length>0,'bloco de snapshot sparse não encontrado');
 assert.match(snapshotBlock,/mode:'sparse-overrides'/);
 assert.match(snapshotBlock,/const p=\{slot:i\+1\};if\(Object\.keys\(custom\)\.length\)p\.custom=custom/);
 assert.match(snapshotBlock,/if\(Object\.keys\(teamCustom\)\.length\)entry\.custom=teamCustom/);
 assert.doesNotMatch(snapshotBlock,/fieldState\s*:/);
 assert.doesNotMatch(snapshotBlock,/name:'original',number:'original',position:'original'/);
 assert.match(src,/fieldState removido do formato salvo/);
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
