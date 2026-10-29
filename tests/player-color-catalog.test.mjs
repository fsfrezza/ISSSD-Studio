import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import * as core from '../src/core/player-color-catalog.mjs';
const choice=(h,s)=>({hairColor:h,skin:[s,s+1,s+2,s+3,s+4]});
test('catalog deduplicates colors while allowing independent skin and hair sources',()=>{
 const a=[0,31,1,2,3,4,6,...Array(9).fill(5)],b=[0,63,5,6,7,8,6,...Array(9).fill(7)];const catalog=core.makeAppearanceCatalog([{palette:a,label:'A'},{palette:a,label:'A2'},{palette:b,label:'B'}]);assert.equal(catalog.skins.length,2);assert.equal(catalog.hairColors.length,2);assert.equal(catalog.skins[0].sources.length,2);
 const mixed=core.applyAppearanceChoice(a,{skin:catalog.skins[1].colors,hairColor:catalog.hairColors[0].color});assert.equal(mixed[1],31);assert.deepEqual(mixed.slice(2,7),[5,6,7,8,6]);assert.deepEqual(mixed.slice(7),a.slice(7));assert.deepEqual(a.slice(2,6),[1,2,3,4]);
});
test('allocation uses at most two exact combinations and refuses additional colors without approximation',()=>{
 const players=[{slot:2,choice:choice(10,20)},{slot:3,choice:choice(11,30)},{slot:4,choice:choice(10,20)}],before=structuredClone(players),p=core.allocateAppearanceChoices(players);assert.deepEqual(p.assignments,{2:0,3:1,4:0});assert.deepEqual(players,before);players.push({slot:5,choice:choice(12,40)});assert.throws(()=>core.allocateAppearanceChoices(players),/3 combinações/);
});
test('project validates colors and restores identity-specific choices atomically',async()=>{
 const document={},window={ISSSDPlayerColors:core,studioApplyProjectWithBase:async p=>{if(p.fail)throw Error('failed');return p;}};vm.runInNewContext(fs.readFileSync(new URL('../editor-src/player-color-project.mjs',import.meta.url),'utf8'),{window,document});
 window.__ISSSD_PLAYER_COLORS_EDITOR__.set(30,8,choice(12,40));const p={state:{semantic:{}}};window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(p);const saved=JSON.parse(JSON.stringify(p));window.__ISSSD_PLAYER_COLORS_EDITOR__.set(30,8,null);await window.studioApplyProjectWithBase(saved);assert.deepEqual(JSON.parse(JSON.stringify(window.__ISSSD_PLAYER_COLORS_EDITOR__.get(30,8))),choice(12,40));
 await assert.rejects(window.studioApplyProjectWithBase({fail:true,state:{semantic:{}}}),/failed/);assert.deepEqual(JSON.parse(JSON.stringify(window.__ISSSD_PLAYER_COLORS_EDITOR__.get(30,8))),choice(12,40));
 assert.throws(()=>core.validatePlayerColors({schema:core.PLAYER_COLORS_SCHEMA,version:1,players:{'30:8':{skin:[1],hairColor:0}}}));assert.throws(()=>core.validatePlayerColors({schema:core.PLAYER_COLORS_SCHEMA,version:1,players:1}));
});

test('copy and swap transfer explicit catalog colors across team identities',()=>{
 const window={ISSSDPlayerColors:core};vm.runInNewContext(fs.readFileSync(new URL('../editor-src/player-color-project.mjs',import.meta.url),'utf8'),{window});const api=window.__ISSSD_PLAYER_COLORS_EDITOR__,a={team:30,identity:{baseSlot:8}},b={team:1,identity:{baseSlot:3}};
 api.set(30,8,choice(12,40));api.set(1,3,choice(22,50));api.transfer(a,b,'swap');assert.deepEqual(JSON.parse(JSON.stringify(api.get(30,8))),choice(22,50));assert.deepEqual(JSON.parse(JSON.stringify(api.get(1,3))),choice(12,40));
 api.set(30,8,null);api.transfer(a,b);assert.equal(api.get(1,3),null);
});
