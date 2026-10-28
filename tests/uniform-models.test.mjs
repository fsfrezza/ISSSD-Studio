import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyUniformModel,uniformModelPixels} from '../src/core/uniform-models.mjs';
import {independentPatternPixels} from '../src/core/independent-team-fields.mjs';
import {uniformPreviewPixels} from '../src/core/uniform-preview.mjs';
import {independentEditorFixture} from './independent-teams-editor-fixture.mjs';
const project=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url)));
test('new jersey prototypes round-trip through ordinary Editor projects without changing players or reserve colors',async()=>{
 for(const[id,model]of[[55,'navy-red-halves'],[57,'white-green-sleeves']]){
  const t=project.state.semantic.independentTeamsV1.teams[id],before=structuredClone(t),next=applyUniformModel(t,model);
  assert.deepEqual(t,before);assert.deepEqual(next.data.attributes,t.data.attributes);assert.deepEqual(next.data.names,t.data.names);
  assert.deepEqual(next.data.palettes.home.slice(0,16),t.data.palettes.home.slice(0,16));assert.deepEqual(next.data.palettes.away,t.data.palettes.away);
  assert.deepEqual(next.data.appearance,t.data.appearance);assert.deepEqual(next.data.keeperPalettes,t.data.keeperPalettes);
  assert.deepEqual(independentPatternPixels(next),uniformModelPixels(model));
  const f=independentEditorFixture();await f.window.studioApplyProjectWithBase(structuredClone(project));const api=f.window.__ISSSD_UNIFIED_TEAM_CORE__;
  api.setUniformModel(id,model);const output=await f.window.studioProjectObject();assert.equal(output.state.semantic.independentTeamsV1.teams[id].uniformModelV1.id,model);
  await f.window.studioApplyProjectWithBase(JSON.parse(JSON.stringify(output)));assert.equal(api.uniformModel(id),model);assert.deepEqual(Array.from(api.pattern(id)),uniformModelPixels(model));
  api.setPattern(id,api.pattern(id));assert.equal(api.uniformModel(id),null);
 }
});
test('model front previews distinguish sleeves and wearer-left halves without recoloring shorts or skin',()=>{
 const t=project.state.semantic.independentTeamsV1.teams[57],patterns=t.data.pattern,colors=Array(16).fill(0),at=(v,x,y)=>v.pixels[y*v.width+x];
 const sleeve=uniformPreviewPixels(colors,patterns,0,'white-green-sleeves');assert.equal(at(sleeve,8,8),12);assert.equal(at(sleeve,25,24),9);assert.equal(at(sleeve,20,40),12);
 const halves=uniformPreviewPixels(colors,patterns,0,'navy-red-halves');assert.equal(at(halves,18,24),9);assert.equal(at(halves,30,24),8);
 assert.throws(()=>uniformModelPixels('invalid'));for(const id of ['white-green-sleeves','navy-red-halves']){const p=uniformModelPixels(id);assert.equal(p.length,512);assert.ok(p.some(v=>v>0));assert.ok(p.every(v=>v===0||v>=7&&v<=12));}
});
