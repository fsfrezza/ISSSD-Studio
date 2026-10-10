import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rec=path.join(root,'project-recovery');
const decode=names=>JSON.parse(zlib.gunzipSync(Buffer.from(names.map(n=>fs.readFileSync(path.join(rec,n),'utf8').trim()).join(''),'base64')).toString('utf8'));

test('canonical project recovery payload contains full roster and editable state',()=>{
 const skeleton=decode(['skeleton.part1.b64']);
 const teams=decode(['teamsv1.part1.b64','teamsv1.part2.b64','teamsv1.part3.b64']);
 const teamMap=teams?.names?.teams||{};
 assert.equal(Object.keys(teamMap).length,54);
 assert.equal(Object.values(teamMap).reduce((n,t)=>n+(t?.players?.length||0),0),1080);
 assert.ok(skeleton?.state?.semantic?.textWorkspaceV2?.sections);
 const roles=new Set((skeleton?.state?.titleComposerV2?.state?.elements||[]).map(e=>e.role));
 for(const role of ['photo1','photo2','photo3','photo4','photo5','title','ball'])assert.ok(roles.has(role),`missing title role ${role}`);
});

test('recovery generator carries required PT-BR values and structural safety checks',()=>{
 const src=fs.readFileSync(path.join(root,'scripts','restore-canonical-project.mjs'),'utf8');
 for(const token of ['INTERNETSSSUCKERRELAX','JOGATINA','CENÁRIOS','PÊNALTIS','LINHA DE IMPEDIMENTO','54 equipes','1080 jogadores','7 assets','before-recovery.issdproj'])assert.match(src,new RegExp(token));
});
