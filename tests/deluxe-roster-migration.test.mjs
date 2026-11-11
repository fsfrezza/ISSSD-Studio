import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {migratePlusRostersToDeluxe} from '../src/core/deluxe-roster-migration.mjs';
import {buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {readDeluxePlayer} from '../src/core/deluxe-players.mjs';
import {SOUND_SLOTS,originalSound,selectedSound} from '../src/core/deluxe-sounds.mjs';
const fixtures=[process.env.ISSSD_DELUXE_ROM,process.env.ISSSD_PLUS_ROM,process.env.ISSSD_PLUS_PROJECT,process.env.ISSSD_DELUXE_PROJECT];
test('real project: migrate 54 teams and 1080 players by country, preserve existing domains and repair reported duplicate jerseys',{skip:fixtures.some(v=>!v)},async()=>{
 const [d,p,s,t]=fixtures,deluxe=new Uint8Array(fs.readFileSync(d)),plus=new Uint8Array(fs.readFileSync(p)),source=JSON.parse(fs.readFileSync(s)),target=JSON.parse(fs.readFileSync(t)),snapshot=structuredClone(target);
 const {project,report}=await migratePlusRostersToDeluxe(deluxe,plus,source,target);assert.deepEqual(target,snapshot);assert.equal(Object.keys(project.changes.players).length,1080);assert.equal(project.changes.structure.groups.length,9);assert.equal(report.sourceIds[21],53);assert.equal(report.sourceIds[26],21);assert.equal(report.sourceIds[36],26);
 const prior=structuredClone(project);delete prior.changes.players;delete prior.changes.structure;assert.deepEqual(prior,target);
 const result=await buildDeluxeProject(deluxe,JSON.parse(JSON.stringify(project))),out=splitRom(result.rom).rom,base=splitRom(deluxe).rom;
 for(const sound of SOUND_SLOTS)assert.deepEqual(originalSound(out,sound.id),selectedSound(base,sound.id,target.changes.sounds));
 for(let team=0;team<54;team++){const nums=[];for(let p=0;p<20;p++){const player=readDeluxePlayer(out,team,p);assert.equal(player.name,project.changes.players[team+':'+p].name.trim());nums.push(player.jersey);}assert.equal(new Set(nums).size,20);}
 assert.equal(result.expanded,false);assert.equal(result.rom.length,deluxe.length);for(const repair of report.jerseyRepairs)assert.equal(readDeluxePlayer(out,repair.targetTeam,repair.slot-1).jersey,repair.to);
});

test('backup recovers real player names and skills',{skip:fixtures.some(v=>!v)||!process.env.ISSSD_PLUS_BACKUP},async()=>{
 const [d,p,s,t]=fixtures,read=p=>JSON.parse(fs.readFileSync(p)),source=read(s),options={fallbackProjects:[read(process.env.ISSSD_PLUS_BACKUP)]};
 const {project,report}=await migratePlusRostersToDeluxe(new Uint8Array(fs.readFileSync(d)),new Uint8Array(fs.readFileSync(p)),source,read(t),options);assert.equal(project.changes.players['0:0'].name.trim(),'Buffon');assert.ok(report.recoveredNames>1000);assert.ok(report.recoveredSkillFields>7000);await buildDeluxeProject(new Uint8Array(fs.readFileSync(d)),project);
});
