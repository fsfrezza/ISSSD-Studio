import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=fs.readFileSync(path.join(root,'scripts','patch-canonical-teams-v3.mjs'),'utf8');
const ensure=fs.readFileSync(path.join(root,'scripts','ensure-plus-preparation-project.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const runtime=patch.match(/const replacement=String\.raw`([\s\S]*?)`;\n\nhtml=/)?.[1]||'';

test('teamsV1 v3 é a única persistência canônica de jogadores',()=>{
 assert.match(runtime,/schema:'isssd-teams-v1',version:3,teams:\{\}/);
 assert.match(runtime,/skills:\{acceleration:/);
 assert.match(runtime,/appearance:\{hair:/);
 assert.match(runtime,/tactical:null/);
 assert.match(runtime,/studioTeamsV3RestoreAttrs/);
 assert.match(runtime,/studioTeamsV3RestoreTactics/);
 assert.doesNotMatch(pkg.scripts['build:editor'],/patch-player-tactical-persistence/);
 assert.match(pkg.scripts['build:editor'],/patch-canonical-teams-v3/);
});

test('runtime v3 não depende de fo() e calcula file offset de forma autônoma',()=>{
 assert.match(runtime,/function studioTeamsV3FileOffset\(pc\)/);
 assert.match(runtime,/studioTeamsV3FileOffset\(rec\.recordPc\)/);
 assert.doesNotMatch(runtime,/\bfo\s*\(/);
});

test('snapshot v3 salva sem depender da variável lexical teams',()=>{
 assert.match(runtime,/function studioTeamsV3PreviousPlayer\(t,i\)/);
 assert.match(runtime,/window\.__ISSSD_TEAMS_V1__\?\.teams\?\.\[String\(t\)\]/);
 assert.match(runtime,/const previous=studioTeamsV3PreviousPlayer\(t,i\)\|\|\{\}/);
 assert.match(runtime,/name:String\(nr\?\.name\|\|previous\.name\|\|\('Jogador '/);
 assert.match(runtime,/window\.__ISSSD_TEAMS_V1__=studioTeamsV3Clone\(out\)/);
 assert.doesNotMatch(runtime,/\bteams\?\./);
 assert.match(patch,/Dependência lexical insegura de teams permaneceu no snapshot teamsV1 v3/);
});

test('migração elimina estruturas redundantes e decodifica attrHex em campos semânticos',()=>{
 assert.match(ensure,/const decodeAttr=hex=>/);
 assert.match(ensure,/number:b\[5\]\+1/);
 assert.match(ensure,/skills:\{acceleration:/);
 assert.match(ensure,/appearance:\{hair:/);
 assert.match(ensure,/delete sem\.teamsV1\.names/);
 assert.match(ensure,/delete sem\.teamsV1\.tactics/);
 assert.match(ensure,/delete sem\.teamsV1\.playerTactics/);
});

test('migração preserva Cafu no slot 2 e troca somente o lado com R.Carlos',()=>{
 assert.match(ensure,/src\.players\[0\]=\{\.\.\.src\.players\[0\],dx:8,dy:32\}/);
 assert.match(ensure,/src\.players\[3\]=\{\.\.\.src\.players\[3\],dx:8,dy:-32\}/);
});

test('Brasil tem revisão explícita de skills para os 20 jogadores',()=>{
 assert.match(ensure,/const BRAZIL_SKILLS_REVISION_VERSION=1/);
 const block=ensure.match(/const BRAZIL_SKILLS=\{([\s\S]*?)\n\};/)?.[1]||'';
 const names=['Taffarel','Cafu','D.daGuia','Lucio','R.Carlos','Dunga','Gerson','R.Gaucho',"Pele'",'Ronaldo','Garrinch','Gilmar','D.Santos','N.Santos','Aldair','Falcao','Rivaldo','Zico','Neymar','Romario'];
 for(const name of names)assert.ok(block.includes(`'${name}'`)||block.includes(`"${name}"`),`skill ausente: ${name}`);
 assert.match(ensure,/skillKeys=\['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'\]/);
 assert.match(ensure,/p\.skills=Object\.fromEntries/);
 assert.match(ensure,/schema:'isssd-brazil-skills-v1'/);
});
