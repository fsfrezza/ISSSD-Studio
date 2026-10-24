import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {independentFlagPixels,independentPaletteColors} from '../src/core/independent-team-fields.mjs';
import {independentEditorFixture} from './independent-teams-editor-fixture.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const refs=read('../assets/team-flags/gg-flags.json'),project=read('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
test('six reference flags are embedded at native size and palette slots in both selection and match',()=>{
 assert.equal(Object.keys(refs.teams).length,6);
 for(const[id,ref]of Object.entries(refs.teams)){
  const team=project.state.semantic.independentTeamsV1.teams[id];
  assert.equal(ref.pixels.length,24*16);assert.ok(ref.pixels.every(p=>p>=12&&p<=15));
  assert.deepEqual(independentPaletteColors(team.data.palettes.fieldFlag),ref.colorsBgr555);
  for(const part of ['selectionFlags','fieldFlags'])assert.deepEqual(independentFlagPixels(team,part),ref.pixels);
  assert.equal(fs.existsSync(new URL('../assets/team-flags/'+ref.reference,import.meta.url)),true);
 }
});
test('Editor project import and save preserve all custom GG flag pixels and palettes',async()=>{
 const f=independentEditorFixture();await f.window.studioApplyProjectWithBase(JSON.parse(JSON.stringify(project)));
 const output=await f.window.studioProjectObject();assert.equal(Object.keys(output.state.semantic.independentTeamsV1.teams).length,6);f.window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(output);
 for(const id of Object.keys(refs.teams))for(const key of ['selectionFlags','fieldFlags','palettes'])assert.deepEqual(JSON.parse(JSON.stringify(output.state.semantic.independentTeamsV1.teams[id].data[key])),project.state.semantic.independentTeamsV1.teams[id].data[key]);
});
