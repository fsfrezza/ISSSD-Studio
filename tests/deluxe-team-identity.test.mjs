import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deluxeTeamIdentity,deluxeGroupView,swapDeluxeProjectGroups,DELUXE_PROJECT_TO_PLUS} from '../src/core/deluxe-team-identity.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,saved=process.env.ISSSD_SAVED_PROJECT;
test('Plus country identities preserve Deluxe native indices and legacy expanded slots',()=>{
 assert.equal(new Set(DELUXE_PROJECT_TO_PLUS).size,60);
 assert.deepEqual(deluxeTeamIdentity(21),{plusId:53,deluxeId:21,projectSlot:21});
 assert.deepEqual(deluxeTeamIdentity(26),{plusId:21,deluxeId:26,projectSlot:26});
 assert.deepEqual(deluxeTeamIdentity(36),{plusId:26,deluxeId:null,projectSlot:36});
 assert.throws(()=>deluxeTeamIdentity(60));
});
test('new Deluxe project remains exact; group swaps and names survive generation and restore',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file),snapshot=structuredClone(p);
 assert.equal(deluxeGroupView(base,p).length,6);assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 const next=swapDeluxeProjectGroups(base,p,0,5);assert.deepEqual(p,snapshot);
 assert.deepEqual(deluxeGroupView(base,next)[5],deluxeGroupView(base,p)[0]);
 await buildDeluxeProject(file,next);
 next.changes.groupLabels[0]='GRUPO A';
 const built=await buildDeluxeProject(file,JSON.parse(JSON.stringify(next))),out=splitRom(built.rom).rom;
 assert.notDeepEqual(out.slice(0xda3f,0xda3f+36),base.slice(0xda3f,0xda3f+36));
 assert.equal(out[0x3c54f]|out[0x3c550]<<8,0xfc00);
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(i>=0xda3f&&i<0xda3f+36||i>=0x3c54f&&i<0x3c55b||i>=0x3fc00&&i<0x3fc60||i>=0x7fdc&&i<0x7fe0,'unexpected write '+i.toString(16));
 delete next.changes.groupLabels;delete next.changes.groups;assert.deepEqual((await buildDeluxeProject(file,next)).rom,file);
});
test('existing nine-group project keeps all 1080 player records and prepared title data when groups swap',{skip:!fixture||!saved},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=JSON.parse(fs.readFileSync(saved)),snapshot=structuredClone(p);
 const next=swapDeluxeProjectGroups(base,p,0,8);assert.deepEqual(p,snapshot);
 assert.equal(deluxeGroupView(base,next).length,9);
 assert.deepEqual(next.changes.players,p.changes.players);assert.equal(Object.keys(next.changes.players).length,1080);
 assert.deepEqual(next.changes.titleScreen,p.changes.titleScreen);assert.deepEqual(next.changes.titleComposer,p.changes.titleComposer);
 const expected=structuredClone(p);expected.changes.structure.groups=next.changes.structure.groups;expected.changes.structure.labels=next.changes.structure.labels;assert.deepEqual(next,expected);
 await buildDeluxeProject(file,JSON.parse(JSON.stringify(next)));
 assert.deepEqual(swapDeluxeProjectGroups(base,next,0,8),p);
});
