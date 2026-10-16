import test from 'node:test';
import assert from 'node:assert/strict';
import {CURSOR_LABEL_GFX as GFX} from '../src/core/cursor-label-layout.mjs';
import {plusCursorTextWriter,encodeCursorText,decodeCursorText} from '../src/core/plus-cursor-text.mjs';
import {CURSOR_HELP_FIELDS} from '../src/core/cursor-text-fields.mjs';
import {ADDITIONAL_TEXT_SECTIONS,pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
import {seedCursorTextFixture} from './cursor-text-fixture.mjs';
const state=values=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'cursor-labels':values}}});
const seedCursorLabels=seedCursorTextFixture;
const presets=()=>Object.fromEntries(ADDITIONAL_TEXT_SECTIONS.find(s=>s.id==='cursor-labels').fields.map(([id,,pt])=>[id,pt]));
test('all 26 Cursor presets write and only touch classified pre-match ranges',()=>{
 const base=seedCursorLabels(new Uint8Array(0x200000)),before=base.slice(),rom=base.slice();
 plusCursorTextWriter(rom,state(presets()),base);assert.deepEqual(base,before);assert.deepEqual(pendingAdditionalTextExports(state(presets())),[]);
 assert.deepEqual([...rom.slice(GFX.pointerPc,GFX.pointerPc+3)],[0,0xfc,0x87]);
 const decoded=konamiLzDecompress(rom,GFX.relocatedPc).data;assert.equal(decoded.length,448);assert.notEqual(Buffer.from(decoded).toString('hex'),GFX.rawHex);
 const classify=areaClassifier(rom,base);for(let i=0;i<rom.length;i++)if(rom[i]!==base[i])assert.equal(classify(i),'pre-partida',i.toString(16));
 const f=CURSOR_HELP_FIELDS.find(f=>f[0]==='typeAHelp'),n=f[3].native;
 const text=decodeCursorText(f,rom.slice(n.pc,n.pc+n.width*n.rowCount));assert.match(text,/^-TIPO-A-\n/);
 assert.deepEqual(rom.slice(n.pc+28,n.pc+n.width*n.rowCount),encodeCursorText(f,presets().typeAHelp).slice(28));
 const skip=base.slice();plusCursorTextWriter(skip,state(presets()),base,['jogadores']);assert.deepEqual(skip,base);
});
test('approved CURSOR ALTERA fallback matches its explicit rendering; oversized or unsupported text fails',()=>{
 const base=seedCursorLabels(new Uint8Array(0x200000)),a=base.slice(),b=base.slice();
 plusCursorTextWriter(a,state({cursorChange:'TROCA DE CURSOR'}),base);plusCursorTextWriter(b,state({cursorChange:'CURSOR ALTERA'}),base);assert.deepEqual(a,b);
 assert.throws(()=>plusCursorTextWriter(base.slice(),state({cursorChange:'MUITO TEXTO PARA ESSE ROTULO'}),base),/24 px/);
 assert.throws(()=>plusCursorTextWriter(base.slice(),state({type:'🙂'}),base),/indisponível/);
 assert.throws(()=>plusCursorTextWriter(base.slice(),state({cursorAuto:'AUTOMATICO'}),base),/até 5/);
});
test('Cursor graphics refuses unknown source, pointer or occupied reserved area',()=>{
 const base=seedCursorLabels(new Uint8Array(0x200000));
 for(const pc of [GFX.pc+10,GFX.pointerPc,GFX.relocatedPc]){const wrong=base.slice();wrong[pc]^=1;assert.throws(()=>plusCursorTextWriter(wrong.slice(),state({type:'TIPO'}),wrong));}
});
test('confirmed English labels restore original graphics and popup headings exactly',()=>{
 const base=seedCursorLabels(new Uint8Array(0x200000)),rom=base.slice();plusCursorTextWriter(rom,state(presets()),base);
 const english=Object.fromEntries(ADDITIONAL_TEXT_SECTIONS.find(s=>s.id==='cursor-labels').fields.map(([id,en])=>[id,en]));plusCursorTextWriter(rom,state(english),base);assert.deepEqual(rom,base);
});
