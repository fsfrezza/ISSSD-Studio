import {encodeOpeningFrame} from '../src/core/deluxe-opening-media.mjs';
import {readDeluxePlayer} from '../src/core/deluxe-players.mjs';
import {decodePlayerRecord} from '../src/core/plus-player.mjs';
import {decodeFixedPlayerName} from '../src/core/plus-player-name.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {extractGGTeamPhotos,validateTeamPhotos} from '../src/core/deluxe-team-photos.mjs';
import {buildDeluxeProject} from '../src/core/deluxe-project.mjs';
const paths=[process.env.ISSSD_DELUXE_ROM,process.env.ISSSD_PLUS_ROM,process.env.ISSSD_GG_ROM,process.env.ISSSD_GG_RECOVERED_PROJECT];
const word=(b,p)=>b[p]|b[p+1]<<8,long=(b,p)=>word(b,p)|b[p+2]<<16,pc=c=>((c>>16&127)*32768)+(c&32767);
function directory(base,out,old){for(let at=0;at<base.length-4;at++)if(base[at]===191&&long(base,at+1)===old)return pc(long(out,at+1));throw Error('Missing directory');}
test('photo catalog refuses incomplete records',()=>{assert.equal(validateTeamPhotos(undefined),null);assert.throws(()=>validateTeamPhotos({}),/inválido/);});
test('sixty photos use stable identities and preserve every player record and existing asset',{skip:!paths.every(Boolean)},async()=>{
 const [baseFile,plus,reference]=paths.slice(0,3).map(p=>new Uint8Array(fs.readFileSync(p))),project=JSON.parse(fs.readFileSync(paths[3])),before=structuredClone(project),base=baseFile.slice(baseFile.length%32768===512?512:0);
 project.changes.teamPhotos=extractGGTeamPhotos(reference,plus,crypto.createHash('sha256').update(reference).digest('hex'));assert.equal(Object.keys(project.changes.teamPhotos.teams).length,60);
 const original=await buildDeluxeProject(baseFile,before),saved=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(baseFile,saved),out=result.rom.slice(result.base.headerSize),old=original.rom.slice(original.base.headerSize);
 assert.deepEqual(saved.changes.players,before.changes.players);assert.deepEqual(saved.changes.structure,before.changes.structure);assert.deepEqual(saved.changes.teamVisuals,before.changes.teamVisuals);assert.deepEqual(saved.changes.titleComposer,before.changes.titleComposer);
 assert.deepEqual(out.slice(0x17bd20,0x17bd20+67*140),old.slice(0x17bd20,0x17bd20+67*140));assert.deepEqual(out.slice(0x200000,0x200000+60*160),old.slice(0x200000,0x200000+60*160));
 const selectors=[['bodyType',0x82f91b,1],['faceType',0x82fa35,1],['overlayType',0x82fab3,1],['extraType',0x82f8f1,1],['accessory',0x82f61c,2],['formationFlags',0x82fa07,1]];
 for(let slot=0;slot<60;slot++){const photo=project.changes.teamPhotos.teams[project.changes.structure.teams[slot].plusId];for(const[key,old,stride]of selectors){const at=directory(base,out,old)+slot*stride;assert.equal(stride===1?out[at]:word(out,at),photo[key]);}for(const[k,old]of[[0,0x82fa5f],[1,0x82f89d],[2,0x82f9b3]]){const ptr=word(out,directory(base,out,old)+slot*2),at=0x248000+ptr;assert.deepEqual(Array.from(out.slice(at,at+photo.palettes[k].length)),photo.palettes[k]);}}
 const raw=reference.slice(0x2ef000,0x2f0000),allocation=JSON.parse(new TextDecoder().decode(raw.slice(0,raw.indexOf(255)))),names=allocation.group[0].names-54*160;
 for(let slot=0;slot<60;slot++)for(let player=0;player<20;player++){const plusId=project.changes.structure.teams[slot].plusId,actual=readDeluxePlayer(out,slot,player),expected=decodePlayerRecord(reference.slice(0x150000+(plusId*20+player)*7,0x150000+(plusId*20+player+1)*7));assert.equal(actual.name,decodeFixedPlayerName(reference.slice(names+plusId*160+player*8,names+plusId*160+player*8+8)).trim());assert.equal(actual.jersey,expected.jersey);assert.equal(actual.naturalPosition,expected.naturalPosition);for(const key of Object.keys(actual.skills))assert.equal(actual.skills[key],expected[key]+1);}
 const withOpening=structuredClone(project);withOpening.changes.openingMedia={konami:{kind:'image',fps:6,holdFrames:60,fadeInFrames:15,fadeOutFrames:15,frames:[encodeOpeningFrame(new Uint8Array(256*224*4))]}};await buildDeluxeProject(baseFile,withOpening);
 const bad=structuredClone(project);bad.changes.teamPhotos.teams[59].palettes[0].pop();await assert.rejects(buildDeluxeProject(baseFile,bad),/Paleta de foto inválida/);
});
