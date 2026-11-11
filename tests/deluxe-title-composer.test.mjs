import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {splitRom} from '../src/core/deluxe-project.mjs';
import {createTitleComposer,validateTitleComposer,prepareTitleComposer,duplicateComposerLayer,renderTitleComposer} from '../src/core/deluxe-title-composer.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('composer preserves native graphics, serializes layers and rejects changes outside ROM areas',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,s=createTitleComposer(base),snapshot=base.slice();assert.equal(s.elements.length,8);assert.deepEqual(prepareTitleComposer(base,{},s),{});assert.deepEqual(renderTitleComposer(JSON.parse(JSON.stringify(s))),renderTitleComposer(s));
 duplicateComposerLayer(s);duplicateComposerLayer(s);assert.throws(()=>duplicateComposerLayer(s),/dez/);assert.equal(s.elements.length,10);
 const moved=createTitleComposer(base);moved.elements.find(e=>e.role==='logo').x=-100;assert.throws(()=>prepareTitleComposer(base,{},moved),/fora da área|sem sprites/);assert.deepEqual(base,snapshot);
 const bad=structuredClone(s);bad.assets.logo.rgbaBase64='AA==';assert.throws(()=>validateTitleComposer(bad),/imagem inválida/);
 const hidden=createTitleComposer(base);hidden.elements.find(e=>e.role==='logo').visible=false;const result=prepareTitleComposer(base,{},hidden);assert.equal(result.logoTiles.length,3840);assert.equal(result.photoTiles,undefined);
});
