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

test('structure: graphic headings and independent team names use project identities and guarded native loaders',{skip:!fixture},async()=>{
 const {konamiLzDecompress}=await import('../src/core/konami-lz.mjs');const {NATIVE_MENU_FONTS}=await import('../src/core/deluxe-menu-fields.mjs');const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom;let s=null;for(let i=0;i<3;i++)s=addDeluxeStructureGroup(base,s);s.labels=s.groups.map((_,i)=>'GRUPO '+(i+1));s.teams[30].name='Brasil';s.teams[53].name='Honduras';const out=prepareDeluxeStructure(base,s);
 const tp=pc(long(out,0x2ad2f));for(let i=0;i<9;i++){const address=0x30000+(out[tp+i*2]|out[tp+i*2+1]<<8),raw=out.slice(address,address+16);const inv=Object.fromEntries(Object.entries(NATIVE_MENU_FONTS.SmallMenuText).map(([c,n])=>[n,c]));assert.equal(Array.from(raw.slice(0,8),b=>inv[b]).join('').trim(),'GRUPO'+(i+1));assert.deepEqual(raw.slice(8),new Uint8Array(8));}
 const packed=konamiLzDecompress(out,0xdea80).data;assert.equal(packed[0],61);const total=packed[1]|packed[2]<<8;assert.equal(packed.length,3+61+total*4);let offset=0;const readName=team=>{let off=0;for(let i=0;i<team;i++)off+=packed[3+i];const chars=[];for(let i=0;i<packed[3+team];i+=2){const t=packed[64+total*2+off+i]-128;chars.push(t<16?String.fromCharCode(65+t):t>=32&&t<=41?String.fromCharCode(81+t-32):t===42?'.':String(t-96));}return chars.join('');};assert.equal(readName(30),'BRASIL');assert.equal(readName(53),'HONDURAS');assert.notEqual(readName(30),readName(53));for(const ref of [0x10c21,0x10e49,0x116b5])assert.equal(pc(out[ref]|out[ref+1]<<8|out[ref+2]<<16),0xdea80);
 assert.equal(out[0x121153],0x22);assert.equal(out[0x12116f],0x22);const occupied=base.slice();occupied[0xdea80]=0;assert.throws(()=>prepareDeluxeStructure(occupied,s),/reserva ocupada/);
});
