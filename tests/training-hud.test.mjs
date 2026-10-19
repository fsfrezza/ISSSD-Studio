import test from 'node:test';
import assert from 'node:assert/strict';
import {TRAINING_HUD_FIELDS as fields} from '../src/core/training-hud-fields.mjs';
import {encodeTrainingHud,plusTrainingHudWriter,TRAINING_HUD_SLOT,TRAINING_HUD_REGIONS} from '../src/core/plus-training-hud.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
const originals=[
 [0x16,0x5B,0x59,0x52,0x35,0x44,0x4E,0x44,0x4E,0x40,0xFE,0x36,0x5B,0x45,0x56,0x36,0x45,0x4F,0x45,0x4F,0x41,0xFF],
 [0x58,0x5B,0x14,9,13,5,0xFF],[0x41,0x5B,2,15,14,21,19,0,20,9,13,5,0xFF],
 [0x0E,0x59,0x43,0x45,0x21,0x3E,0x45,0xFE,0x2E,0x59,0x44,0x31,0x22,0x42,0x31,0xFF],
 [0x0E,0x59,0x25,0x36,0x29,0x21,0x3E,0xFE,0x2E,0x59,0x26,0x37,0x2A,0x22,0x42,0xFF],
 [0x0D,0x59,0x45,0x30,0x38,0x29,0,0x46,0x3E,0xFE,0x2D,0x59,0x31,0x31,0x39,0x2A,0,0x3D,0x3F,0xFF],
 [0x0E,0x59,0x38,0x30,0x43,0x43,0xFE,0x2E,0x59,0x39,0x31,0x44,0x44,0xFF],
 [0x0B,0x59,0x23,0x3C,0x3A,0x46,0x43,0,0x25,0x2E,0x21,0x3A,0x25,0x29,0xFE,0x2B,0x59,0x24,0x3D,0x3B,0x3D,0x44,0,0x26,0x2F,0x22,0x3B,0x26,0x2A,0xFF],
];
function fixture(){const b=new Uint8Array(0x200000).fill(255);fields.forEach((f,i)=>{b.set(originals[i],f[3]);for(const pc of f[6])b.set([0xA2,f[3]&255,f[3]>>8],pc);});return b;}
const state=values=>({additionalScreenTextsV1:{values:{'training-hud':values}}});
const portuguese=Object.fromEntries(fields.map(([id,,pt])=>[id,pt]));
test('training codec matches audited native streams and centers the complete INICIO message',()=>{
 fields.forEach((f,i)=>assert.deepEqual([...encodeTrainingHud(f,f[1],true)],originals[i]));
 const timeUp=encodeTrainingHud(fields[5],fields[5][2]);assert.equal(timeUp[2],0x29);assert.equal(timeUp[17],0x2B,'F shares the E upper half, not the G upper half');
 assert.deepEqual([...encodeTrainingHud(fields[3],'INÍCIO')],[0x0D,0x59,0x30,0x3A,0x30,0x25,0x30,0x3C,0xFE,0x2D,0x59,0x31,0x3B,0x31,0x26,0x31,0x3D,0xFF]);
});
test('training HUD repoints every native occurrence, preserving the base and original strings',()=>{
 const b=fixture(),before=b.slice(),r=b.slice();plusTrainingHudWriter(r,state(portuguese),b);assert.deepEqual(b,before);
 for(const f of fields){const expected=encodeTrainingHud(f,portuguese[f[0]]);let pointer;for(const pc of f[6]){const p=r[pc+1]|r[pc+2]<<8;assert.ok(p>=TRAINING_HUD_SLOT);assert.deepEqual(r.slice(p,p+expected.length),expected);if(pointer!==undefined)assert.equal(p,pointer);pointer=p;}assert.deepEqual(r.slice(f[3],f[3]+originals[fields.indexOf(f)].length),Uint8Array.from(originals[fields.indexOf(f)]));}
 const classify=areaClassifier(r,b);for(const [a,z]of TRAINING_HUD_REGIONS){assert.equal(classify(a),'partida');assert.equal(classify(z-1),'partida');}
});
test('training HUD respects the selected phase, English restoration and atomic validation',()=>{
 const b=fixture(),r=b.slice();plusTrainingHudWriter(r,state(portuguese),b,['pre-partida']);assert.deepEqual(r,b);
 plusTrainingHudWriter(r,state(Object.fromEntries(fields.map(([id,en])=>[id,en]))),b);assert.deepEqual(r,b);
 for(const values of [{...portuguese,start:'@'},Object.fromEntries(fields.map(([id])=>[id,'A'.repeat(20)]))]){assert.throws(()=>plusTrainingHudWriter(r,state(values),b));assert.deepEqual(r,b);}
 const bad=b.slice();bad[0x120981]=0;assert.throws(()=>plusTrainingHudWriter(r,state(portuguese),bad),/referência/);assert.deepEqual(r,b);
});
