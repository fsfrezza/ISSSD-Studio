import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateTeamFlags,flagPixelsToStreams,TEAM_FLAGS_SCHEMA} from '../src/core/team-flags.mjs';
import {independentFlagPixels} from '../src/core/independent-team-fields.mjs';
import {independentEditorFixture} from './independent-teams-editor-fixture.mjs';
const project=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto-recuperado.issdproj',import.meta.url)));
const flag=()=>({colors:[0,31,992,31744],selectionPixels:Array.from({length:384},(_,i)=>12+i%4),fieldPixels:Array.from({length:384},(_,i)=>15-i%4)});
test('all 54 native flag edits validate independently, without changing source arrays',()=>{const state={schema:TEAM_FLAGS_SCHEMA,teams:Object.fromEntries(Array.from({length:54},(_,i)=>[i,flag()]))},copy=validateTeamFlags(state);copy.teams[53].colors[0]=31;copy.teams[36].selectionPixels[0]=15;assert.equal(state.teams[53].colors[0],0);assert.equal(state.teams[36].selectionPixels[0],12);for(const [id,key,value] of [['54','colors',[1,2,3,4]],['36','selectionPixels',[12]],['0','colors',[0,0,0,32768]]]){const bad=structuredClone(state);bad.teams[id]??=flag();bad.teams[id][key]=value;assert.throws(()=>validateTeamFlags(bad),/Bandeiras/);}});
test('native flags encode both 24x8 halves with every pixel and tile boundary intact',()=>{for(const part of ['selectionPixels','fieldPixels']){const p=flag()[part],halves=flagPixelsToStreams(p);assert.deepEqual(halves.map(h=>h.bytes.length),[96,96]);assert.deepEqual(independentFlagPixels({data:{fieldFlags:halves}},'fieldFlags'),p);}});
test('normal flag overrides and independent GG pixels survive deferred finalizers and project reopen',async()=>{const f=independentEditorFixture(),w=f.window,p=structuredClone(project);p.state.semantic.teamFlagsV1={schema:TEAM_FLAGS_SCHEMA,teams:{36:flag(),53:flag()}};await w.studioApplyProjectWithBase(p);w.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=v=>v;const saved=JSON.parse(w.studioProjectStringify(await w.studioProjectObject()));assert.deepEqual(saved.state.semantic.teamFlagsV1,p.state.semantic.teamFlagsV1);await w.studioApplyProjectWithBase(saved);assert.deepEqual(JSON.parse(JSON.stringify(w.__ISSSD_ALL_FLAGS_EDITOR__.snapshot())),p.state.semantic.teamFlagsV1);assert.equal(w.physicalWrites,0);});

test('image conversion preserves four exact SNES colors and transparent pixels through both native flag streams',async()=>{
 const {rgbaToTeamFlag}=await import('../src/core/team-flags.mjs');const rgba=new Uint8Array(1536),rgb=[[255,0,0],[0,255,0],[0,0,255],[0,0,0]];
 for(let i=0;i<384;i++){rgba.set([...rgb[i%4],i%5?255:0],i*4);}const before=rgba.slice(),v=rgbaToTeamFlag(rgba);
 assert.deepEqual(rgba,before);assert.deepEqual(new Set(v.colors),new Set([31,992,31744,0]));assert.equal(v.pixels.filter(p=>p===0).length,77);
 const stable=(await import('../src/core/field-flag-colors.mjs')).stableFieldFlag(v.pixels,v.colors);assert.equal(stable.pixels.filter(p=>p===0).length,77);
 for(const pixels of [v.pixels,stable.pixels])assert.deepEqual(independentFlagPixels({data:{fieldFlags:flagPixelsToStreams(pixels)}},'fieldFlags'),pixels);
});
test('image quantization is deterministic, reduces rich images to four opaque slots and can flatten transparency',async()=>{
 const {rgbaToTeamFlag}=await import('../src/core/team-flags.mjs');const rgba=Uint8ClampedArray.from({length:1536},(_,i)=>i%4===3?255:i*13%256),a=rgbaToTeamFlag(rgba);assert.deepEqual(rgbaToTeamFlag(rgba),a);assert.equal(a.colors.length,4);assert.ok(a.colors.every(v=>v>=0&&v<=32767));assert.ok(a.pixels.every(v=>v>=12&&v<=15));
 const empty=new Uint8Array(1536);assert.ok(rgbaToTeamFlag(empty).pixels.every(v=>v===0));const solid=rgbaToTeamFlag(empty,{preserveTransparency:false,background:31});assert.ok(solid.pixels.every(v=>v===12));assert.equal(solid.colors[0],31);assert.throws(()=>rgbaToTeamFlag(new Uint8Array(4)),/24/);
});
test('flag upload commits both screens, supports undo and rejects selection changes during decode',async()=>{
 const f=independentEditorFixture(),w=f.window;w.ISSSDGoalkeepers={goalkeeperBgrHex:()=> '#000000'};await w.studioApplyProjectWithBase(structuredClone(project));
 const nodes=f.nodes;nodes.allFlagTeam.onchange({target:{value:'54'}});nodes.allFlagPart.onchange({target:{value:'selectionPixels'}});nodes.allFlagBoth.checked=true;nodes.allFlagTransparency.checked=true;nodes.allFlagImageFit.value='contain';
 const rgba=new Uint8Array(1536);for(let i=0;i<384;i++)rgba.set([255,0,0,i%2?255:0],i*4);
 const create=f.document.createElement;f.document.createElement=tag=>{const n=create(tag);if(tag==='canvas')n.getContext=()=>({fillRect(){},drawImage(){},getImageData:()=>({data:rgba})});return n;};
 let closed=0;w.createImageBitmap=async()=>({width:48,height:32,close(){closed++;}});
 const before=structuredClone(w.__ISSSD_ALL_FLAGS_EDITOR__.read(54));
 await nodes.allFlagImportFile.onchange({target:{files:[{size:100}],value:'photo.png'}});
 const imported=w.__ISSSD_ALL_FLAGS_EDITOR__.read(54);assert.equal(imported.selectionPixels.filter(v=>v===0).length,192);assert.deepEqual(imported.fieldPixels,imported.selectionPixels);assert.equal(closed,1);
 nodes.allFlagUndo.onclick();assert.deepEqual(JSON.parse(JSON.stringify(w.__ISSSD_ALL_FLAGS_EDITOR__.read(54))),before);
 let release;w.createImageBitmap=()=>new Promise(resolve=>{release=resolve;});const pending=nodes.allFlagImportFile.onchange({target:{files:[{size:100}],value:'photo.png'}});nodes.allFlagTeam.onchange({target:{value:'55'}});const other=structuredClone(w.__ISSSD_ALL_FLAGS_EDITOR__.read(55));release({width:48,height:32,close(){closed++;}});await pending;assert.deepEqual(JSON.parse(JSON.stringify(w.__ISSSD_ALL_FLAGS_EDITOR__.read(54))),before);assert.deepEqual(JSON.parse(JSON.stringify(w.__ISSSD_ALL_FLAGS_EDITOR__.read(55))),other);assert.match(nodes.allFlagStatus.textContent,/mudou durante/);
});
