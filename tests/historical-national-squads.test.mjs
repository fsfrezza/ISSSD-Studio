import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{buildPlusProjectRom}from'../src/core/project-build.mjs';import{teamsV3Entries}from'../src/core/teams-v3-writer.mjs';import{decodeFixedPlayerName}from'../src/core/plus-player-name.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const project=read('International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj'),catalog=read('project-data/historical-national-squads.json'),recovery=read('project-data/recovered-argentina-germany.json');
test('all 54 national teams have historical squads; Brazil and the two special teams remain independently maintained',()=>{
 assert.equal(Object.keys(catalog.teams).length,51);assert.equal(teamsV3Entries(project.state.semantic).length,56);
 for(const[id,t]of Object.entries(catalog.teams)){
  assert.equal(t.players.length,20);assert.equal(new Set(t.players.map(p=>p.name)).size,20);assert.match(t.source,/rsssf\.org/);
  const players=project.state.semantic.teamsV1.teams[id].players;assert.equal(players.length,20);assert.equal(new Set(players.map(p=>p.custom.name.toLowerCase())).size,20);assert.equal(players.filter(p=>p.custom.position==='GO').length,2);
  for(const p of players){assert.equal(p.slot,p.baseSlot);assert.equal(p.custom.number,p.slot);assert.ok(p.custom.name.length<=8);assert.equal(decodeFixedPlayerName(Uint8Array.from(Buffer.from(p.custom.nameHex,'hex'))).trim().replace(/’/g,"'"),p.custom.name);assert.ok(Object.values(p.custom.skills).every(v=>Number.isInteger(v)&&v>=1&&v<=10));}
 }
 for(const id of[30,54,55])assert.ok(!catalog.teams[id]);assert.equal(project.state.semantic.teamsV1.teams[30].players[0].custom.name,'Taffarel');
});
test('Germany and Argentina recover reviewed names, shirts and skills from the archived project',()=>{
 assert.equal(recovery.sourceCommit,'05cf6fd');
 for(const id of[8,31])for(const old of recovery.teams[id].players){const p=project.state.semantic.teamsV1.teams[id].players.find(p=>p.baseSlot===old.baseSlot);assert.equal(p.custom.name,old.name);assert.equal(p.custom.number,old.number);assert.deepEqual(p.custom.skills,old.skills);assert.ok(p.custom.position);}
});
test('new starting elevens use valid balanced tactical coordinates; no forward attack-flag overflow',()=>{
 for(const id of Object.keys(catalog.teams)){
  const field=project.state.semantic.teamsV1.teams[id].players.filter(p=>p.slot>=2&&p.slot<=11);assert.deepEqual(field.reduce((a,p)=>{const k=p.custom.tactical.className;a[k]=(a[k]||0)+1;return a;},{}),{DF:4,MC:4,AT:2});
  for(const p of field){const q=p.custom.tactical;assert.ok(q.x>=-57&&q.x<=57&&q.y>=-39&&q.y<=39);if(q.className==='AT')assert.equal(q.attack,false);}
 }
});

test('confirmed Argentina references preserve original hair and palette semantics, with three overlays across the whole squad',()=>{
 const refs=read('project-data/player-appearance-references.json').references;
 for(const r of refs){const p=project.state.semantic.teamsV1.teams[r.team].players.find(p=>p.baseSlot===r.baseSlot);assert.equal(r.hair,(r.sourceByte&15)===0?14:r.sourceByte&15);assert.equal(r.palette,r.sourceByte>>4&1);assert.deepEqual(p.custom.appearance,{hair:r.hair,palette:r.palette});}
 const starters=project.state.semantic.teamsV1.teams[31].players.filter(p=>p.slot<=11);assert.equal(starters.filter(p=>p.custom.appearance.hair>0&&p.custom.appearance.hair!==14).length,2);assert.equal(starters.find(p=>p.custom.name==='Di Maria').custom.appearance.hair,14);assert.equal(project.state.semantic.teamsV1.teams[31].players.filter(p=>p.custom.appearance.hair>0&&p.custom.appearance.hair!==14).length,3);
});
