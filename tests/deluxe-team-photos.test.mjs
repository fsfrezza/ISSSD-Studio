import {encodeOpeningFrame} from '../src/core/deluxe-opening-media.mjs';
import {readDeluxePlayer} from '../src/core/deluxe-players.mjs';
import {decodePlayerRecord} from '../src/core/plus-player.mjs';
import {decodeFixedPlayerName} from '../src/core/plus-player-name.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {extractGGTeamPhotos,validateTeamPhotos} from '../src/core/deluxe-team-photos.mjs';
import {ensureDeluxeTeamPhotos} from '../src/core/deluxe-team-photos.mjs';
import {DELUXE_REFERENCE_PHOTOS} from '../src/core/deluxe-reference-photos.mjs';
import {DELUXE_REFERENCE_VISUALS} from '../src/core/deluxe-reference-visuals.mjs';
import {validateTeamVisuals} from '../src/core/deluxe-team-visuals.mjs';
import {DELUXE_TEAM_PHOTO_RECIPES} from '../src/core/deluxe-team-photo-recipes.mjs';
import {deluxePhotoKey} from '../src/core/deluxe-team-preview.mjs';
import {ggNativePhotoStyle} from '../src/core/deluxe-gg-photo-style.mjs';
test('GG formation styles retain native geometry and skin, with independent uniform shading',()=>{
 const p={changes:{teamPhotos:structuredClone(DELUXE_REFERENCE_PHOTOS)}};
 p.changes.teamPhotos.teams[59].palettes[0][2]^=1;
 const custom=structuredClone(p.changes.teamPhotos.teams[59]);
 ensureDeluxeTeamPhotos(p);
 for(let i=54;i<59;i++){const source=DELUXE_REFERENCE_PHOTOS.teams[i],row=p.changes.teamPhotos.teams[i];assert.equal(deluxePhotoKey(row),deluxePhotoKey(source));assert.deepEqual(row.palettes.slice(3),source.palettes.slice(3));assert.notDeepEqual(row.palettes[0],source.palettes[0]);assert.deepEqual(row,ggNativePhotoStyle(i));}
 assert.deepEqual(p.changes.teamPhotos.teams[59],custom);assert.deepEqual(p.changes.teamPhotos.teams[0],DELUXE_REFERENCE_PHOTOS.teams[0]);
 const saved=structuredClone(p);ensureDeluxeTeamPhotos(p);assert.deepEqual(p,saved);
});
test('reference catalog includes all 60 native compositions and respects existing overrides',()=>{
 assert.equal(Object.keys(validateTeamPhotos(DELUXE_REFERENCE_PHOTOS).teams).length,60);
 assert.equal(Object.keys(validateTeamVisuals(DELUXE_REFERENCE_VISUALS).teams).length,60);
 for(const row of Object.values(DELUXE_REFERENCE_PHOTOS.teams))assert.ok(DELUXE_TEAM_PHOTO_RECIPES.recipes[deluxePhotoKey(row)]);
 const p={changes:{structure:{teams:Array.from({length:37},(_,i)=>({plusId:i}))}}};
 ensureDeluxeTeamPhotos(p);
 assert.notEqual(p.changes.teamPhotos,DELUXE_REFERENCE_PHOTOS);
 const own=p.changes.teamPhotos;p.changes.teamPhotos.teams[0].bodyType=99;
 ensureDeluxeTeamPhotos(p);assert.equal(p.changes.teamPhotos,own);assert.equal(own.teams[0].bodyType,99);
});
import {buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {encodeTeamPhotoDraft,validateTeamPhotoDrafts,TEAM_PHOTO_WIDTH,TEAM_PHOTO_HEIGHT} from '../src/core/deluxe-team-photo-drafts.mjs';
import {encodeFormationTiles} from '../src/core/deluxe-team-photo-runtime.mjs';
test('formation tiles use SNES OBJ row stride and transparent index',()=>{const pixels=Array(6144).fill(0);pixels[0]=1;pixels[1]=2;pixels[2]=4;pixels[3]=8;pixels[8*96]=15;const tiles=encodeFormationTiles({pixels});assert.equal(tiles.length,4096);assert.deepEqual([tiles[0],tiles[1],tiles[16],tiles[17]],[128,64,32,16]);assert.deepEqual([tiles[512],tiles[513],tiles[528],tiles[529]],[128,128,128,128]);assert.equal(tiles[384],0);});
test('formation draft encodes independent BGR555 colors and preserves transparency',()=>{const rgba=new Uint8Array(TEAM_PHOTO_WIDTH*TEAM_PHOTO_HEIGHT*4);rgba.set([255,0,0,255,0,0,0,255,0,255,0,127]);const draft=encodeTeamPhotoDraft(rgba);assert.ok(draft.pixels[0]);assert.equal(draft.colors[draft.pixels[0]],31);assert.ok(draft.pixels[1]);assert.equal(draft.colors[draft.pixels[1]],0);assert.equal(draft.pixels[2],0);assert.deepEqual(validateTeamPhotoDrafts({'23':draft}),[23]);assert.throws(()=>validateTeamPhotoDrafts({'23':{...draft,pixels:[16]}}),/inválido/);});
const paths=[process.env.ISSSD_DELUXE_ROM,process.env.ISSSD_PLUS_ROM,process.env.ISSSD_GG_ROM,process.env.ISSSD_GG_RECOVERED_PROJECT];
const word=(b,p)=>b[p]|b[p+1]<<8,long=(b,p)=>word(b,p)|b[p+2]<<16,pc=c=>((c>>16&127)*32768)+(c&32767);
function directory(base,out,old){for(let at=0;at<base.length-4;at++)if(base[at]===191&&long(base,at+1)===old)return pc(long(out,at+1));throw Error('Missing directory');}
test('photo catalog refuses incomplete records',()=>{assert.equal(validateTeamPhotos(undefined),null);assert.throws(()=>validateTeamPhotos({}),/inválido/);});
test('sixty photos use stable identities and preserve every player record and existing asset',{skip:!paths.every(Boolean)},async()=>{
 const [baseFile,plus,reference]=paths.slice(0,3).map(p=>new Uint8Array(fs.readFileSync(p))),project=JSON.parse(fs.readFileSync(paths[3])),before=structuredClone(project),base=baseFile.slice(baseFile.length%32768===512?512:0);
 project.changes.teamPhotos=extractGGTeamPhotos(reference,plus,crypto.createHash('sha256').update(reference).digest('hex'));assert.equal(Object.keys(project.changes.teamPhotos.teams).length,60);ensureDeluxeTeamPhotos(project);
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
