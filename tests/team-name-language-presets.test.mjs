import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const entries=JSON.parse(fs.readFileSync(new URL('../project-data/team-name-language-presets.json',import.meta.url)));
const code=fs.readFileSync(new URL('../editor-src/team-name-language-presets.mjs',import.meta.url),'utf8');
test('Portuguese team name suggestions keep all 56 Plus identities and offer compact names',()=>{
 const context={window:{},document:{readyState:'loading',addEventListener(){}},TEAM_NAME_LANGUAGE_PRESETS:entries};vm.runInNewContext(code,context);
 const api=context.window.__ISSSD_TEAM_NAME_LANGUAGES__;
 assert.deepEqual(entries.map(e=>e.teamId),Array.from({length:56},(_,i)=>i));
 assert.equal(api.preset(21),'TURQUIA');assert.equal(api.preset(26),'ARÁBIA SAUDITA');assert.equal(api.preset(30),'BRASIL');assert.equal(api.preset(53),'IRLANDA DO NORTE');assert.equal(api.preset(53,'portuguese',true),'IRLANDA N');assert.equal(api.preset(30,'english'),'BRAZIL');assert.equal(api.preset(56),null);
});
test('choosing a suggestion fills only the selected name without applying ROM changes',()=>{
 const input={value:'MEU TIME',dispatchEvent(){}},status={textContent:''};let previews=0;
 const nodes={teamReferenceName:input,teamNameLanguageStatus:status,teamNamePortugueseCompact:{checked:false},teamGfxGenerateBtn:{click(){previews++;}}};
 const context={Event:class{},window:{currentTeam:8},document:{readyState:'loading',addEventListener(){},getElementById(id){return nodes[id]}},TEAM_NAME_LANGUAGE_PRESETS:entries};vm.runInNewContext(code,context);
 context.window.__ISSSD_TEAM_NAME_LANGUAGES__.fill('portuguese');assert.equal(input.value,'ALEMANHA');assert.equal(previews,1);assert.match(status.textContent,/Revise/);
});
