import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'scripts','ensure-plus-preparation-project.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('revisão de skills do Brasil fica dentro do preparador principal',()=>{
 const cmd=pkg.scripts['ensure:plus-preparation'];
 assert.match(cmd,/ensure-plus-preparation-project\.mjs && node scripts\/migrate-sparse-team-overrides\.mjs/);
 assert.doesNotMatch(cmd,/apply-brazil-skills-by-player-id\.mjs/);
});

test('skills do Brasil são associadas à identidade estável e persistidas como sparse override',()=>{
 assert.match(src,/function brazilBaseSlot\(p\)/);
 assert.match(src,/playerId/);
 assert.match(src,/baseSlot/);
 assert.match(src,/p\.custom\.skills=Object\.fromEntries/);
 assert.doesNotMatch(src,/BRAZIL_SKILLS\[String\(p\?\.name/);
 assert.match(src,/identityModel='player-id-v1'/);
});

test('revisão cobre exatamente os 20 jogadores do Brasil',()=>{
 assert.match(src,/BRAZIL_SKILLS_BY_BASE_SLOT=\[/);
 assert.match(src,/for\(let i=1;i<=20;i\+\+\)/);
 assert.match(src,/version:BRAZIL_SKILLS_REVISION_VERSION/);
 assert.match(src,/`30:\$\{i\+1\}`/);
});
