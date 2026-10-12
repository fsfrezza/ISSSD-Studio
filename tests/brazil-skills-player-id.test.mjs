import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'scripts','apply-brazil-skills-by-player-id.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('revisão de skills do Brasil roda antes do preparador legado',()=>{
 const cmd=pkg.scripts['ensure:plus-preparation'];
 assert.match(cmd,/apply-brazil-skills-by-player-id\.mjs && node scripts\/ensure-plus-preparation-project\.mjs && node scripts\/migrate-sparse-team-overrides\.mjs/);
});

test('skills do Brasil são associadas à identidade estável e persistidas como sparse override',()=>{
 assert.match(src,/playerId/);
 assert.match(src,/baseSlot/);
 assert.match(src,/p\.custom\.skills=Object\.fromEntries/);
 assert.doesNotMatch(src,/BRAZIL_SKILLS\[String\(p\?\.name/);
 assert.match(src,/identityModel:'player-id-v1'/);
});

test('revisão cobre exatamente os 20 jogadores do Brasil',()=>{
 assert.match(src,/for\(let baseSlot=1;baseSlot<=20;baseSlot\+\+\)/);
 assert.match(src,/version:2/);
 assert.match(src,/`30:\$\{i\+1\}`/);
});
