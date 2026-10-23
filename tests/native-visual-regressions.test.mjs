import {seedMenuOamCacheFixture} from './menu-oam-cache-fixture.mjs';
import {MENU_OAM_CACHE_SLOT,MENU_OAM_PLANE_SIZE,convertedMenuOam} from '../src/core/plus-menu-oam-cache.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {executeHook} from './65816-hook-harness.mjs';
import {SQUAD_OAM_CACHE_SLOT,SQUAD_OAM_PLANE,SQUAD_OAM_DEST,SQUAD_OAM_POINTERS,STADIUM_OAM_CACHE_SLOT,STADIUM_OAM_PLANE,TEAM_NAME_CACHE_SLOT,TEAM_NAME_CACHE_PLANE,teamNameHookWrites,TEAM_NAME_HOOK_SLOT,TEAM_NAME_POINTER_READS} from '../src/core/plus-team-name-hooks.mjs';
import {renderBigTeamNames} from '../src/core/plus-team-names.mjs';
import {encodeTrainingHud} from '../src/core/plus-training-hud.mjs';
import {TRAINING_HUD_FIELDS} from '../src/core/training-hud-fields.mjs';
import {GRAPHICAL_LABEL_ASSETS} from '../src/core/graphical-label-layout.mjs';
import {seedGraphicalLabelFixture} from './graphical-label-fixture.mjs';
import {plusGraphicalLabelsWriter,transformLabelPlanes} from '../src/core/plus-graphical-labels.mjs';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),word=(m,a)=>m[a]|m[a+1]<<8;
function hooks(){const base=new Uint8Array(0x200000).fill(255);base.set([0x9C,0x66,0x14,0x22,0x82,0x9E,0x85],0x2A756);for(const [p,op]of [[0x3B00,0x7E],[0x3B59,0x82]])base.set([0x22,op,0x94,0x80],p);for(const p of TEAM_NAME_POINTER_READS)base.set([0xBF,0xC4,0xFB,0x82],p);seedMenuOamCacheFixture(base);const memory=new Uint8Array(0x1000000);for(const [pc,data]of teamNameHookWrites(base,renderBigTeamNames(Array(56).fill('BRASIL')).raw))memory.set(data,cpu(pc));return memory;}
test('actual emitted OAM wrappers preserve cursor objects and move all four cached planes before a stadium conversion',()=>{
 for(const [from,to,nativeY]of [[0x5A00,0x5280,0x5876],[0x5280,0x5A00,0x5600]])for(const entry of [0,0x40]){
  const m=hooks(),data=m.slice(cpu(TEAM_NAME_CACHE_SLOT),cpu(TEAM_NAME_CACHE_SLOT)+TEAM_NAME_CACHE_PLANE);for(let p=0;p<4;p++)m.fill(0xDB,0x7E0000+from+p*0x2000,0x7E0000+from+p*0x2000+data.length);m.set([from&255,from>>8],0x7E5FF8);m.set([from&255,from>>8],0x7E5FFA);
  const initial={a:255,x:0x8E42,y:nativeY,p:0x81},out=executeHook(m,cpu(TEAM_NAME_HOOK_SLOT+entry),initial,new Set([0x80947E,0x809482]));assert.equal(out.calls.length,1);assert.equal(out.calls[0].y,nativeY);assert.equal(out.calls[0].a,255);assert.equal(out.calls[0].p,initial.p&~0x82);assert.equal(out.r.s,0x1FF);
  assert.equal(word(m,0x7E5FF8),to);for(let p=0;p<4;p++)assert.deepEqual(m.slice(0x7E0000+to+p*0x2000,0x7E0000+to+p*0x2000+data.length),m.slice(cpu(TEAM_NAME_CACHE_SLOT)+p*TEAM_NAME_CACHE_PLANE,cpu(TEAM_NAME_CACHE_SLOT)+(p+1)*TEAM_NAME_CACHE_PLANE));
  assert.ok(to+data.length<=nativeY||to>=nativeY+(nativeY===0x5876?0x63C:0x1D2));
 }
});
test('unrelated OAM conversions do not redirect Y or replace the name cache',()=>{
 const m=hooks();m.set([0x80,0x52],0x7E5FF8);m.set([0x80,0x52],0x7E5FFA);for(const y of [0x4000,0x4500,0x5238]){const o=executeHook(m,cpu(TEAM_NAME_HOOK_SLOT),{a:255,x:22,y,p:3},new Set([0x80947E]));assert.equal(o.calls[0].y,y);assert.equal(o.calls[0].x,22);assert.equal(word(m,0x7E5FF8),0x5280);}
});
test('TEMPO never enters the two cells cleared after both training clocks are drawn',()=>{
 const field=TRAINING_HUD_FIELDS.find(f=>f[0]==='time'),encoded=encodeTrainingHud(field,'TEMPO');assert.equal(word(encoded,0),0x5B58);assert.deepEqual([...encoded.slice(2,7)],[20,5,13,16,15]);assert.ok(word(encoded,0)>0x5B57);
});
test('BRASIL keeps visible I strokes after native OAM priority composes neighbouring outlines',()=>{
 const r=renderBigTeamNames(['BRASIL']),canvas=Array.from({length:16},()=>new Uint8Array(80)),n=r.count,header=3+r.raw[0];
 for(let i=0;i<n;i++){const x=r.raw[header+i],y=r.raw[header+n+i]-1,tile=r.raw[header+2*n+i]-0x80;for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){let v=0;for(let p=0;p<4;p++)v|=(r.font[tile*32+(p>>1)*16+yy*2+(p&1)]>>(7-xx)&1)<<p;if(v&&!canvas[y+yy][x+xx])canvas[y+yy][x+xx]=v;}}
 const iTile=r.dictionary.findIndex((s,k)=>s.includes('I')&&r.raw.slice(header+2*n,header+3*n).includes(0x80+k*2));assert.ok(iTile>=0);const sprite=Array.from({length:n},(_,i)=>i).find(i=>r.raw[header+2*n+i]===0x80+iTile*2);assert.notEqual(sprite,undefined);const origin=r.raw[header+sprite],token=r.dictionary[iTile],ix=origin+(token.length===2&&token[1]==='I'?7:0);assert.ok(canvas.reduce((n,row)=>n+(row[ix]===10),0)>=10,'the I retains its full vertical white stroke');
});
test('formation keeps native DF and renders literal CANCELA without looking up NUMBER tiles',()=>{
 const base=seedGraphicalLabelFixture(new Uint8Array(0x200000).fill(255)),rom=new Uint8Array(0x400000).fill(255);rom.set(base);const values={'navigation-labels':{cancel:'CANCELA'},'formation-labels':{defenders:'DF',midfielders:'MC',forwards:'AT'}};plusGraphicalLabelsWriter(rom,{additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values}},base,['formacoes']);
 assert.deepEqual(rom.slice(0xD0C20,0xD0C40),base.slice(0xD0C20,0xD0C40),'native DF strip must remain byte-exact');assert.deepEqual(rom.slice(0x10EB4,0x10EB7),base.slice(0x10EB4,0x10EB7),'native DF top/button art must not be replaced');
 const nativeFont=konamiLzDecompress(base,0xD81FA).data;for(const [text,pc]of [['MC',0xD0C00],['AT',0xD0BE0]])for(let i=0;i<2;i++)assert.deepEqual(rom.slice(pc+i*16,pc+(i+1)*16),nativeFont.slice((text.charCodeAt(i)-65)*16,(text.charCodeAt(i)-64)*16));
 const asset=GRAPHICAL_LABEL_ASSETS.find(a=>a.id==='attackParticipation'),nativeBottom=transformLabelPlanes(konamiLzDecompress(base,asset.pc).data),writtenBottom=transformLabelPlanes(konamiLzDecompress(rom,asset.slot).data);assert.deepEqual(writtenBottom.slice(0,64),nativeBottom.slice(0,64),'original DF button pixels and palette remain exact');
 const m=new Uint8Array(0x1000000);m.set(rom.slice(0x3E3200,0x3E3240),cpu(0x3E3200));m.set([0,0x3D],6);for(let i=0;i<6;i++){const o=executeHook(m,cpu(0x3E3200),{x:i*2,y:0xFB92+i});assert.equal(o.r.a,0x3D00+i);assert.equal(o.r.x,i*2);}
 m.set([0xD3,0],0x87C018);const native=executeHook(m,cpu(0x3E3200),{x:2,y:0xC218});assert.equal(native.r.a,0x3DD3,'other native captions retain their table lookup');
});

test('cached stadium and team selection keep names away from their country objects; returning menus restore the overwritten cursor planes',()=>{
 const memory=hooks(),name=memory.slice(cpu(TEAM_NAME_CACHE_SLOT),cpu(TEAM_NAME_CACHE_SLOT)+TEAM_NAME_CACHE_PLANE),cache=memory.slice(cpu(MENU_OAM_CACHE_SLOT),cpu(MENU_OAM_CACHE_SLOT)+MENU_OAM_PLANE_SIZE*4);
 for(const ret of [0xAC3E,0xAC2F,0x9E8A,0xAD0D,0xC7DF,0xBDA0,0x8BDC,0xABED]){
  const m=memory.slice();for(let p=0;p<4;p++)m.fill(0xCC,0x7E5280+p*0x2000,0x7E5FF6+p*0x2000);m.set([0,0x5A],0x7E5FF8);m.set([0,0x5A],0x7E5FFA);const sp=0x1E0;m.set([0x59,0xA7,0x85,ret&255,ret>>8,ret===0x9E8A?0xA4:0x85],sp+1);
  executeHook(m,cpu(TEAM_NAME_HOOK_SLOT+0x80),{s:sp,a:0xFFFF,x:22,y:44},new Set([0x859E82]));const expected=[0xAC3E,0xAC2F,0x9E8A].includes(ret)?0x5A00:0x5280;assert.equal(word(m,0x7E5FF8),expected);
  for(let p=0;p<4;p++){assert.deepEqual(m.slice(0x7E0000+expected+p*0x2000,0x7E0000+expected+p*0x2000+name.length),memory.slice(cpu(TEAM_NAME_CACHE_SLOT)+p*TEAM_NAME_CACHE_PLANE,cpu(TEAM_NAME_CACHE_SLOT)+(p+1)*TEAM_NAME_CACHE_PLANE));if(expected===0x5A00)assert.deepEqual(m.slice(0x7E5600+p*0x2000,0x7E5600+p*0x2000+STADIUM_OAM_PLANE),memory.slice(cpu(STADIUM_OAM_CACHE_SLOT)+p*STADIUM_OAM_PLANE,cpu(STADIUM_OAM_CACHE_SLOT)+(p+1)*STADIUM_OAM_PLANE));if(expected===0x5280)assert.deepEqual(m.slice(0x7E5876+p*0x2000,0x7E5876+p*0x2000+MENU_OAM_PLANE_SIZE),cache.slice(p*MENU_OAM_PLANE_SIZE,(p+1)*MENU_OAM_PLANE_SIZE));}
 }
});

test('normal-match penalty names never overwrite any live ball animation plane inherited from the field',()=>{
 for(const entry of [0,0x40]){
  const m=hooks();m.set([0x80,0x52],0x7E5FF8);m.set([0x80,0x52],0x7E5FFA);
  const nativeBall=Uint8Array.from({length:0x5E},(_,i)=>(i*37+11)&255);
  for(let p=0;p<4;p++)m.set(nativeBall,0x7E557A+p*0x2000);
  const out=executeHook(m,cpu(TEAM_NAME_HOOK_SLOT+entry),{a:255,x:0x96B8,y:0x4F02,p:0x81},new Set([0x80947E,0x809482]));
  assert.equal(out.calls.length,1);assert.equal(out.calls[0].y,0x5A00);assert.equal(out.calls[0].x,0x96B8);assert.equal(out.calls[0].a,255);assert.equal(out.r.s,0x1FF);assert.equal(word(m,0x7E5FF8),0x5A00);
  for(let p=0;p<4;p++){
   // The native converter writes the same four planes at its requested Y.
   m.set(m.slice(cpu(TEAM_NAME_CACHE_SLOT)+p*TEAM_NAME_CACHE_PLANE,cpu(TEAM_NAME_CACHE_SLOT)+(p+1)*TEAM_NAME_CACHE_PLANE),0x7E0000+out.calls[0].y+p*0x2000);
   assert.deepEqual(m.slice(0x7E557A+p*0x2000,0x7E55D8+p*0x2000),nativeBall,'every ball frame and property survives, including the descending high shot');
  }
 }
 const unrelated=hooks();unrelated.set([0x80,0x52],0x7E5FFA);const out=executeHook(unrelated,cpu(TEAM_NAME_HOOK_SLOT),{a:255,x:0x8E4C,y:0x4F02},new Set([0x80947E]));assert.equal(out.calls[0].y,0x5280,'other menu names retain their existing layout');
});


test('substitution object planes and all fourteen frame pointers stay outside expanded team names across cached screen returns',()=>{
 const memory=hooks(),cache=memory.slice(cpu(SQUAD_OAM_CACHE_SLOT),cpu(SQUAD_OAM_CACHE_SLOT)+SQUAD_OAM_PLANE*4);
 assert.ok(SQUAD_OAM_DEST>=0x5876+MENU_OAM_PLANE_SIZE);
 assert.ok(SQUAD_OAM_DEST+SQUAD_OAM_PLANE<=0x5FF8);
 for(const pc of SQUAD_OAM_POINTERS){const pointer=word(memory,cpu(pc));assert.ok(pointer>=SQUAD_OAM_DEST&&pointer<SQUAD_OAM_DEST+SQUAD_OAM_PLANE);}
 for(let visit=0;visit<3;visit++){
  for(let plane=0;plane<4;plane++)memory.fill(0xDB,0x7E5280+plane*0x2000,0x7E5FF6+plane*0x2000);
  memory.set([0x80,0x52],0x7E5FFA);
  const out=executeHook(memory,cpu(TEAM_NAME_HOOK_SLOT+0x120),{a:0x1234,x:0x5678,y:0x90AB,p:0x81});assert.equal(out.r.a,0x1234);assert.equal(out.r.x,0x5678);assert.equal(out.r.y,0x90AB);assert.equal(out.r.s,0x1FF);
  for(let plane=0;plane<4;plane++)assert.deepEqual(memory.slice(0x7E0000+SQUAD_OAM_DEST+plane*0x2000,0x7E0000+SQUAD_OAM_DEST+plane*0x2000+SQUAD_OAM_PLANE),cache.slice(plane*SQUAD_OAM_PLANE,(plane+1)*SQUAD_OAM_PLANE));
 }
});
