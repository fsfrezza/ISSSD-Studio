import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {recoverDeluxeGGRosters} from '../src/core/deluxe-gg-recovery.mjs';
import {buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {readDeluxePlayer} from '../src/core/deluxe-players.mjs';
import {decodePlayerRecord} from '../src/core/plus-player.mjs';
import {decodeFixedPlayerName} from '../src/core/plus-player-name.mjs';
import {DELUXE_PROJECT_TO_PLUS,deluxeGroupView,swapDeluxeProjectGroups} from '../src/core/deluxe-team-identity.mjs';
import {applyPlusGroupOrganization} from '../src/core/deluxe-group-catalog.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,ggRom=process.env.ISSSD_GG_ROM,sourcePath=process.env.ISSSD_GG_PROJECT,templatePath=process.env.ISSSD_SAVED_PROJECT;
test('GG reference: recover all 60 teams / 1200 players, preserve secret group through JSON roundtrip, organization and ROM export',{skip:![fixture,ggRom,sourcePath,templatePath].every(Boolean)},async()=>{
 const base=new Uint8Array(fs.readFileSync(fixture)),rom=new Uint8Array(fs.readFileSync(ggRom)),source=JSON.parse(fs.readFileSync(sourcePath)),template=JSON.parse(fs.readFileSync(templatePath)),snapshot=structuredClone(template);
 const project=recoverDeluxeGGRosters(rom,template,source);assert.deepEqual(template,snapshot);
 assert.equal(project.changes.structure.groups.length,9);assert.deepEqual(project.changes.structure.secret,[54,55,56,57,58,59]);assert.equal(deluxeGroupView(splitRom(base).rom,project).length,10);
 assert.equal(project.changes.structure.labels[9],'GG');assert.equal(Object.keys(project.changes.players).length,1200);
 assert.deepEqual(project.changes.titleScreen,template.changes.titleScreen);assert.deepEqual(project.changes.sounds,template.changes.sounds);
 const json=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(base,json);assert.ok(result.expanded);assert.equal(result.rom.length,base.length+0x200000);
 const out=result.rom.slice(result.base.headerSize);
 // The allocation log defines the relocated name table; never assume a native 56-team pointer table.
 const raw=rom.slice(0x2ef000,0x2f0000),log=JSON.parse(new TextDecoder().decode(raw.slice(0,raw.indexOf(255)))),names=log.group[0].names-54*160;
 for(let slot=0;slot<60;slot++)for(let player=0;player<20;player++){
  const plus=DELUXE_PROJECT_TO_PLUS[slot],actual=readDeluxePlayer(out,slot,player),expected=decodePlayerRecord(rom.slice(0x150000+(plus*20+player)*7,0x150000+(plus*20+player+1)*7));
  assert.equal(actual.name,decodeFixedPlayerName(rom.slice(names+plus*160+player*8,names+plus*160+player*8+8)).trim());assert.equal(actual.jersey,expected.jersey);assert.equal(actual.naturalPosition,expected.naturalPosition);
  for(const k of Object.keys(actual.skills))assert.equal(actual.skills[k],expected[k]+1);
 }
 assert.equal(project.changes.players['55:12'].name,'Ale 100');
 const swapped=swapDeluxeProjectGroups(splitRom(base).rom,json,0,9);assert.deepEqual(swapped.changes.players,json.changes.players);assert.deepEqual(swapDeluxeProjectGroups(splitRom(base).rom,swapped,0,9),json);await buildDeluxeProject(base,swapped);
 const reset=applyPlusGroupOrganization(splitRom(base).rom,json);assert.deepEqual(reset.changes.structure.secret,json.changes.structure.secret);assert.equal(reset.changes.structure.labels[9],'GG');assert.deepEqual(reset.changes.players,json.changes.players);await buildDeluxeProject(base,reset);
 const bad=structuredClone(source);bad.state.semantic.independentTeamsV1.teams[54].data.names[0]^=1;assert.throws(()=>recoverDeluxeGGRosters(rom,template,bad),/divergentes/);
});
