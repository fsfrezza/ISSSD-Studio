import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {MATCH_ANNOUNCEMENTS,renderMatchAnnouncements,announcementPreview} from '../src/core/deluxe-match-announcements.mjs';
import {createDeluxeProject,buildDeluxeProject,splitRom} from '../src/core/deluxe-project.mjs';
import {applyTextPreset} from '../src/core/deluxe-text-presets.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('all 17 Portuguese notices render from the export tiles, including accents and fallback',()=>{
 const values=Object.fromEntries(MATCH_ANNOUNCEMENTS.map(([id,en,pt])=>[id,pt])),r=renderMatchAnnouncements(values);assert.equal(r.texts.length,17);assert.equal(r.texts[0],'GOL!');assert.equal(r.texts[3],'CARTÃO AMARELO');
 for(let i=0;i<17;i++){const pixels=announcementPreview(r,i);assert.equal(pixels.length,256*32*4);assert.ok(pixels.some((v,j)=>j%4===3&&v===255));}
 assert.throws(()=>renderMatchAnnouncements({foul:'?'}),/Avisos/);
});
test('Deluxe presets, custom notices, expansion and original restore',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,project=await createDeluxeProject(file);const pt=applyTextPreset(project,base,'matchAnnouncements','portuguese');assert.equal(Object.keys(pt.changes.matchAnnouncements).length,17);
 const r=await buildDeluxeProject(file,JSON.parse(JSON.stringify(pt)));assert.equal(r.rom.length,0x400000+project.base.headerSize);assert.notDeepEqual(r.rom.slice(project.base.headerSize+0x5b703,project.base.headerSize+0x5b70d),base.slice(0x5b703,0x5b70d));assert.deepEqual((await buildDeluxeProject(file,applyTextPreset(pt,base,'matchAnnouncements','original'))).rom,file);
 project.changes.matchAnnouncements={foul:'FALTA'};assert.ok((await buildDeluxeProject(file,project)).expanded);project.changes.matchAnnouncements={unknown:'TESTE'};await assert.rejects(buildDeluxeProject(file,project),/campos inválidos/);
});
