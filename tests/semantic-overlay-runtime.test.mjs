import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const patch=fs.readFileSync(new URL('../scripts/patch-team-semantic-overlay.mjs',import.meta.url),'utf8');
const actual=JSON.parse(fs.readFileSync(new URL('./fixtures/brazil-sparse-open.json',import.meta.url)));
// Canonical helpers intentionally live in a LATER script, as in the final HTML.
// Deliberately keep teams and the tactical reader PRIVATE, as in the legacy IIFE.
// Execute the production patch against HTML, rather than a reimplementation of its resolver.
function session(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-scope-'));
 fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'editor'));
 fs.writeFileSync(path.join(dir,'scripts/patch.mjs'),patch);
 const html=`<body><script>
 const original=new Uint8Array(4*1024*1024),rom=new Uint8Array(original);
 const activeRomProfile={id:'iss-deluxe-plus'};
 (()=>{'use strict';
 let teams=[],currentTeam=30;
 function plusTacticalRecordForTeam(t,source=rom){return {raw:new Uint8Array(31),players:Array.from({length:10},()=>({dx:8,dy:-32,className:'DF',attack:false,flag:1}))}}
 function refreshPlusTeamFromRom(t){teams[t]={name:'Brazil',players:Array.from({length:20},(_,i)=>({name:'Original '+(i+1),number:i+1,position:2,speed:i+1,shot:3,hair:i%10}))}}
 function buildTeams(){refreshPlusTeamFromRom(30)}
 window.__ISSD_CORE__={applyProject(){buildTeams()}};
 function ensureCurrentTeamFresh(){if(activeRomProfile.id==='iss-deluxe-plus')refreshPlusTeamFromRom(currentTeam)}
 function renderPlayer(){ensureCurrentTeamFresh();return teams[30].players}
 window.probe={renderPlayer,buildTeams,rom,original,readTactic:(source)=>plusTacticalRecordForTeam(30,source)};
 buildTeams();
 })();
 </script><script>
 function studioTeamsV3OriginalPlayer(t,s){return {playerId:t+':'+s,baseSlot:s,slot:s,name:'Original '+s,number:s,position:'DF',skills:{speed:s,shot:3},appearance:{hair:s%10},tactical:{x:-31,y:-32,className:'DF',attack:false}}}
 function studioTeamsV3BaseSlot(t,p,s){return p.baseSlot||s}
 function studioTeamsV3NativeDx(c,x){return x-(c==='DF'?-39:c==='MC'?0:39)}
 function studioTeamsV3Class(c){return c==='DF'?'DF':c==='MF'||c==='MC'?'MC':'AT'}
 function studioTeamsV3ReadFull(){return {teams:{30:{teamId:30,players:Array.from({length:20},(_,i)=>studioTeamsV3OriginalPlayer(30,i+1))}}}}
 </script></body>`;
 fs.writeFileSync(path.join(dir,'editor/ISSSD-Studio.html'),html);
 try{
  execFileSync(process.execPath,[path.join(dir,'scripts/patch.mjs')]);
  const final=fs.readFileSync(path.join(dir,'editor/ISSSD-Studio.html'),'utf8');
  const c=vm.createContext({console,Uint8Array});c.window=c;
  for(const m of final.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);
  return c;
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
}
const plain=v=>JSON.parse(JSON.stringify(v));

test('generated scoped runtime hydrates Cafu and survives refresh, render and rebuild without ROM writes',()=>{
 const c=session(),before=Buffer.from(c.probe.rom),base=Buffer.from(c.probe.original);
 assert.equal(c.teams,undefined); // an external script cannot see this model
 const state=structuredClone(actual),p=state.teams[30].players[1];
 Object.assign(p.custom,{name:'Cafu',position:'DF-MF',appearance:{hair:9}});
 p.custom.tactical.attack=true;
 assert.equal(c.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(state),true);
 for(let i=0;i<3;i++){
  c.probe.buildTeams();const q=c.probe.renderPlayer()[1];
  assert.equal(q.name,'Cafu');assert.equal(q.fixedName,'Cafu');assert.equal(q.number,2);assert.equal(q.position,3);
  assert.equal(q.speed,9);assert.equal(q.shot,6);assert.equal(q.hair,9);
  assert.deepEqual(plain(q.tactical),{x:-30,y:30,className:'DF',attack:true});
  const t=c.probe.readTactic();assert.equal(t.players[0].dx,9);assert.equal(t.players[0].dy,30);assert.equal(t.players[0].attack,true);
  assert.equal(t.raw[1],9);assert.equal(t.raw[2],30);assert.equal(t.raw[21]&4,4);
  assert.equal(c.studioTeamsV3ReadFull().teams[30].players[1].name,'Cafu');
 }
 assert.equal(c.probe.readTactic(c.probe.original).players[0].attack,false);
 assert.deepEqual(Buffer.from(c.probe.rom),before);assert.deepEqual(Buffer.from(c.probe.original),base);
});

test('actual attached sparse Brazil preserves absent fields and applies coordinates and skills',()=>{
 const c=session();assert.equal(c.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(actual),true);
 const ps=c.probe.renderPlayer();assert.equal(ps[1].name,'Original 2');assert.equal(ps[1].speed,9);
 assert.equal(ps[1].tactical.x,-30);assert.equal(ps[1].tactical.y,30);
 assert.equal(ps[4].tactical.x,-31);assert.equal(ps[4].tactical.y,-29);
});

test('moving identity moves all attributes, including unspecified identity baseline fields',()=>{
 const c=session(),s=structuredClone(actual),a=s.teams[30].players[1],b=s.teams[30].players[4];
 a.slot=5;b.slot=2;a.custom.name='Cafu';a.custom.position='DF-MF';a.custom.tactical.attack=true;
 assert.equal(c.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(s),true);
 const ps=c.probe.renderPlayer();assert.equal(ps[4].playerId,'30:2');assert.equal(ps[4].baseSlot,2);
 assert.equal(ps[4].name,'Cafu');assert.equal(ps[4].speed,9);assert.equal(ps[4].hair,2);
 assert.equal(ps[4].position,3);assert.equal(ps[4].number,2);assert.equal(ps[4].tactical.x,-30);
 assert.equal(ps[1].playerId,'30:5');assert.equal(ps[1].name,'Original 5');assert.equal(ps[1].number,6);
 assert.equal(c.probe.readTactic().players[3].dy,30);
});

test('installing a clean session clears previous project resolution',()=>{
 const c=session(),s=structuredClone(actual);s.teams[30].players[1].custom.name='Cafu';
 c.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(s);c.__ISSSD_TEAMS_SEMANTIC_RESET_V1__();c.__ISSD_CORE__.applyProject();
 assert.equal(c.probe.renderPlayer()[1].name,'Original 2');assert.equal(c.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__,null);
});

test('recovered historical project names and newer coordinates can resolve together by identity',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('./fixtures/brazil-recovered-v3.json',import.meta.url)));
 const c=session();assert.equal(c.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(old),true);
 assert.equal(c.probe.renderPlayer()[0].name,'Taffarel');assert.equal(c.probe.renderPlayer()[1].name,'Cafu');
 // This merge is test data only: opening a sparse project never guesses missing fields.
 const combined=structuredClone(old);
 for(const p of combined.teams[30].players){
  const latest=actual.teams[30].players.find(q=>q.playerId===p.playerId)?.custom;
  if(latest)p.custom={...p.custom,...latest,tactical:{...p.custom?.tactical,...latest.tactical},skills:{...p.custom?.skills,...latest.skills}};
 }
 c.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(combined);
 assert.equal(c.probe.renderPlayer()[1].name,'Cafu');assert.equal(c.probe.renderPlayer()[1].tactical.x,-30);
 assert.equal(c.probe.renderPlayer()[1].tactical.y,30);
 assert.equal(c.probe.renderPlayer()[8].name,"Pele'");assert.equal(c.probe.renderPlayer()[8].tactical.y,-2);
});
