import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {DELUXE_FORMATIONS,deluxeFormationPreset,moveDeluxeTacticalPlayers,deluxeTacticalRecord,createDeluxeTactics,setDeluxeTeamTactics,extractReferenceTactics} from '../src/core/deluxe-tactics.mjs';
import {decodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,referencePath=process.env.ISSSD_GG_ROM,projectPath=process.env.ISSSD_GG_RECOVERED_PROJECT;
test('formation presets reuse Plus encoding and group movement respects role boundaries',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,project={changes:{}},raw=deluxeTacticalRecord(base,project,0);
 for(let i=0;i<16;i++){const preset=deluxeFormationPreset(raw,i),counts=['DF','MC','AT'].map(c=>preset.players.filter(p=>p.className===c).length);assert.equal(counts.join('-'),DELUXE_FORMATIONS[i]);assert.equal(preset.players.length,10);assert.ok(preset.players.every(p=>!p.attack));}
 const a=deluxeFormationPreset(raw,1),snapshot=structuredClone(a),b=moveDeluxeTacticalPlayers(a,[0,1],999,-999);assert.deepEqual(a,snapshot);assert.equal(b.players[0].x-b.players[1].x,a.players[0].x-a.players[1].x);assert.equal(b.players[0].y-b.players[1].y,a.players[0].y-a.players[1].y);assert.ok(b.players[0].x<=-18&&b.players[0].y>=-39);
});
test('an edit individualizes every native team without changing other teams or player attributes',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,project=await createDeluxeProject(file),old=deluxeTacticalRecord(base,project,1),state=deluxeFormationPreset(deluxeTacticalRecord(base,project,0),2);state.players[0].attack=true;
 const next=setDeluxeTeamTactics(base,project,0,state);assert.equal(project.changes.tactics,undefined);assert.equal(Object.keys(next.changes.tactics.sourceRecords).length,36);assert.deepEqual(deluxeTacticalRecord(base,next,1),old);
 const built=await buildDeluxeProject(file,JSON.parse(JSON.stringify(next))),out=built.rom.slice(built.base.headerSize);assert.equal(out.length,0x400000);assert.equal(out[0x2aaaf],0xc8);assert.equal(out[0x2aac5],0xc8);assert.deepEqual(out.slice(0x243000,0x24301f),deluxeTacticalRecord(base,next,0));assert.deepEqual(out.slice(0x50000,0x50000+43*140),base.slice(0x50000,0x50000+43*140));assert.deepEqual(out.slice(0x243020,0x24303f),old);
 const bad=structuredClone(state);bad.players[0].x=999;assert.throws(()=>setDeluxeTeamTactics(base,project,0,bad),/must be/);assert.deepEqual((await buildDeluxeProject(file,project)).rom,file);
});
test('sixty reference tactics survive save, export, team edits and GG isolation',{skip:![fixture,referencePath,projectPath].every(Boolean)},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,reference=new Uint8Array(fs.readFileSync(referencePath)),project=JSON.parse(fs.readFileSync(projectPath)),before=structuredClone(project);project.changes.tactics=extractReferenceTactics(reference,project.changes.structure);assert.equal(Object.keys(project.changes.tactics.sourceRecords).length,60);
 const built=await buildDeluxeProject(file,JSON.parse(JSON.stringify(project))),out=built.rom.slice(built.base.headerSize);for(let i=0;i<60;i++)assert.deepEqual(Array.from(out.slice(0x243000+i*32,0x243000+i*32+31)),project.changes.tactics.sourceRecords[i]);
 const state=decodePlusTacticalRecord(deluxeTacticalRecord(base,project,54));state.players[0].x++;state.players[0].attack=!state.players[0].attack;const next=setDeluxeTeamTactics(base,project,54,state);assert.deepEqual(deluxeTacticalRecord(base,next,55),deluxeTacticalRecord(base,project,55));assert.deepEqual(next.changes.players,before.changes.players);assert.deepEqual(next.changes.structure,before.changes.structure);assert.deepEqual(next.changes.teamPhotos,before.changes.teamPhotos);await buildDeluxeProject(file,next);
});

test('Plus field UI synchronizes selection, roster swaps and position swaps',{skip:!process.env.ISSSD_DELUXE_ROM},async()=>{
 const {installTacticsEditor}=await import('../deluxe-editor/tactics-editor.mjs'),fs=await import('node:fs');
 const {createDeluxeProject,splitRom}=await import('../src/core/deluxe-project.mjs'),{readDeluxePlayer}=await import('../src/core/deluxe-players.mjs');
 const file=new Uint8Array(fs.readFileSync(process.env.ISSSD_DELUXE_ROM)),base=splitRom(file).rom;let project=await createDeluxeProject(file);
 class El{constructor(){this.value='';this.children=[];this.style={};this.events={};}append(...e){this.children.push(...e);}replaceChildren(...e){this.children=e;}setAttribute(k,v){this[k]=v;}addEventListener(k,v){this.events[k]=v;}}
 const ids=Object.fromEntries(['tacticsCanvas','tacticsTeam','tacticsFormation','tacticsPreset','tacticsIndividualize','tacticsReset','tacticsStatus','tacticsPlayers','tacticsSwapField','tacticsSwapPlayers'].map(k=>[k,new El()])),old=globalThis.document;
 globalThis.document={getElementById:id=>ids[id],createElement:()=>new El()};
 try{
  installTacticsEditor({getProject:()=>project,setProject:p=>project=p,getFile:()=>file,onStatus:()=>{}});
  assert.equal(ids.tacticsCanvas.children.length,11);assert.equal(ids.tacticsSwapPlayers.disabled,true);
  const p1=readDeluxePlayer(base,0,1),p2=readDeluxePlayer(base,0,2),before=deluxeTacticalRecord(base,project,0);
  const second=ids.tacticsPlayers.children[1].children[0];second.checked=true;second.onchange();assert.equal(ids.tacticsSwapPlayers.disabled,false);
  ids.tacticsSwapPlayers.onclick();assert.equal(project.changes.players['0:1'].name,p2.name);assert.equal(project.changes.players['0:2'].jersey,p1.jersey);assert.deepEqual(deluxeTacticalRecord(base,project,0),before);
  const original=decodePlusTacticalRecord(before),a=original.players[0],b=original.players[1];
  ids.tacticsSwapField.onclick();const after=decodePlusTacticalRecord(deluxeTacticalRecord(base,project,0));assert.equal(after.players[0].x,b.x);assert.equal(after.players[0].y,b.y);assert.equal(after.players[1].y,a.y);
 }finally{globalThis.document=old;}
});
