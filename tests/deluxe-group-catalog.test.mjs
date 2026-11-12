import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PLUS_TEAM_CATALOG,PLUS_NORMAL_GROUPS} from '../src/core/plus-team-catalog.mjs';
import {availablePlusTeams,addPlusCatalogGroup,applyPlusGroupOrganization,projectPlusIds} from '../src/core/deluxe-group-catalog.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {readDeluxePlayer} from '../src/core/deluxe-players.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,saved=process.env.ISSSD_SAVED_PROJECT;
test('Plus catalog has 54 normal teams, 2 secret teams and 1120 complete players',()=>{
 assert.equal(PLUS_TEAM_CATALOG.length,56);assert.equal(PLUS_TEAM_CATALOG.filter(t=>t.secret).length,2);
 assert.deepEqual(PLUS_TEAM_CATALOG.slice(54).map(t=>t.name),['Equipe dos Autores','All Stars']);
 assert.equal(new Set(PLUS_NORMAL_GROUPS.flat()).size,54);assert.ok(PLUS_NORMAL_GROUPS.every(g=>g.length===6));
 for(const team of PLUS_TEAM_CATALOG){assert.equal(team.players.length,20);assert.deepEqual(team.players.map(p=>p.jersey).sort((a,b)=>a-b),Array.from({length:20},(_,i)=>i+1));}
});
test('six distinct available teams, arbitrary order, atomic rejection, serialized IDs and exact default restoration',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file),snapshot=structuredClone(p);
 const available=availablePlusTeams(p).map(t=>t.plusId);assert.equal(available.length,18);assert.ok(!available.includes(53));assert.ok(available.includes(26));
 for(const selected of [[],available.slice(0,5),[...available.slice(0,5),available[0]],[0,...available.slice(0,5)],[54,...available.slice(0,5)]])assert.throws(()=>addPlusCatalogGroup(base,p,selected));
 p.changes.players={'0:0':{name:'Buffon'}};p.changes.groupLabels=['GRUPO A','EUROPE 2','EUROPE 3','EUROPE 4','ASIA-AFRICA','N.S.AMERICA'];
 const ids=available.slice(-6).reverse(),next=addPlusCatalogGroup(base,p,ids);assert.equal(next.changes.structure.teams.length,42);assert.equal(next.changes.structure.labels[0],'GRUPO A');assert.deepEqual(projectPlusIds(next).slice(36),ids);assert.equal(next.changes.players['0:0'].name,'Buffon');
 assert.ok(ids.every(id=>!availablePlusTeams(next).some(t=>t.plusId===id)));
 const built=await buildDeluxeProject(file,JSON.parse(JSON.stringify(next))),rom=splitRom(built.rom).rom;
 ids.forEach((id,i)=>{for(let player=0;player<20;player++){const actual=readDeluxePlayer(rom,36+i,player),expected=PLUS_TEAM_CATALOG[id].players[player];assert.equal(actual.name,expected.name);assert.equal(actual.jersey,expected.jersey);assert.deepEqual(actual.skills,expected.skills);}});
 assert.deepEqual((await buildDeluxeProject(file,snapshot)).rom,file);
 const all=applyPlusGroupOrganization(base,next);assert.equal(all.changes.players['0:0'].name,'Buffon');assert.deepEqual(all.changes.structure.groups.map(g=>g.map(slot=>projectPlusIds(all)[slot])),PLUS_NORMAL_GROUPS);await buildDeluxeProject(file,all);
});
test('apply Plus organization to saved project preserves all existing custom players, names and other domains',{skip:!fixture||!saved},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),p=JSON.parse(fs.readFileSync(saved)),snapshot=structuredClone(p),next=applyPlusGroupOrganization(splitRom(file).rom,p);
 assert.deepEqual(p,snapshot);assert.deepEqual(next.changes.players,p.changes.players);assert.deepEqual(next.changes.structure.teams,p.changes.structure.teams);assert.deepEqual(next.changes.titleScreen,p.changes.titleScreen);await buildDeluxeProject(file,JSON.parse(JSON.stringify(next)));
});
