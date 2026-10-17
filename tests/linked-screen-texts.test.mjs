import test from 'node:test';
import assert from 'node:assert/strict';
import {LINKED_SCREEN_FIELDS,plusLinkedScreenTextWriter} from '../src/core/plus-linked-screen-text.mjs';
import {NATIVE_MENU_FONTS,NATIVE_MENU_TEXT_SECTIONS} from '../src/core/native-menu-text-fields.mjs';
import {ADDITIONAL_TEXT_SECTIONS} from '../src/core/additional-screen-text-fields.mjs';
import {USER_PORTUGUESE_PRESETS} from '../src/core/user-portuguese-presets.mjs';
import {plusNativeMenuTextWriter,encodeNativeMenuField} from '../src/core/plus-native-menu-text.mjs';
import {areaClassifier} from '../src/core/cumulative-areas.mjs';
function fixture(){const b=new Uint8Array(0x200000).fill(0xa5);for(const [, ,pc,,,font,en] of LINKED_SCREEN_FIELDS)b.set(Uint8Array.from(en,c=>NATIVE_MENU_FONTS[font][c]),pc);b.set([0x76,0x75,0x6c,0,0x6d,0x76,0x7c,0x79],0x3ca1d);return b;}
function decode(b,font){const reverse=Object.fromEntries(Object.entries(NATIVE_MENU_FONTS[font]).map(([k,v])=>[v,k]));return [...b].map(v=>reverse[v]??'?').join('');}
test('confirmed game-mode labels and descriptions reach their native slots without changing the project or base',()=>{
 const base=fixture(),before=base.slice(),rom=base.slice(),s={screenTextsV1:{values:{'game-modes':USER_PORTUGUESE_PRESETS.screen['game-modes']}}},saved=structuredClone(s);
 plusLinkedScreenTextWriter(rom,s,base,['pre-partida']);assert.deepEqual(base,before);assert.deepEqual(s,saved);
 for(const [owner,id,pc,w,h,font] of LINKED_SCREEN_FIELDS){const actual=decode(rom.slice(pc,pc+w*h),font).replace(/\s+/g,' ').trim();assert.equal(actual,s.screenTextsV1.values[owner][id]);}
 const ignored=base.slice();plusLinkedScreenTextWriter(ignored,s,base,['jogadores']);assert.deepEqual(ignored,base);
});
test('ONE and FOUR preserve the native +4 offset and obey the strategy checkbox',()=>{
 const base=fixture(),rom=base.slice(),state={additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'strategy-labels':{one:'1',four:'4'}}}};
 plusLinkedScreenTextWriter(rom,state,base,['textos-estrategias']);assert.equal(decode(rom.slice(0x3ca1d,0x3ca25),'TallMenuText'),'1   4   ');
 const ignored=base.slice();plusLinkedScreenTextWriter(ignored,state,base,['pre-partida']);assert.deepEqual(ignored,base);
});
test('handicap help includes the former untranslated Press prefix and wraps whole words at the runtime width',()=>{
 const section=NATIVE_MENU_TEXT_SECTIONS.find(s=>s.id==='handicap-native'),field=section.fields.find(f=>f[0]==='data_87c884'),base=fixture();
 const original=encodeNativeMenuField(field,field[1]);field[3].pool.segments.forEach((seg,i)=>base.set(original[i],seg.pc));
 const rom=base.slice();plusNativeMenuTextWriter(rom,{additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{[section.id]:{[field[0]]:USER_PORTUGUESE_PRESETS.additional[section.id][field[0]]}}}},base);
 const text=decode(rom.slice(0x3c884,0x3c8ba),'TallMenuText');assert.ok(!text.startsWith('Press'));assert.equal(text.replace(/\s+/g,' ').trim(),'SELECT para trocar controles de 1P e CPU.');
 const classify=areaClassifier(rom,base);for(let i=0x3c884;i<0x3c8ba;i++)assert.equal(classify(i),'pre-partida');
 assert.ok(!text.slice(0,27).endsWith('c'),'do not split controles across native rows');
});
test('every Portuguese preset supplied by the user remains verbatim and FALTAM is the default',()=>{
 for(const section of ADDITIONAL_TEXT_SECTIONS)for(const [id,,pt] of section.fields)if(Object.hasOwn(USER_PORTUGUESE_PRESETS.additional[section.id]||{},id))assert.equal(pt,USER_PORTUGUESE_PRESETS.additional[section.id][id]);
 assert.equal(ADDITIONAL_TEXT_SECTIONS.find(s=>s.id==='player-labels').fields.find(f=>f[0]==='pointsLeft')[2],'FALTAM');
 assert.equal(ADDITIONAL_TEXT_SECTIONS.find(s=>s.id==='navigation-labels').fields.find(f=>f[0]==='cancel')[2],'DESFAZ');
});
