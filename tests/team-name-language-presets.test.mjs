import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TEAM_NAME_LANGUAGE_PRESETS as entries} from '../src/core/team-name-presets.mjs';
const code=fs.readFileSync(new URL('../editor-src/team-name-language-presets.mjs',import.meta.url),'utf8');
test('Portuguese team name suggestions keep all 56 Plus identities and offer compact names',()=>{
 const context={window:{},document:{readyState:'loading',addEventListener(){}},TEAM_NAME_LANGUAGE_PRESETS:entries};vm.runInNewContext(code,context);
 const api=context.window.__ISSSD_TEAM_NAME_LANGUAGES__;
 assert.deepEqual(entries.map(e=>e.teamId),Array.from({length:56},(_,i)=>i));
 assert.equal(api.preset(21),'TURQUIA');assert.equal(api.preset(26),'ARÁBIA SAUDITA');assert.equal(api.preset(30),'BRASIL');assert.equal(api.preset(53),'IRLANDA DO NORTE');assert.equal(api.preset(53,'portuguese',true),'IRLANDA N');assert.equal(api.preset(30,'english'),'BRAZIL');assert.equal(api.preset(56),null);
});
test('choosing and reopening names persists both representations without ROM writes',()=>{
 const full={value:'MEU TIME'},short={value:'MEU'},status={textContent:''};
 const nodes={teamNameFull:full,teamNameShort:short,teamNameLanguageStatus:status};
 const context={window:{currentTeam:8,activeRomProfile:{id:'iss-deluxe-plus'},TEAM_NAMES:Array(56).fill('BASE')},document:{readyState:'loading',addEventListener(){},getElementById(id){return nodes[id]}},TEAM_NAME_LANGUAGE_PRESETS:entries};vm.runInNewContext(code,context);
 const api=context.window.__ISSSD_TEAM_NAME_LANGUAGES__;
 api.fill('portuguese');assert.equal(full.value,'ALEMANHA');assert.equal(short.value,'ALEMANHA');assert.equal(context.window.TEAM_NAMES[8],'ALEMANHA');assert.equal(context.window.TEAM_NAMES[30],'BASE');
 const project={state:{semantic:{plusGroups:{labels:['MEU GRUPO']}}}};api.finalize(project);assert.equal(project.state.semantic.teamNamesV1.values['8'].full,'ALEMANHA');
 api.hydrate(project);const reopened={state:{semantic:{}}};api.finalize(reopened);assert.deepEqual(reopened.state.semantic.teamNamesV1,project.state.semantic.teamNamesV1);assert.equal(project.state.semantic.plusGroups.labels[0],'MEU GRUPO');
});
