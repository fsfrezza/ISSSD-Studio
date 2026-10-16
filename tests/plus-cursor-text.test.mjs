import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CURSOR_HELP_FIELDS as fields} from '../src/core/cursor-text-fields.mjs';
import {encodeCursorText,decodeCursorText,plusCursorTextWriter} from '../src/core/plus-cursor-text.mjs';
import {pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {seedCursorTextFixture} from './cursor-text-fixture.mjs';
import {auditCursorTexts} from '../scripts/audit-cursor-texts.mjs';
const state=values=>({additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'cursor-labels':values}}});
test('Cursor audit covers all 14 native table pointers and ends before controller action help',()=>{
 const audit=JSON.parse(fs.readFileSync(new URL('../project-data/cursor-text-audit.json',import.meta.url)));
 assert.deepEqual(fields,audit.fields);assert.equal(fields.length,14);
 assert.deepEqual(fields.map(f=>f[0]),['pageHelp','typeIntro','typeAHelp','typeBHelp','typeCHelp','typeDHelp','areaIntro','areaHelp','areaAHelp','areaBHelp','areaCHelp','cursorAutoHelp','cursorManualHelp','keeperHelp']);
 for(let i=0;i<fields.length;i++){
  const f=fields[i],n=f[3].native;assert.equal(n.pointerPc,0x3CB0F+i*2);assert.equal(n.width,28);
  const next=fields[i+1]?.[3].native.pc??0x3D2E0;
  assert.equal(n.pc+n.width*n.rowCount+(n.terminator===null?0:1),next);
  assert.equal(decodeCursorText(f,encodeCursorText(f,f[1])),f[1]);
 }
 assert.equal(fields.find(f=>f[0]==='typeBHelp')[3].native.terminator,null,'Type B shares the following block boundary; do not invent a terminator');
 assert.throws(()=>auditCursorTexts(new Uint8Array(0x200000)),/não reconhecida/);
});
test('Cursor writer preserves pointers, neighboring help, control bytes and immutable base',()=>{
 const base=seedCursorTextFixture(new Uint8Array(0x40000).fill(0xA5)),before=base.slice(),rom=base.slice();
 const field=fields.find(f=>f[0]==='typeBHelp'),n=field[3].native;
 plusCursorTextWriter(rom,state({typeBHelp:'TIPO B\nControle os defensores.\nUse o direcional.'}),base,['pre-partida']);
 assert.match(decodeCursorText(field,rom.slice(n.pc,n.pc+n.width*n.rowCount)),/^TIPO B\nControle os defensores/);
 for(let i=0;i<rom.length;i++)if(rom[i]!==base[i])assert.ok(i>=n.pc&&i<n.pc+n.width*n.rowCount,'no writes outside Type B text');
 assert.deepEqual(base,before);assert.deepEqual(pendingAdditionalTextExports(state({typeBHelp:'TIPO B'})),[],'implemented help does not appear as pending');
 const skipped=base.slice();plusCursorTextWriter(skipped,state({typeBHelp:'TIPO B'}),base,['jogadores']);assert.deepEqual(skipped,base);
});
test('Cursor font supports spaces, empty help, punctuation and C instead of Ç without truncation',()=>{
 const f=fields[0];assert.equal(decodeCursorText(f,encodeCursorText(f,'AÇÃO L/R')),'ACAO L/R\n');
 assert.ok(encodeCursorText(f,'').every(b=>b===0));
 const wrapped=decodeCursorText(f,encodeCursorText(f,'Troque a página usando os botões L/R.'));
 assert.match(wrapped,/Troque a pagina usando os\nbotoes L\/R\./);
 assert.throws(()=>encodeCursorText(f,'X'.repeat(29)),/palavra ultrapassa/);
 assert.throws(()=>encodeCursorText(f,'a\nb\nc'),/texto precisa de 3 linhas/);
 assert.throws(()=>encodeCursorText(f,'🙂'),/caractere não disponível/);
});
test('legacy control-labels page help is still written and confirmed Cursor values take precedence',()=>{
 const base=seedCursorTextFixture(new Uint8Array(0x40000)),rom=base.slice();
 const legacy={additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'control-labels':{pageHelp:'ANTIGO'},'cursor-labels':{pageHelp:'NOVO L/R'}}}};
 plusCursorTextWriter(rom,legacy,base);const n=fields[0][3].native;assert.equal(decodeCursorText(fields[0],rom.slice(n.pc,n.pc+56)),'NOVO L/R\n');
 const draft={additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',drafts:{'cursor-labels':{pageHelp:'NAO CONFIRMADO'}}}};
 const unchanged=base.slice();plusCursorTextWriter(unchanged,draft,base);assert.deepEqual(unchanged,base);
});
test('unverified Cursor pointers and changed source bytes still fail instead of corrupting the ROM',()=>{
 const base=seedCursorTextFixture(new Uint8Array(0x40000)),n=fields[0][3].native;
 const wrongPointer=base.slice();wrongPointer[n.pointerPc]^=1;assert.throws(()=>plusCursorTextWriter(wrongPointer.slice(),state({pageHelp:'TESTE'}),wrongPointer),/ponteiro/);
 const wrongText=base.slice();wrongText[n.pc]^=1;assert.throws(()=>plusCursorTextWriter(wrongText.slice(),state({pageHelp:'TESTE'}),wrongText),/texto-base/);
});


test('confirming original Cursor text restores its immutable source after a legacy patch',()=>{
 const base=seedCursorTextFixture(new Uint8Array(0x40000)),work=base.slice(),f=fields[0],n=f[3].native;
 work.set(encodeCursorText(f,'ANTIGO'),n.pc);plusCursorTextWriter(work,state({pageHelp:f[1]}),base);
 assert.deepEqual(work,base);
});
