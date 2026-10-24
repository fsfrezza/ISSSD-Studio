import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';
import{stripRetiredTeamExpansion as clean,isRetiredTeamExpansion as retired}from'../src/core/retired-team-expansion.mjs';
import{canonicalProjectSemantic}from'../src/core/project-semantic.mjs';import{projectDocumentFromCanonical}from'../src/core/project-serialize.mjs';
import{stripRetiredExpansionScript,stripRetiredExpansionHtml}from'../scripts/lib/retired-expansion-editor.mjs';
const word=String.fromCharCode(71,79,83,80,69,76),label=word+'-GOL',key='plus'+word[0]+word.slice(1).toLowerCase()+'Gol';
test('retired extension migrates out of project/team envelopes, notes and nested JSON without changing real teams',()=>{
 const teams={schema:'isssd-teams-v1',version:3,teams:{30:{players:[{slot:1,custom:{name:'Taffarel',skills:{speed:8}}}]}}},input={state:{semantic:{[key]:{enabled:false,label,teams:[{id:56,name:'old'}]},teamsV1:teams,extra:JSON.stringify({[key]:{},keep:2})}},notes:[label+' desativado','Nota útil'],[key]:true},before=JSON.stringify(input),out=clean(input);
 assert.equal(retired(JSON.stringify(out)),false);assert.deepEqual(out.state.semantic.teamsV1,teams);assert.deepEqual(out.notes,['Nota útil']);assert.deepEqual(JSON.parse(out.state.semantic.extra),{keep:2});assert.equal(JSON.stringify(input),before);assert.deepEqual(clean(out),out);assert.equal(canonicalProjectSemantic(input)[key],undefined);
 const serialized=projectDocumentFromCanonical({targetLength:0x200000,patches:[],semantic:input.state.semantic});assert.equal(retired(JSON.stringify(serialized)),false);
});
test('generated Editor loses obsolete controls, declarations and export fields, preserving unrelated logic and valid JavaScript',()=>{
 const fn='restore'+word[0]+word.slice(1).toLowerCase()+'Gol';
 const code=`let ${key}={enabled:false};function ${fn}(){throw Error('unused')};function snapshot(){return{teams:{30:{name:'Brasil'}},${key}:${key},notes:['${label} desativado','keep']}}function restore(p){if(p.${key}){${fn}()}else{globalThis.kept=true;}globalThis.snapshot=snapshot();}restore({});`;
 const output=stripRetiredExpansionScript(code);assert.equal(retired(output),false);const context={};vm.runInNewContext(output,context);assert.equal(context.kept,true);assert.equal(context.snapshot.teams[30].name,'Brasil');assert.equal(context.snapshot[key],undefined);assert.deepEqual(Array.from(context.snapshot.notes),['keep']);
 const html=`<!doctype html><html><head></head><body><section id="groups"><div class="card"><h3>Adicionar ${label}</h3><button id="${key}">Adicionar ${label} ao projeto</button></div><div class="card" id="ordinary"><h3>Grupos</h3><input value="AMERICA"></div></section><script>${code}</script></body></html>`;
 const result=stripRetiredExpansionHtml(html);assert.equal(retired(result),false);assert.ok(!result.includes('Adicionar'));assert.ok(result.includes('id="ordinary"'));assert.ok(result.includes('AMERICA'));assert.ok(result.includes('id="groups"'));new vm.Script(result.match(/<script>([\s\S]*?)<\/script>/)[1]);
});
test('obsolete HTML injected by strings and templates is removed without losing adjacent cards or expressions',()=>{
 for(const source of[`const t='<div class="card"><h3>${label}</h3><button>Adicionar</button></div><p>Keep</p>';globalThis.out=t;`,`const t=\`<div class="card"><h3>${label}</h3><button>Adicionar</button></div><p>\${1+2}</p>\`;globalThis.out=t;`]){const code=stripRetiredExpansionScript(source),context={};vm.runInNewContext(code,context);assert.equal(retired(code),false);assert.equal(context.out.includes('Adicionar'),false);assert.ok(context.out.includes('<p>'));}
});
test('final export boundary cleans project, teams and Blob JSON while binary ROM downloads remain byte-exact',async()=>{
 const calls=[],context={window:{ISSSDRetiredExpansion:{stripRetiredTeamExpansion:clean}},TextDecoder,TextEncoder,Blob,File,studioImportProject:async f=>JSON.parse(await f.text()),studioDownloadFile:(...args)=>calls.push(args),studioProjectObject:async()=>({state:{semantic:{[key]:{},keep:1}}}),studioCollectTeamsV1:()=>({teams:{30:{}},[key]:{}})};
 vm.runInNewContext(fs.readFileSync('editor-src/retired-expansion-boundaries.mjs','utf8'),context);assert.equal(retired(JSON.stringify(await context.studioProjectObject())),false);assert.equal(retired(JSON.stringify(context.studioCollectTeamsV1())),false);
 const json=JSON.stringify({teams:{30:{name:'Brasil'}},[key]:{enabled:true}});assert.equal(retired(JSON.stringify(await context.studioImportProject(new File([json],'old.issdproj')))),false);context.studioDownloadFile(new TextEncoder().encode(json),'teams.json','application/json');await context.studioDownloadFile(new Blob([json]),'test.issdproj','application/json');for(const call of calls){assert.equal(retired(new TextDecoder().decode(call[0])),false);assert.equal(JSON.parse(new TextDecoder().decode(call[0])).teams[30].name,'Brasil');}const binary=Uint8Array.of(0,255,17);context.studioDownloadFile(binary,'game.sfc','application/octet-stream');assert.equal(calls.at(-1)[0],binary);
});
test('canonical project is free of retired labels and export state',()=>{const raw=fs.readFileSync('International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj','utf8');assert.equal(retired(raw),false);assert.equal(Object.keys(JSON.parse(raw).state.semantic.teamsV1.teams).length,56);});

test('generic future GG group data is preserved; removing obsolete state does not remove custom teams',()=>{
 const value={groups:[{label:'GG',teams:[54,55,56,57,58,59]}],teams:{56:{name:'Nova',sourceTeam:30,players:[{name:'Novo jogador'}]}},[key]:{}};const expected=structuredClone(value);delete expected[key];assert.deepEqual(clean(value),expected);
});

test('capacity audit distinguishes reusable secret slots from six linked special rosters and detects the empty-code collision',async()=>{
 const{auditNewTeamCapacity}=await import('../scripts/audit-new-team-capacity.mjs');const b=new Uint8Array(0x200000);b.set([0x6E,0x6C,0x70,0x70,0x70,0x70],0xE828);[0xF64F,0xF69F,0xF6EF,0xF73F,0xF78F,0xF7DF].forEach((p,i)=>b.set([p&255,p>>8],0x127643+i*2));const before=b.slice(),r=auditNewTeamCapacity(b);assert.equal(r.status,'analysis-only');assert.deepEqual(r.options.map(x=>[x.newIndependentTeams,x.totalTeams]),[[4,60],[6,62]]);assert.equal(r.blockers[0].emptyByte,r.blockers[0].firstNewEngineByte);assert.equal(r.blockers[1].independentPlayerBanks,false);assert.deepEqual(b,before);b[0xE82A]=0x72;assert.throws(()=>auditNewTeamCapacity(b),/Grupo secreto/);
});

test('cleanup preserves the private Editor IIFE and shared callees when retired code is nested inside',()=>{
 const marker='/* isssd-team-semantic-overlay-v1 */';
 for(const wrap of [body=>`(()=>{${body}})();`,body=>`(function(){${body}})();`,body=>`if((()=>{${body};return true;})()){globalThis.entered=true;}`]){
  const source=wrap(`'use strict';let ${key}={enabled:false};function restore${word}Gol(){};${marker}\nfunction plusTacSwapSelectedPlayers(){return 42;}globalThis.answer=plusTacSwapSelectedPlayers();globalThis.snapshot={keep:1,${key}:${key}};`);
  const output=stripRetiredExpansionScript(source),context={};
  assert.equal(retired(output),false);assert.ok(output.includes(marker));assert.ok(output.includes('function plusTacSwapSelectedPlayers'));
  vm.runInNewContext(output,context);assert.equal(context.answer,42);assert.equal(context.snapshot.keep,1);assert.equal(context.snapshot[key],undefined);
 }
});

test('shared native group and team exports lose retired branches and spreads without dangling calls',()=>{
 const alias=word.toLowerCase(),source=`(()=>{const nativeTeams=[1,2];const ${alias}=[];const values=[...nativeTeams,...${alias}];const labels=is${word}GolActive()?['old']:['native'];const message='native'+${alias};globalThis.result={values,labels,message};})();`;
 const output=stripRetiredExpansionScript(source),context={};new vm.Script(output);vm.runInNewContext(output,context);
 assert.equal(retired(output),false);assert.equal(output.includes('undefined()'),false);assert.equal(output.includes('...undefined'),false);assert.deepEqual(JSON.parse(JSON.stringify(context.result)),{values:[1,2],labels:['native'],message:'native'});
});
