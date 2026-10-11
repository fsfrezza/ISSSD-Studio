import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'project-data','historical-national-teams-v1.json'),'utf8'));
const bytes=h=>Array.from(Buffer.from(h,'hex'));
const signed=b=>b>=0x80?b-0x100:b;
const attr=h=>{const b=bytes(h);return {ace:(b[0]>>4)+1,vel:(b[0]&15)+1,chu:(b[1]>>4)+1,cur:(b[1]&15)+1,bal:(b[2]>>4)+1,int:(b[2]&15)+1,dri:(b[3]>>4)+1,sal:(b[3]&15)+1,pos:b[4]>>4,ene:(b[4]&15)+1,shirt:b[5]+1,appearance:b[6]}};

function verifyTactic(team){
 const t=team.tactic,b=bytes(t.rawHex);assert.equal(b.length,31);assert.equal(b[0],t.formationIndex);assert.equal(t.players.length,10);
 for(let i=0;i<10;i++){
  const p=t.players[i],flag=b[21+i];assert.equal(signed(b[1+i*2]),p.dx,`${team.teamName} x ${i}`);assert.equal(signed(b[2+i*2]),p.dy,`${team.teamName} y ${i}`);
  const cls=(flag&3)===1?'DF':(flag&3)===2?'MC':(flag&3)===3?'AT':'?';assert.equal(cls,p.className,`${team.teamName} classe ${i}`);assert.equal(!!(flag&4),p.attack,`${team.teamName} atacar ${i}`);
 }
}

test('Brasil, Argentina e Alemanha históricas têm 20 jogadores e táticas lossless',()=>{
 assert.equal(data.schema,'isssd-historical-national-teams-v1');
 for(const id of ['8','30','31']){const t=data.teams[id];assert.equal(t.players.length,20);t.players.forEach((p,i)=>{assert.equal(p.slot,i+1);assert.match(p.nameHex,/^[0-9A-F]{16}$/);assert.match(p.attrHex,/^[0-9A-F]{14}$/)});verifyTactic(t)}
});

test('Brasil traz o XI histórico e a disposição assimétrica definida',()=>{
 const t=data.teams['30'];
 assert.deepEqual(t.players.slice(0,11).map(p=>p.name),['Taffarel','R.Carlos','D.daGuia','Lucio','Cafu','R.Gaucho','Dunga','Gerson',"Pele'",'Ronaldo','Garrinch']);
 assert.deepEqual(t.players.slice(0,11).map(p=>attr(p.attrHex).shirt),[1,6,4,3,2,11,5,8,10,9,7]);
 assert.deepEqual(t.players.slice(0,11).map(p=>attr(p.attrHex).pos),[1,2,2,2,2,5,3,3,5,6,6]);
 assert.deepEqual(t.tactic.players.map(p=>[p.dx,p.dy,p.className,p.attack]),[[8,-32,'DF',true],[0,-11,'DF',false],[0,11,'DF',false],[8,32,'DF',true],[0,-32,'MC',true],[-16,-11,'MC',false],[-16,11,'MC',false],[0,32,'MC',true],[0,-16,'AT',false],[0,16,'AT',false]]);
});

test('Argentina traz Messi e Maradona no meio e Di Maria/Batistuta na frente com skills finais conhecidos',()=>{
 const t=data.teams['31'];
 assert.deepEqual(t.players.slice(0,11).map(p=>p.name),['Fillol','Zanetti','Passarel','Ruggeri','Olartico','Maschera','Redondo','Messi','Maradona','Di Maria','Batistut']);
 const by=Object.fromEntries(t.players.map(p=>[p.name,attr(p.attrHex)]));
 assert.deepEqual([by.Messi.ace,by.Messi.vel,by.Messi.chu,by.Messi.cur,by.Messi.bal,by.Messi.int,by.Messi.dri,by.Messi.sal,by.Messi.ene],[10,10,10,10,9,10,10,7,9]);
 assert.deepEqual([by.Maradona.ace,by.Maradona.vel,by.Maradona.chu,by.Maradona.cur,by.Maradona.bal,by.Maradona.int,by.Maradona.dri,by.Maradona.sal,by.Maradona.ene],[10,10,10,10,10,10,10,8,9]);
 assert.deepEqual([by['Di Maria'].ace,by['Di Maria'].vel,by['Di Maria'].chu,by['Di Maria'].cur,by['Di Maria'].bal,by['Di Maria'].int,by['Di Maria'].dri,by['Di Maria'].sal,by['Di Maria'].ene],[9,10,8,9,8,9,9,7,9]);
 assert.deepEqual([by.Batistut.ace,by.Batistut.vel,by.Batistut.chu,by.Batistut.cur,by.Batistut.bal,by.Batistut.int,by.Batistut.dri,by.Batistut.sal,by.Batistut.ene],[8,9,10,8,10,9,8,9,9]);
 assert.equal(by.Messi.pos,5);assert.equal(by.Maradona.pos,5);assert.equal(by['Di Maria'].pos,6);assert.equal(by.Batistut.pos,6);
});

test('Alemanha mantém XI histórico 4-4-2 e posições de campo explícitas',()=>{
 const t=data.teams['8'];assert.equal(t.tactic.formationIndex,1);
 assert.deepEqual(t.players.slice(0,11).map(p=>p.name),['Neuer','Lahm','Beckenba','Kohler','Brehme','Matthaus','Kroos','Walter','Rummenig','Muller','Klose']);
 assert.deepEqual(t.tactic.players.map(p=>p.className),['DF','DF','DF','DF','MC','MC','MC','MC','AT','AT']);
});

test('fluxo do Editor reaplica teamsV1 e força refresh dos campos após abrir projeto',()=>{
 const bridge=fs.readFileSync(path.join(root,'scripts','build-editor.mjs'),'utf8');
 const structural=fs.readFileSync(path.join(root,'scripts','post-build-project-structure.mjs'),'utf8');
 assert.match(bridge,/studioRestoreTeamsV1\(sem\.teamsV1\)/);
 assert.match(bridge,/__ISSSD_TEAM_STATE_API__\?\.refresh\?\.\(\)/);
 assert.match(structural,/__ISSSD_GIT_REAPPLY_PROJECT_STATE__/);
 assert.match(structural,/__ISSSD_TEAM_STATE_API__\?\.refresh\?\.\(\)/);
});
