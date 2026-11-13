import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateTeamVisuals,extractGGTeamVisuals,renderDeluxeTeamLabel} from '../src/core/deluxe-team-visuals.mjs';
import {buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {DELUXE_PROJECT_TO_PLUS} from '../src/core/deluxe-team-identity.mjs';
const {ISSSD_DELUXE_ROM:basePath,ISSSD_GG_ROM:referencePath,ISSSD_PLUS_ROM:plusPath,ISSSD_GG_RECOVERED_PROJECT:projectPath}=process.env;
const available=[basePath,referencePath,plusPath,projectPath].every(Boolean);
const word=(b,p)=>b[p]|b[p+1]<<8;
test('compact labels use the native white foreground and fit long team names',()=>{
 for(const name of ['VAPOROSOS','ENCEFALICOS','REPUBLICA TCHECA','IRLANDA DO NORTE']){const raw=renderDeluxeTeamLabel(name);assert.equal(raw.length,64);assert.ok(raw.some(v=>v));assert.ok(raw.every((v,i)=>i%2===0||v===0));}
 assert.notDeepEqual(renderDeluxeTeamLabel('BRASIL'),renderDeluxeTeamLabel('ITALIA'));
});
test('visual catalog rejects malformed records',()=>{
 assert.equal(validateTeamVisuals(undefined),null);
 assert.throws(()=>validateTeamVisuals({}),/inválido/);
});
test('all sixty visual records survive project roundtrip and export without changing player edits',{skip:!available},async()=>{
 const base=new Uint8Array(fs.readFileSync(basePath)),reference=new Uint8Array(fs.readFileSync(referencePath)),plus=new Uint8Array(fs.readFileSync(plusPath)),project=JSON.parse(fs.readFileSync(projectPath));
 delete project.changes.teamVisuals;
 const before=structuredClone(project),catalog=extractGGTeamVisuals(reference,plus,crypto.createHash('sha256').update(reference).digest('hex'));
 assert.equal(Object.keys(catalog.teams).length,60);
 project.changes.teamVisuals=catalog;
 const restored=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(base,restored),out=result.rom.slice(result.base.headerSize);
 assert.deepEqual(restored,project);assert.deepEqual(restored.changes.players,before.changes.players);assert.deepEqual(restored.changes.structure,before.changes.structure);
 assert.equal(out.length,0x400000);
 for(let slot=0;slot<60;slot++){
  const id=restored.changes.structure.teams[slot].plusId??DELUXE_PROJECT_TO_PLUS[slot],visual=catalog.teams[id];
  assert.deepEqual(Array.from(out.slice(0x218000+slot*192,0x218000+(slot+1)*192)),visual.selectionFlags);
  assert.deepEqual(Array.from(out.slice(0x230000+slot*256,0x230000+(slot+1)*256)),visual.pattern);
  for(let player=0;player<20;player++)assert.equal(out[0x17bd20+(slot*20+player)*7+6]&31,reference[0x150000+(id*20+player)*7+6]&31);
 }
 assert.equal((word(out,0x7fdc)^word(out,0x7fde)),65535);
 assert.equal(out.reduce((n,b)=>(n+b)&65535,0),word(out,0x7fde));
 const bad=structuredClone(project);bad.changes.teamVisuals.teams[59].pattern.pop();await assert.rejects(buildDeluxeProject(base,bad),/Identidade visual inválida/);
 assert.deepEqual(splitRom(base).rom,new Uint8Array(fs.readFileSync(basePath)).slice(result.base.headerSize));
});
