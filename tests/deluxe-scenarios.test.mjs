import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {SCENARIO_BASE,readDeluxeScenario,scenarioTeamNames,scenarioTexts,scenarioTextField,validateDeluxeScenario,scenarioHeaderId,scenarioDescriptionId} from '../src/core/deluxe-scenarios.mjs';
import {encodeNativeMenuField} from '../src/core/deluxe-menu-text.mjs';
import {installScenarioEditor} from '../deluxe-editor/scenario-editor.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('scenario form groups fields, disables native fixed values and keeps navigation and score preview working',{skip:!fixture},()=>{
 class Element{constructor(tag){this.tag=tag;this.children=[];this.style={};this.listeners={};}append(...items){this.children.push(...items);}replaceChildren(){this.children=[];}addEventListener(event,fn){this.listeners[event]=fn;}}
 const host=new Element('article'),prior=globalThis.document;globalThis.document={getElementById:()=>host,createElement:tag=>new Element(tag),addEventListener(){}};
 try{const file=new Uint8Array(fs.readFileSync(fixture)),project={changes:{}},editor=installScenarioEditor({getProject:()=>project,getFile:()=>file,onStatus(){}});editor.render();const nav=host.children[0],body=host.children[1],primary=body.children[0],secondary=body.children[1];assert.equal(primary.children.length,5);assert.equal(secondary.children.length,3);assert.equal(primary.children[4].children[0].disabled,true);assert.equal(secondary.children[2].children[0].disabled,true);assert.notEqual(primary.children[2].children[0].disabled,true);assert.equal(body.children[2].className,'scenario-header');assert.equal(body.children[3].children[0].tag,'textarea');const score=primary.children[2].children[0];score.value=8;score.listeners.input();assert.match(body.children[2].children[0].textContent,/8-/);nav.children[2].onclick();assert.match(host.children[0].children[1].textContent,/2 DE 12/);}finally{globalThis.document=prior;}
});
test('all twelve scenarios write native teams, score, clock and referee, and matching header and description',{skip:!fixture},async()=>{
 const f=new Uint8Array(fs.readFileSync(fixture)),{rom,header}=splitRom(f),p=await createDeluxeProject(f);
 p.changes.scenarios=Object.fromEntries(Array.from({length:12},(_,i)=>[i,{...readDeluxeScenario(rom,i),team1:30,team2:31,score1:2,score2:3,seconds:95,referee:2}]));
 const original=JSON.stringify(p),out=(await buildDeluxeProject(f,p)).rom.subarray(header.length);
 assert.equal(JSON.stringify(p),original);
 for(let i=0;i<12;i++){
  const v=p.changes.scenarios[i],at=SCENARIO_BASE+i*15;
  const {description,...native}=v;assert.deepEqual(readDeluxeScenario(out,i),native);
  assert.deepEqual(out.slice(at+8,at+15),rom.slice(at+8,at+15));
  for(const[id,value]of Object.entries(scenarioTexts(i,v,scenarioTeamNames()))){const field=scenarioTextField(id);encodeNativeMenuField(field,value).forEach((b,k)=>assert.deepEqual(out.slice(field[3].pool.segments[k].pc,field[3].pool.segments[k].pc+b.length),b));}
 }
 assert.match(scenarioTexts(0,p.changes.scenarios[0],scenarioTeamNames())[scenarioHeaderId(0)],/BRASIL 2-3 ARGENTINA/);
 assert.match(scenarioTexts(0,p.changes.scenarios[0],scenarioTeamNames())[scenarioHeaderId(0)],/\n {6}1:35 ESCANTEIO/);
 assert.throws(()=>validateDeluxeScenario(0,{...p.changes.scenarios[0],team2:30},scenarioTeamNames()),/diferentes/);
 delete p.changes.scenarios;assert.deepEqual((await buildDeluxeProject(f,p)).rom,f);
});
test('expanded GG scenario overrides legacy headers and preserves native restart data',{skip:!fixture||!process.env.ISSSD_GG_RECOVERED_PROJECT},async()=>{
 const f=new Uint8Array(fs.readFileSync(fixture)),{rom,header}=splitRom(f),p=JSON.parse(fs.readFileSync(process.env.ISSSD_GG_RECOVERED_PROJECT));
 const v={...readDeluxeScenario(rom,0),team1:54,team2:59,score1:2,score2:3,seconds:74};p.changes.scenarios={0:v};
 const out=(await buildDeluxeProject(f,p)).rom.subarray(header.length);assert.deepEqual(readDeluxeScenario(out,0),v);
 assert.deepEqual(out.slice(SCENARIO_BASE+8,SCENARIO_BASE+15),rom.slice(SCENARIO_BASE+8,SCENARIO_BASE+15));
 const text=scenarioTexts(0,v,scenarioTeamNames(p.changes.structure));assert.match(text[scenarioHeaderId(0)],/ADIPOSOS 2-3 VAPOROSOS/);assert.ok(text[scenarioDescriptionId(0)]);
});
