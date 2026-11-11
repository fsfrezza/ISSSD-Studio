import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom,createDeluxeProject,buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {addDeluxeStructureGroup,prepareDeluxeStructure,STRUCTURE_LAYOUT as L,validateDeluxeStructure} from '../src/core/deluxe-structure.mjs';
import {readDeluxePlayer,deluxePlayerOffsets,planDeluxeJerseySwap} from '../src/core/deluxe-players.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;const pc=cpu=>((cpu>>>16)&127)*32768+(cpu&32767),long=(b,p)=>b[p+1]|b[p+2]<<8|b[p+3]<<16;
test('structure: 42/48/54 independent rosters, all seven special/challenge carriers and native table references',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),snapshot=file.slice(),base=splitRom(file).rom;let s=null;
 for(let round=0;round<3;round++){
  s=addDeluxeStructureGroup(base,s);const n=s.teams.length,out=prepareDeluxeStructure(base,s);assert.equal(out.length,base.length);assert.equal(out[L.marker+8],n);
  for(let team=0;team<n;team++)for(let p=0;p<20;p++){const expected=readDeluxePlayer(base,s.teams[team].sourceTeam,p),actual=readDeluxePlayer(out,team,p);assert.equal(actual.name,expected.name);assert.deepEqual(actual.skills,expected.skills);assert.equal(actual.jersey,expected.jersey);}
  for(let special=0;special<7;special++)assert.deepEqual(out.slice(L.attributes+(n+special)*140,L.attributes+(n+special+1)*140),base.slice(0x50000+(36+special)*140,0x50000+(37+special)*140));
  // Execute the addressing arithmetic used by the native MVN source and name loaders.
  for(let team=0;team<n;team++){const sourceWord=(out[0x1c6be]|out[0x1c6bf]<<8)+140*(team+1),sourcePc=pc(out[0x1c6d0]<<16|sourceWord);assert.equal(sourcePc,L.attributes+team*140);const tablePc=pc(long(out,0x4f3c)),ptr=out[tablePc+team*2]|out[tablePc+team*2+1]<<8;assert.equal(pc(out[0x4f4a]<<16|ptr),L.names+team*160);}
  const groupPc=pc(long(out,L.groupHelper)),flat=s.groups.flat().map(v=>v*2);assert.deepEqual(Array.from(out.slice(groupPc,groupPc+n)),flat);assert.equal(out[0x2a567],n/6);assert.equal(out[0x2af93],n+7);
  const project=await createDeluxeProject(file);project.changes.structure=s;let edits=planDeluxeJerseySwap(out,{},n-1,0,2);edits[(n-1)+':0']={...edits[(n-1)+':0'],name:'Novo',skills:{speed:10}};project.changes.players=edits;const built=await buildDeluxeProject(file,JSON.parse(JSON.stringify(project))),rom=splitRom(built.rom).rom;
  assert.equal(built.expanded,false);assert.equal(readDeluxePlayer(rom,n-1,0).name,'Novo');assert.equal(readDeluxePlayer(rom,n-1,0).skills.speed,10);assert.equal(readDeluxePlayer(rom,30,0).name,readDeluxePlayer(base,30,0).name);assert.equal(rom.reduce((s,b)=>(s+b)&65535,0),rom[0x7fde]|rom[0x7fdf]<<8);
  assert.deepEqual(splitRom(built.rom).header,splitRom(file).header);delete project.changes.structure;delete project.changes.players;assert.deepEqual((await buildDeluxeProject(file,project)).rom,file);
 }
 assert.deepEqual(file,snapshot);assert.throws(()=>addDeluxeStructureGroup(base,s),/54/);
});
test('structure: reject incomplete or duplicate groups, changed identities and occupied reserves',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,s=addDeluxeStructureGroup(base);
 for(const change of [q=>q.groups[0][0]=q.groups[0][1],q=>q.teams.pop(),q=>q.teams[0].sourceTeam=1,q=>q.experimental=false]){const q=structuredClone(s);change(q);assert.throws(()=>validateDeluxeStructure(q));}
 const occupied=base.slice();occupied[L.names]=0;assert.throws(()=>prepareDeluxeStructure(occupied,s),/reserva ocupada/);assert.deepEqual(base,splitRom(new Uint8Array(fs.readFileSync(fixture))).rom);
});
