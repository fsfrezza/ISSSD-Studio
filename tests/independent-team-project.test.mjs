import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{GG_DEFAULT_IDENTITIES,validateIndependentTeams}from'../src/core/independent-teams.mjs';
import{readIndependentPlayer,editIndependentPlayer,independentFlagPixels,editIndependentFlag,editIndependentPalette,readIndependentFormation,editIndependentFormation}from'../src/core/independent-team-fields.mjs';
import{canonicalProjectSemantic}from'../src/core/project-semantic.mjs';
import{independentEditorFixture}from'./independent-teams-editor-fixture.mjs';
const project=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url),'utf8')),model=project.state.semantic.independentTeamsV1;
test('canonical project contains six complete independent GG teams and sixty unique group entries',()=>{
 assert.ok(model);const value=validateIndependentTeams(model);assert.deepEqual(Object.values(value.teams).map(t=>[t.name,t.short,t.colors.primary,t.colors.secondary]),GG_DEFAULT_IDENTITIES.map(t=>[t.name,t.short,t.primary,t.secondary]));
 const groups=project.state.semantic.plusGroups;assert.equal(groups.labels[9],'GG');assert.deepEqual(groups.secret,[54,55,56,57,58,59]);assert.equal(new Set([...groups.groups.flat(),...groups.secret]).size,60);assert.deepEqual(canonicalProjectSemantic(project).independentTeamsV1,value);
});
test('GG edits survive JSON reopen and touch only selected independent fields',()=>{
 const before=structuredClone(model),t=model.teams[56],p=readIndependentPlayer(t,1),changed=editIndependentPlayer(t,1,{name:'Novo',hair:0,palette:1,skills:{speed:10}});assert.equal(readIndependentPlayer(changed,1).name,'Novo');assert.equal(readIndependentPlayer(changed,1).hair,0);assert.equal(readIndependentPlayer(changed,1).skills.speed,10);assert.equal(readIndependentPlayer(changed,1).skills.shot,p.skills.shot);assert.deepEqual(changed.data.palettes,t.data.palettes);assert.deepEqual(changed.data.keeperPalettes,t.data.keeperPalettes);
 const next=structuredClone(model);next.teams[56]=changed;assert.deepEqual(validateIndependentTeams(JSON.parse(JSON.stringify(next))),next);assert.deepEqual(model,before);assert.deepEqual(next.teams[54],model.teams[54]);
 const flag=independentFlagPixels(t),edited=flag.slice();edited[200]=(edited[200]+1)%4;const f=editIndependentFlag(t,edited);assert.deepEqual(independentFlagPixels(f),edited);assert.deepEqual(f.data.fieldFlags,t.data.fieldFlags);assert.deepEqual(f.data.palettes,t.data.palettes);
 const uniform=editIndependentPalette(t,'home',7,0x1234);assert.deepEqual(uniform.data.attributes,t.data.attributes);assert.deepEqual(uniform.data.palettes.away,t.data.palettes.away);assert.deepEqual(uniform.data.selectionFlags,t.data.selectionFlags);
 const form=readIndependentFormation(t),q=form.players[0];const formation=editIndependentFormation(t,{players:[{...q,y:q.y===39?38:q.y+1}]});assert.notDeepEqual(formation.data.tactics,t.data.tactics);assert.deepEqual(formation.data.names,t.data.names);assert.deepEqual(formation.data.attributes,t.data.attributes);
});
test('GG jersey numbers remain unique and malformed edits fail before mutating a team',()=>{
 const t=model.teams[54],before=structuredClone(t),old=readIndependentPlayer(t,1).number,target=readIndependentPlayer(t,2).number,next=editIndependentPlayer(t,1,{number:target});assert.equal(readIndependentPlayer(next,2).number,old);assert.equal(new Set(Array.from({length:20},(_,i)=>readIndependentPlayer(next,i).number)).size,20);
 assert.throws(()=>editIndependentPlayer(t,0,{hair:16}));assert.throws(()=>editIndependentPlayer(t,0,{skills:{speed:11}}));assert.throws(()=>editIndependentFlag(t,Array(384).fill(16)));assert.throws(()=>editIndependentPlayer(t,0,{name:'Muito grande'}));assert.deepEqual(t,before);
});
test('Editor hydrates all six panels and saves GG project state without sending expanded IDs to legacy group hydration',async()=>{
 const f=independentEditorFixture(),w=f.window;await w.studioApplyProjectWithBase(structuredClone(project));assert.equal(f.applied().state.semantic.independentTeamsV1,undefined);assert.equal(f.applied().state.semantic.plusGroups,undefined);
 assert.equal(f.document.querySelectorAll('.gg-panel').filter(p=>!p.hidden).length,6);
 const players=f.pages['page-players'].querySelector('.gg-body'),name=players.querySelectorAll('input').find(i=>i.maxLength===8);name.value='TESTE';name.onchange();
 const identity=f.pages['page-teams'].querySelector('.gg-body'),big=identity.querySelectorAll('input').find(i=>i.maxLength===12&&i.value==='ADIPOSOS');big.value='ADI TESTE';big.onchange();
 const output={state:{semantic:{}}};w.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(output);assert.equal(readIndependentPlayer(output.state.semantic.independentTeamsV1.teams[54],0).name,'TESTE');assert.equal(output.state.semantic.independentTeamsV1.teams[54].name,'ADI TESTE');assert.deepEqual(output.state.semantic.plusGroups,project.state.semantic.plusGroups);
 await w.studioApplyProjectWithBase(JSON.parse(JSON.stringify(output)));const again={state:{semantic:{}}};w.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(again);assert.deepEqual(JSON.parse(JSON.stringify(again)),JSON.parse(JSON.stringify(output)));
 const prior=w.__ISSSD_INDEPENDENT_TEAMS_EDITOR__.snapshot();await assert.rejects(w.studioApplyProjectWithBase({...project,fail:true}));assert.deepEqual(w.__ISSSD_INDEPENDENT_TEAMS_EDITOR__.snapshot(),prior);
});

test('GG team import and project export cannot reintroduce retired expansion fields',async()=>{
 const key=String.fromCharCode(103,111,115,112,101,108)+'-'+String.fromCharCode(103,111,108);const bad=structuredClone(project);bad.state.semantic.independentTeamsV1.teams[54][key]={enabled:true};bad.state.semantic.independentTeamsV1.teams[54].data.photo[key]='legacy';const f=independentEditorFixture();await f.window.studioApplyProjectWithBase(bad);const output={state:{semantic:{}}};f.window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(output);assert.equal(JSON.stringify(output).toLowerCase().includes(key),false);assert.equal(output.state.semantic.independentTeamsV1.teams[54].name,'ADIPOSOS');
});

test('GG structure always prepares the tactical bank selector even without other tactical edits',async()=>{
 const{createPlusBuildStages}=await import('../src/core/plus-build-pipeline.mjs');const stages=createPlusBuildStages({baseRom:new Uint8Array(0x200000)}),prepare=stages.find(s=>s.id==='05-tactical-infrastructure');assert.equal(!!prepare.when({}),false);assert.equal(!!prepare.when({independentTeamsV1:model}),true);
});

test('actual legacy page layout places GG groups in Groups and formations in Teams, preserving free sixty-team swaps',async()=>{
 const f=independentEditorFixture({withoutFormationPage:true}),w=f.window;await w.studioApplyProjectWithBase(structuredClone(project));
 assert.equal(f.pages['page-teams'].querySelectorAll('.gg-panel').length,2);
 const page=f.pages['page-groups'],body=page.querySelector('.gg-body');assert.ok(page.textContent.includes('Organização dos dez grupos'));
 assert.ok(f.document.body.className.includes('gg-independent-active'));
 const first=body.querySelector('select');assert.equal(first.options.length,60);first.value='54';first.onchange();
 const output=await w.studioProjectObject();assert.equal(output.state.semantic.plusGroups.groups[0][0],54);assert.equal(output.state.semantic.plusGroups.secret[0],30);
 const plain=structuredClone(project);delete plain.state.semantic.independentTeamsV1;await w.studioApplyProjectWithBase(plain);assert.equal(f.document.body.className.includes('gg-independent-active'),false);
});
