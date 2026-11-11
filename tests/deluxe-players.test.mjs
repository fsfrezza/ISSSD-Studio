import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {DELUXE_TEAMS,PLAYER_SKILLS,readDeluxePlayer,deluxePlayerOffsets,planDeluxeJerseySwap,applyDeluxePlayers} from '../src/core/deluxe-players.mjs';
import {decodePlayerRecord} from '../src/core/plus-player.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('Deluxe players: all 720 names and records decode with Plus codecs; native offsets differ',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom;
 for(let t=0;t<DELUXE_TEAMS.length;t++){const jerseys=[];for(let p=0;p<20;p++){const at=deluxePlayerOffsets(base,t,p),v=readDeluxePlayer(base,t,p),raw=decodePlayerRecord(base.slice(at.record,at.record+7));assert.ok(v.name.length>0&&v.name.length<=8);for(const k of Object.keys(PLAYER_SKILLS)){assert.equal(v.skills[k],raw[k]+1);assert.ok(v.skills[k]>=1&&v.skills[k]<=10);}assert.equal(v.appearanceRaw,base[at.record+6]);jerseys.push(v.jersey);}assert.equal(new Set(jerseys).size,20);}
 assert.equal(readDeluxePlayer(base,0,0).name,'Pagani');assert.equal(readDeluxePlayer(base,30,0).name,'da Silva');assert.equal(deluxePlayerOffsets(base,0,0).record,0x50000);assert.equal(deluxePlayerOffsets(base,0,0).name,0x3818e);
 assert.throws(()=>readDeluxePlayer(base,36,0),/regulares/);
});
test('Deluxe players: composed edits, centered names, jersey swap, precise writes and exact restoration',{skip:!fixture},async()=>{
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice(),base=splitRom(input).rom,project=await createDeluxeProject(input);
 let edits=planDeluxeJerseySwap(base,{},30,0,2);edits['30:0']={...edits['30:0'],name:'Teste',naturalPosition:1,skills:Object.fromEntries(Object.keys(PLAYER_SKILLS).map((k,i)=>[k,i%10+1]))};project.changes.players=edits;
 project.changes.internalTitle='DELUXE PLAYERS';const otherSlot=Array.from({length:20},(_,p)=>p).find(p=>readDeluxePlayer(base,30,p).jersey===2);const result=await buildDeluxeProject(input,JSON.parse(JSON.stringify(project))),out=splitRom(result.rom).rom,at=deluxePlayerOffsets(base,30,0),other=deluxePlayerOffsets(base,30,otherSlot);
 assert.equal(readDeluxePlayer(out,30,0).name,'Teste');assert.equal(readDeluxePlayer(out,30,0).jersey,2);assert.equal(readDeluxePlayer(out,30,otherSlot).jersey,1);assert.deepEqual(readDeluxePlayer(out,30,0).skills,edits['30:0'].skills);assert.equal(out[at.record+6],base[at.record+6]);assert.equal(out[at.name],0);
 for(let i=0;i<out.length;i++)if(out[i]!==base[i])assert.ok((i>=at.record&&i<at.record+7)||(i>=at.name&&i<at.name+8)||(i>=other.record&&i<other.record+7)||(i>=0x7fc0&&i<0x7fe0),'unexpected write '+i.toString(16));
 assert.deepEqual(out.slice(0x78c0,0x78f0),base.slice(0x78c0,0x78f0));assert.equal(result.expanded,false);assert.deepEqual(input,snapshot);assert.deepEqual(splitRom(result.rom).header,splitRom(input).header);
 project.changes={strategyTexts:{},improvements:[]};assert.deepEqual((await buildDeluxeProject(input,project)).rom,input);
 const native=readDeluxePlayer(base,0,0);project.changes.players={'0:0':{name:native.name,jersey:native.jersey,naturalPosition:native.naturalPosition,skills:native.skills}};assert.deepEqual((await buildDeluxeProject(input,project)).rom,input);
});
test('Deluxe players: reject invalid data and duplicates atomically',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom;
 for(const edits of [{'36:0':{}},{'0:20':{}},{'00:0':{}},{'0:0':{name:'123456789'}},{'0:0':{name:''}},{'0:0':{skills:{speed:11}}},{'0:0':{skills:{speed:1.5}}},{'0:0':{skills:{unknown:1}}},{'0:0':{naturalPosition:7}},{'0:0':{appearanceRaw:3}},{'0:0':{jersey:2}}]){const out=base.slice();assert.throws(()=>applyDeluxePlayers(out,base,edits));assert.deepEqual(out,base);}
});

test('goalkeeper position is fixed and outfield players cannot select goalkeeper',{skip:!fixture},()=>{const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom;for(const player of [0,11]){assert.equal(readDeluxePlayer(base,0,player).isGoalkeeper,true);assert.throws(()=>applyDeluxePlayers(base.slice(),base,{['0:'+player]:{naturalPosition:4}}),/fixa/);}for(const player of [1,10,12,19]){assert.equal(readDeluxePlayer(base,0,player).isGoalkeeper,false);assert.throws(()=>applyDeluxePlayers(base.slice(),base,{['0:'+player]:{naturalPosition:1}}),/linha/);const out=base.slice();applyDeluxePlayers(out,base,{['0:'+player]:{naturalPosition:6}});assert.equal(readDeluxePlayer(out,0,player).naturalPosition,6);}});
