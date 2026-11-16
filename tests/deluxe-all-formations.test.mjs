import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom,createDeluxeProject,buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {deluxeFormationRecord,setDeluxeFormation,selectDeluxeInitialFormation} from '../src/core/deluxe-tactics.mjs';
import {decodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM,gg=process.env.ISSSD_GG_RECOVERED_PROJECT;
test('all sixteen formations are independent, survive JSON and export the two native arrays',{skip:!fixture},async()=>{
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom;let p=gg?JSON.parse(fs.readFileSync(gg)):await createDeluxeProject(file);const n=p.changes.structure?.teams.length??36,initial=deluxeFormationRecord(base,p,0,0),other=deluxeFormationRecord(base,p,1,1);
 for(let f=0;f<16;f++){const state=decodePlusTacticalRecord(deluxeFormationRecord(base,p,0,f));state.players[0].y=f-8;p=setDeluxeFormation(base,p,0,f,state);}
 for(let f=0;f<16;f++)assert.equal(decodePlusTacticalRecord(deluxeFormationRecord(base,p,0,f)).players[0].y,f-8);
 assert.deepEqual(deluxeFormationRecord(base,p,1,1),other);p=selectDeluxeInitialFormation(base,p,0,2);for(let f=0;f<16;f++)assert.equal(decodePlusTacticalRecord(deluxeFormationRecord(base,p,0,f)).players[0].y,f-8);
 const result=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p))),out=result.rom.slice(result.base.headerSize);assert.equal(out[0x2aa79],0x22);assert.equal(out[0x243000],2);
 for(let t=0;t<n;t++)for(let f=0;f<16;f++){const raw=deluxeFormationRecord(base,p,t,f),at=0x250000+t*480;assert.deepEqual(out.slice(at+20*f,at+20*f+20),raw.slice(1,21));assert.deepEqual(out.slice(at+320+10*f,at+320+10*f+10),raw.slice(21));}
 assert.equal(initial.length,31);
});
