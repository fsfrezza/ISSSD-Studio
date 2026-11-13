import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IMPROVEMENTS,IMPROVEMENT_SECTIONS,deluxeImprovementState,deluxeStructureSummary} from '../src/core/deluxe-improvements.mjs';
const item=id=>IMPROVEMENTS.find(i=>i.id===id);
test('catalog covers the seven included Plus rules and all three optional editor rules',()=>{
 assert.deepEqual(IMPROVEMENT_SECTIONS.find(s=>s.id==='plus-rom').items.map(i=>i.plusKey),['shortGoalKickB','lastAttackProtection','matchTimeSelection','oneMinuteMatch','penaltyInputFix','batterySave','playerOneSecretCodes']);
 assert.deepEqual(IMPROVEMENT_SECTIONS.find(s=>s.id==='plus-options').items.map(i=>i.plusKey),['goalkeeperBackpassNoHands','goalkeeperFreeKickTaker','goalkeeperCornerKickTaker']);
 assert.equal(new Set(IMPROVEMENTS.map(i=>i.id)).size,IMPROVEMENTS.length);
 for(const i of IMPROVEMENTS.filter(i=>i.plusKey))assert.equal(deluxeImprovementState(i,{changes:{improvements:[i.id]}}).kind,i.capability==='gameplay'?'active':'pending');
 assert.notEqual(item('penalty-interference').id,item('penalty-replay').id);
});
test('GG means six unique secret identities outside all nine regular groups',()=>{
 const p={changes:{structure:{teams:Array.from({length:60},(_,plusId)=>({plusId})),groups:Array.from({length:9},(_,g)=>Array.from({length:6},(_,i)=>g*6+i)),secret:[59,58,57,56,55,54]},teamVisuals:{}}},before=structuredClone(p);
 assert.equal(deluxeImprovementState(item('gg-secret'),p).kind,'active');
 assert.match(deluxeStructureSummary(p),/60 equipes · 9 grupos regulares · 6 equipes secretas · GG secreto preservado/);
 assert.equal(deluxeImprovementState(item('team-visuals'),p).kind,'active');assert.equal(deluxeImprovementState(item('expansion'),p).kind,'active');assert.deepEqual(p,before);
 p.changes.structure.groups[0][0]=54;assert.equal(deluxeImprovementState(item('gg-secret'),p).kind,'inactive');
 p.changes.structure.groups[0][0]=0;p.changes.structure.secret[0]=54;assert.equal(deluxeImprovementState(item('gg-secret'),p).kind,'inactive');
});
test('original Deluxe and unopened projects never claim active GG or Plus gameplay patches',()=>{
 assert.equal(deluxeImprovementState(item('gg-secret'),null).kind,'available');
 const p={changes:{improvements:[]}};assert.equal(deluxeImprovementState(item('gg-secret'),p).kind,'inactive');
 assert.equal(deluxeImprovementState(item('deluxe-base'),p).kind,'available');assert.match(deluxeStructureSummary(p),/original Deluxe/);
 const html=fs.readFileSync(new URL('../deluxe-editor/index.html',import.meta.url),'utf8');assert.match(html,/<div id="improvements"><\/div>/);assert.doesNotMatch(html,/Melhorias em preparação/);
});
const projectPath=process.env.ISSSD_GG_RECOVERED_PROJECT;
test('user GG project keeps sixty teams and a secret GG group while viewing improvements',{skip:!projectPath},()=>{
 const p=JSON.parse(fs.readFileSync(projectPath)),snapshot=JSON.stringify(p);
 assert.equal(Object.keys(p.changes.players).length,1200);
 assert.equal(deluxeImprovementState(item('gg-secret'),p).kind,'active');assert.match(deluxeStructureSummary(p),/GG secreto preservado/);
 for(const s of IMPROVEMENT_SECTIONS)for(const i of s.items)deluxeImprovementState(i,p);
 assert.equal(JSON.stringify(p),snapshot);
});
