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
test('ordinary selectors and player form contain all sixty teams and persist independent player edits',async()=>{
 const f=independentEditorFixture(),w=f.window;await w.studioApplyProjectWithBase(structuredClone(project));assert.equal(f.applied().state.semantic.independentTeamsV1,undefined);assert.equal(f.applied().state.semantic.plusGroups,undefined);
 assert.equal(f.document.querySelectorAll('.gg-panel').length,0);assert.equal(w.activeRomProfile.teamCount,60);
 for(const id of ['teamList','playerTeamSelect','bulkTeamSelect','flagTeamSelect','uniformTeamSelect']){const options=f.nodes[id].options;assert.equal(options.length,60);assert.equal(options[54].textContent,'55 · ADIPOSOS');assert.equal(options[59].textContent,'60 · VAPOROSOS');assert.equal(options[54].disabled,undefined);}
 const before=Array.from(w.rom);w.currentTeam=54;w.currentPlayer=0;w.renderEverything();assert.equal(f.nodes.playerSelect.options.length,20);assert.equal(f.nodes.pName.value,readIndependentPlayer(model.teams[54],0).name);
 w.teams[54].players[0].name='TESTE';w.savePlayerName();w.teams[54].players[0].speed=10;w.savePlayerAttrs('speed');w.savePlusJerseyPermutation(2);
 const output=await w.studioProjectObject();assert.equal(readIndependentPlayer(output.state.semantic.independentTeamsV1.teams[54],0).name,'TESTE');assert.equal(readIndependentPlayer(output.state.semantic.independentTeamsV1.teams[54],0).skills.speed,10);assert.equal(readIndependentPlayer(output.state.semantic.independentTeamsV1.teams[54],0).number,2);
 assert.equal(w.physicalWrites,0);assert.deepEqual(Array.from(w.rom),before);
 await w.studioApplyProjectWithBase(JSON.parse(JSON.stringify(output)));assert.deepEqual(JSON.parse(JSON.stringify(w.__ISSSD_INDEPENDENT_TEAMS_EDITOR__.snapshot())),JSON.parse(JSON.stringify(output.state.semantic.independentTeamsV1)));
 const prior=w.__ISSSD_INDEPENDENT_TEAMS_EDITOR__.snapshot();await assert.rejects(w.studioApplyProjectWithBase({...project,fail:true}));assert.deepEqual(w.__ISSSD_INDEPENDENT_TEAMS_EDITOR__.snapshot(),prior);
});

test('GG team import and project export cannot reintroduce retired expansion fields',async()=>{
 const key=String.fromCharCode(103,111,115,112,101,108)+'-'+String.fromCharCode(103,111,108);const bad=structuredClone(project);bad.state.semantic.independentTeamsV1.teams[54][key]={enabled:true};bad.state.semantic.independentTeamsV1.teams[54].data.photo[key]='legacy';const f=independentEditorFixture();await f.window.studioApplyProjectWithBase(bad);const output={state:{semantic:{}}};f.window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(output);assert.equal(JSON.stringify(output).toLowerCase().includes(key),false);assert.equal(output.state.semantic.independentTeamsV1.teams[54].name,'ADIPOSOS');
});

test('GG structure always prepares the tactical bank selector even without other tactical edits',async()=>{
 const{createPlusBuildStages}=await import('../src/core/plus-build-pipeline.mjs');const stages=createPlusBuildStages({baseRom:new Uint8Array(0x200000)}),prepare=stages.find(s=>s.id==='05-tactical-infrastructure');assert.equal(!!prepare.when({}),false);assert.equal(!!prepare.when({independentTeamsV1:model}),true);
});

test('ordinary Groups organizer includes six independent slots and preserves free sixty-team swaps',async()=>{
 const f=independentEditorFixture(),w=f.window;await w.studioApplyProjectWithBase(structuredClone(project));const host=f.nodes.plusGroupCards;assert.equal(host.children.length,10);
 const first=host.querySelector('select');assert.equal(first.options.length,60);first.value='54';first.onchange();
 const output=await w.studioProjectObject();assert.equal(output.state.semantic.plusGroups.groups[0][0],54);assert.equal(output.state.semantic.plusGroups.secret[0],30);
 assert.equal(w.studioTeamsV3ReadFull().teams[59].teamName,'VAPOROSOS');assert.equal(w.studioTeamsV3ReadFull().teams[59].players.length,20);
 assert.equal(Object.keys(w.studioTeamsV3Snapshot().teams).length,54);
 const plain=structuredClone(project);delete plain.state.semantic.independentTeamsV1;plain.state.ui.teamNames=plain.state.ui.teamNames.slice(0,56);await w.studioApplyProjectWithBase(plain);assert.equal(w.TEAM_COUNT,56);assert.equal(w.activeRomProfile.teamCount,56);assert.equal(f.nodes.playerTeamSelect.options.length,56);
});

test('ordinary player and team exports retain independent records and uniform/appearance edits remain isolated',async()=>{
 const f=independentEditorFixture(),w=f.window;await w.studioApplyProjectWithBase(structuredClone(project));
 const core=w.__ISSSD_UNIFIED_TEAM_CORE__,original=JSON.parse(JSON.stringify(core.team(54))),other=JSON.parse(JSON.stringify(core.team(55)));
 const kit=Array(9).fill(0x1234);core.setKitColors(54,0,kit);assert.deepEqual(JSON.parse(JSON.stringify(core.team(54).data.attributes)),original.data.attributes);assert.deepEqual(JSON.parse(JSON.stringify(core.team(55))),other);
 const keeper=core.keeperColors(54,1);keeper[8]=0x4321;core.setKeeperColors(54,1,keeper);assert.equal(core.keeperColors(54,12)[8],original.data.keeperPalettes[11][8]);
 const exported=w.playerTransferObject(54,0);assert.equal(exported.player.rawName.length,8);assert.equal(exported.player.rawPlayerRecord.length,7);
 const team=w.teamTransferObject(54);assert.equal(team.team.independentTeamV1.name,'ADIPOSOS');assert.deepEqual(JSON.parse(JSON.stringify(team.team.independentTeamV1.data)),JSON.parse(JSON.stringify(core.team(54).data)));
 const groups=core.exportGroups();assert.equal(groups.secret.length,6);assert.equal(groups.teamNames[59],'VAPOROSOS');assert.equal(w.physicalWrites,0);
});

test('own shirt pixels round-trip all eight frames and canonical UI names replace the two retired native identities',async()=>{
 const{independentPatternPixels,editIndependentPattern}=await import('../src/core/independent-team-fields.mjs');
 const t=model.teams[54],pixels=independentPatternPixels(t);assert.equal(pixels.length,512);pixels[511]=15;const next=editIndependentPattern(t,pixels);assert.deepEqual(independentPatternPixels(next),pixels);assert.deepEqual(next.data.attributes,t.data.attributes);assert.deepEqual(next.data.palettes,t.data.palettes);
 assert.equal(project.state.ui.teamNames.length,60);assert.deepEqual(project.state.ui.teamNames.slice(54),GG_DEFAULT_IDENTITIES.map(t=>t.name));assert.equal(project.state.semantic.teamNamesV1.values[54],undefined);assert.equal(project.state.semantic.teamNamesV1.values[55],undefined);
});

test('a deferred module replacing the finalizer cannot drop independent records or GG groups from downloaded JSON',async()=>{
 const f=independentEditorFixture(),w=f.window;await w.studioApplyProjectWithBase(structuredClone(project));
 // visual-bridge-overrides.mjs installs its finalizer as a deferred module,
 // after classic scripts: reproduce that replacement, not just initial order.
 w.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=p=>{p.state.semantic.deferredModule=true;return p;};
 const output=await w.studioProjectObject();assert.equal(Object.keys(output.state.semantic.independentTeamsV1.teams).length,6);assert.deepEqual(JSON.parse(JSON.stringify(output.state.semantic.plusGroups.secret)),[54,55,56,57,58,59]);
 const filtered=structuredClone(output);delete filtered.state.semantic.independentTeamsV1;delete filtered.state.semantic.plusGroups;
 const disk=JSON.parse(w.studioProjectStringify(filtered));assert.equal(Object.keys(disk.state.semantic.independentTeamsV1.teams).length,6);assert.equal(disk.state.semantic.plusGroups.labels[9],'GG');
 assert.equal(disk.state.semantic.deferredModule,true);
});

test('labels-only projects recover before import and cannot silently build or serialize without records',async()=>{
 const{independentTeamLabelsNeedRecovery}=await import('../src/core/independent-teams.mjs');
 const broken=structuredClone(project);delete broken.state.semantic.independentTeamsV1;broken.state.semantic.plusGroups.secret=[55,54,-1,-1,-1,-1];broken.state.semantic.plusGroups.labels[9]='ALL STARS';
 assert.equal(independentTeamLabelsNeedRecovery(broken),true);assert.throws(()=>canonicalProjectSemantic(broken),/registros independentes/);
 const f=independentEditorFixture(),w=f.window;assert.throws(()=>w.studioProjectStringify(broken),/Projeto incompleto/);let called=0;
 w.fetch=async(url,request)=>{assert.equal(url,'/__isssd/recover-independent-teams');assert.equal(JSON.parse(request.body).project.state.semantic.independentTeamsV1,undefined);called++;return{ok:true,json:async()=>({project:structuredClone(project),recoveredTeams:6})};};
 await w.studioApplyProjectWithBase(broken);assert.equal(called,1);assert.equal(w.TEAM_COUNT,60);const saved=await w.studioProjectObject();assert.equal(saved.state.semantic.plusGroups.labels[9],'GG');assert.equal(Object.keys(saved.state.semantic.independentTeamsV1.teams).length,6);
});

test('recovered supplied project has six native snapshots and approved flags, retaining its normal groups and sparse national edits',()=>{
 const value=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto-recuperado.issdproj',import.meta.url),'utf8')),sem=value.state.semantic;
 assert.equal(Object.keys(sem.teamsV1.teams).length,54);assert.equal(sem.teamsV1.teams[30].players[0].custom.name,'Taffarel');assert.equal(sem.teamsV1.teams[30].players[0].custom.skills.energy,7);
 assert.deepEqual(sem.plusGroups.groups[0],[30,31,32,35,40,39]);assert.deepEqual(sem.plusGroups.secret,[54,55,56,57,58,59]);assert.equal(sem.plusGroups.labels[9],'GG');assert.equal(new Set([...sem.plusGroups.groups.flat(),...sem.plusGroups.secret]).size,60);
 const refs=JSON.parse(fs.readFileSync(new URL('../assets/team-flags/gg-flags.json',import.meta.url),'utf8'));
 for(const[id,ref]of Object.entries(refs.teams))for(const part of ['selectionFlags','fieldFlags'])assert.deepEqual(independentFlagPixels(sem.independentTeamsV1.teams[id],part),ref.pixels);
 assert.deepEqual(canonicalProjectSemantic(value).independentTeamsV1,validateIndependentTeams(sem.independentTeamsV1));
});

test('recovered GG rosters populate ordinary player controls and survive project round trip',async()=>{
 const saved=JSON.parse(fs.readFileSync(new URL('../project-data/recovered-gg-rosters.json',import.meta.url))),f=independentEditorFixture(),w=f.window;
 await w.studioApplyProjectWithBase(structuredClone(project));
 for(const[id,row]of Object.entries(saved.teams)){
  w.currentTeam=Number(id);w.currentPlayer=0;w.renderEverything();
  assert.deepEqual(Array.from(w.studioTeamsV3ReadFull().teams[id].players,p=>p.name),row.rom);
  assert.equal(f.nodes.pName.value,row.rom[0]);assert.equal(f.nodes.playerSelect.options.length,20);
 }
 const exported=await w.studioProjectObject();await w.studioApplyProjectWithBase(structuredClone(exported));
 for(const[id,row]of Object.entries(saved.teams))assert.deepEqual(Array.from(w.studioTeamsV3ReadFull().teams[id].players,p=>p.name),row.rom);
});
