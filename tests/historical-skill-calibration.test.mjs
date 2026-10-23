import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{HISTORICAL_SKILL_KEYS,calibrateHistoricalSkills,applyHistoricalSkillCalibration}from'../src/core/historical-skills.mjs';
import{teamsV3PlayerSteps,applySteps}from'../src/core/teams-v3-writer.mjs';
import{playerOffset,decodePlayerRecord}from'../src/core/plus-player.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const project=read('International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj'),catalog=read('project-data/historical-skill-calibration.json');
const person=name=>catalog.players.find(p=>p.fullName===name);
test('54 national squads contain nine complete skills; individual records replace four generic position templates',()=>{
 assert.equal(catalog.players.length,1040);assert.equal(new Set(catalog.players.map(p=>p.team+':'+p.baseSlot)).size,1040);
 for(let id=0;id<54;id++){
  const players=project.state.semantic.teamsV1.teams[id].players;assert.equal(players.length,20);
  for(const p of players){assert.deepEqual(Object.keys(p.custom.skills).sort(),[...HISTORICAL_SKILL_KEYS].sort());assert.ok(Object.values(p.custom.skills).every(v=>Number.isInteger(v)&&v>=1&&v<=10));}
  assert.ok(new Set(players.map(p=>JSON.stringify(p.custom.skills))).size>4,'team '+id+' cannot retain only four generic vectors');
 }
 for(const p of catalog.players){assert.deepEqual(p.skills,calibrateHistoricalSkills(p.profile,p.tier,p.traits,p.record),p.fullName);if(p.mode==='replace')assert.deepEqual(project.state.semantic.teamsV1.teams[p.team].players.find(x=>x.baseSlot===p.baseSlot).custom.skills,p.skills,p.fullName);}
});
test('player characteristics differ by dimension rather than fame bonuses to every attribute',()=>{
 const pirlo=person('Andrea Pirlo').skills,robben=person('Arjen Robben').skills,koller=person('Jan Koller').skills,beckham=person('David Beckham').skills;
 assert.ok(robben.speed>pirlo.speed);assert.ok(pirlo.intelligence>robben.intelligence);assert.ok(koller.jump>koller.speed);assert.ok(koller.balance>robben.balance);assert.ok(beckham.curve>beckham.speed);
 assert.deepEqual(calibrateHistoricalSkills('C',3,{},null),calibrateHistoricalSkills('C',3,{},null),'identical assessments must not get random/hash jitter');
 assert.throws(()=>calibrateHistoricalSkills('C',6),/Perfil/);assert.throws(()=>calibrateHistoricalSkills('C',3,{shot:11}),/Skill/);
});
test('reviewed Brazil overrides and complete Germany/Argentina skills retain priority; special teams are excluded',()=>{
 for(const [slot,skills]of Object.entries(catalog.brazilReviewedSkills)){
  const saved=project.state.semantic.teamsV1.teams[30].players.find(p=>p.baseSlot===Number(slot)).custom.skills;
  for(const [k,v]of Object.entries(skills))assert.equal(saved[k],v,'Brazil '+slot+' '+k);
 }
 const recovery=read('project-data/recovered-argentina-germany.json');
 for(const id of[8,31])for(const p of recovery.teams[id].players)assert.deepEqual(project.state.semantic.teamsV1.teams[id].players.find(x=>x.baseSlot===p.baseSlot).custom.skills,p.skills);
 assert.ok(catalog.players.every(p=>![8,31,54,55].includes(p.team)));
});
test('application follows stable identities after reordering, persists through JSON reopen and changes skills alone',()=>{
 const source=structuredClone(project),first=source.state.semantic.teamsV1.teams[0].players[0];first.slot=12;source.state.semantic.teamsV1.teams[0].players[11].slot=1;first.custom.skills={shot:1};
 const before=structuredClone(source),next=applyHistoricalSkillCalibration(source,catalog);assert.deepEqual(source,before);
 assert.equal(next.state.semantic.teamsV1.teams[0].players[0].slot,12);assert.deepEqual(next.state.semantic.teamsV1.teams[0].players[0].custom.skills,person('Gianluigi Buffon').skills);
 const clean=p=>{const out=structuredClone(p);for(const t of Object.values(out.state.semantic.teamsV1.teams))for(const x of t.players)x.custom&&delete x.custom.skills;return out;};
 assert.deepEqual(clean(next),clean(before));assert.deepEqual(applyHistoricalSkillCalibration(next,catalog),next);assert.deepEqual(JSON.parse(JSON.stringify(next)),next);
 const bad=structuredClone(catalog);bad.players.at(-1).skills.speed=11;assert.throws(()=>applyHistoricalSkillCalibration(source,bad),/Skill/);assert.deepEqual(source,before);
 const wrong=structuredClone(catalog);wrong.players[0].editorName='WRONG';assert.throws(()=>applyHistoricalSkillCalibration(source,wrong),/diverge/);assert.deepEqual(source,before);
});
test('all 1080 national-player skill vectors survive actual native nibble encoding without changing shirt, appearance or position',()=>{
 const state=structuredClone(project.state.semantic);
 for(const[id,t]of Object.entries(state.teamsV1.teams)){if(Number(id)>=54){delete state.teamsV1.teams[id];continue;}for(const p of t.players){p.slot=p.baseSlot;p.custom={skills:p.custom.skills};}}
 const base=new Uint8Array(0x200000).fill(0xAB),rom=base.slice();applySteps(rom,teamsV3PlayerSteps(base,state));
 for(const[id,t]of Object.entries(state.teamsV1.teams))for(const p of t.players){const at=playerOffset(Number(id),p.slot-1),decoded=decodePlayerRecord(rom.slice(at,at+7));for(const key of HISTORICAL_SKILL_KEYS)assert.equal(decoded[key]+1,p.custom.skills[key],id+':'+p.baseSlot+' '+key);assert.equal(rom[at+4]&240,base[at+4]&240);assert.deepEqual(rom.slice(at+5,at+7),base.slice(at+5,at+7));}
});
