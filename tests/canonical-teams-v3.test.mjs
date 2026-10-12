import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=fs.readFileSync(path.join(root,'scripts','patch-canonical-teams-v3.mjs'),'utf8');
const ensure=fs.readFileSync(path.join(root,'scripts','ensure-plus-preparation-project.mjs'),'utf8');
const restore=fs.readFileSync(path.join(root,'scripts','restore-canonical-project.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const runtimeStart=patch.indexOf('const replacement=String.raw`');
const runtimeBodyStart=runtimeStart<0?-1:runtimeStart+'const replacement=String.raw`'.length;
const runtimeEnd=runtimeBodyStart<0?-1:patch.indexOf('`;',runtimeBodyStart);
const runtime=runtimeBodyStart>=0&&runtimeEnd>runtimeBodyStart?patch.slice(runtimeBodyStart,runtimeEnd):'';

test('teamsV1 v3 é a única persistência canônica de jogadores',()=>{
 assert.ok(runtime.length>0,'runtime teamsV1 v3 não foi extraído de patch-canonical-teams-v3.mjs');
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
 const bareTeamsOptional=/(?<![A-Za-z0-9_.$])teams\?\./;
 assert.doesNotMatch(runtime,bareTeamsOptional);
 assert.match(patch,/const bareTeamsOptional=\/\(\?<\!\[A-Za-z0-9_\.\$\]\)teams/);
 assert.match(patch,/Dependência lexical insegura de teams permaneceu no snapshot teamsV1 v3/);
});

test('migração v2 aceita jogadores recuperados sem attrHex e usa ROM-base como fallback',()=>{
 assert.match(ensure,/const romPath=path\.join\(root,'roms','International Superstar Soccer Deluxe Plus\.sfc'\)/);
 assert.match(ensure,/const semanticAttr=p=>/);
 assert.match(ensure,/const canonicalAttrHex=\(teamId,slot\)=>/);
 assert.match(ensure,/0x150000\+\(t\*20\+i\)\*7/);
 assert.match(ensure,/const decodeAttr=\(p,teamId,slot\)=>/);
 assert.match(ensure,/isHex\(p\?\.attrHex,7\).*canonicalAttrHex\(teamId,slot\)/s);
 assert.match(ensure,/attrs=decodeAttr\(p,teamId,slot\)/);
 assert.match(ensure,/number:b\[5\]\+1/);
 assert.match(ensure,/skills:\{acceleration:/);
 assert.match(ensure,/appearance:\{hair:/);
 assert.match(ensure,/delete sem\.teamsV1\.names/);
 assert.match(ensure,/delete sem\.teamsV1\.tactics/);
 assert.match(ensure,/delete sem\.teamsV1\.playerTactics/);
});

test('ensure:project reconhece teamsV1 v3 como íntegro e não o sobrescreve',()=>{
 assert.match(restore,/function teamsState\(project\)/);
 assert.match(restore,/Number\(ts\?\.version\)===3&&ts\?\.teams/);
 assert.match(restore,/Object\.keys\(ts\.teams\)\.length/);
 assert.match(restore,/Object\.values\(ts\.teams\)\.reduce/);
 assert.match(restore,/if\(structurallyGood\(current\)\)/);
});

test('migração preserva Cafu no slot 2 e troca somente o lado com R.Carlos',()=>{
 assert.match(ensure,/src\.players\[0\]=\{\.\.\.src\.players\[0\],dx:8,dy:32\}/);
 assert.match(ensure,/src\.players\[3\]=\{\.\.\.src\.players\[3\],dx:8,dy:-32\}/);
});

test('Brasil tem revisão explícita de skills para os 20 jogadores por identidade',()=>{
 assert.match(ensure,/const BRAZIL_SKILLS_REVISION_VERSION=2/);
 assert.match(ensure,/const BRAZIL_SKILLS_BY_BASE_SLOT=\[/);
 const block=ensure.match(/const BRAZIL_SKILLS_BY_BASE_SLOT=\[([\s\S]*?)\r?\n\];/)?.[1]||'';
 const rows=(block.match(/\[[0-9,]+\]/g)||[]);
 assert.equal(rows.length,20);
 assert.match(ensure,/function brazilBaseSlot\(p\)/);
 assert.match(ensure,/p\.playerId=`30:\$\{baseSlot\}`;p\.baseSlot=baseSlot/);
 assert.match(ensure,/p\.custom\.skills=Object\.fromEntries/);
 assert.match(ensure,/identityModel:'player-id-v1'/);
 assert.match(ensure,/schema:'isssd-brazil-skills-v1'/);
});
