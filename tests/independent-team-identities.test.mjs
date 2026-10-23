import test from 'node:test';
import assert from 'node:assert/strict';
import {GG_DEFAULT_IDENTITIES,applyIndependentKitColors,independentKitColors} from '../src/core/independent-teams.mjs';
const palette=()=>[31,0,...Array.from({length:16},(_,i)=>[i,0]).flat()];
test('six GG identities match requested names, initials and predominant colors',()=>{
 assert.deepEqual(GG_DEFAULT_IDENTITIES.map(x=>x.name),['ADIPOSOS','BUGIGANGAS','ENCEFALICOS','MACUCOS','TELURICOS','VAPOROSOS']);
 for(const identity of GG_DEFAULT_IDENTITIES){assert.equal(identity.short,identity.name.slice(0,3));assert.ok(Object.isFrozen(identity));}
 assert.deepEqual(GG_DEFAULT_IDENTITIES.map(x=>[x.primary,x.secondary]),[['#FF8000','#101010'],['#001840','#D82020'],['#101010','#FFFFFF'],['#FFFFFF','#008040'],['#0060D0','#101010'],['#FFE000','#D82020']]);
});
test('GG kit recoloring is independent and preserves all skin/hair data',()=>{
 const original={palettes:{home:palette(),away:palette(),skinAlt:[1,2,3,4]},attributes:[22,33],pattern:[4,5]};const before=structuredClone(original);
 const first=applyIndependentKitColors(original,'#FF8000','#101010');const second=applyIndependentKitColors(original,'#001840','#D82020');
 assert.deepEqual(original,before);assert.notDeepEqual(first.palettes.home,second.palettes.home);
 for(const kit of ['home','away'])assert.deepEqual(first.palettes[kit].slice(0,16),original.palettes[kit].slice(0,16));
 assert.deepEqual(first.palettes.skinAlt,original.palettes.skinAlt);
 const colors=independentKitColors('#FF8000','#101010');assert.equal(colors.length,9);assert.ok(colors.every(x=>Number.isInteger(x)&&x>=0&&x<=32767));
 assert.deepEqual(first.palettes.home.slice(16),colors.flatMap(x=>[x&255,x>>8]));
 first.attributes[0]=99;first.pattern[0]=99;assert.equal(original.attributes[0],22);assert.equal(original.pattern[0],4);
 assert.throws(()=>independentKitColors('orange','#000000'),/inválidas/);
});

test('GG tall-name lookup copies only the selected opponent into two bounded WRAM slots',async()=>{
 const {independentTeamNameHelper}=await import('../src/core/plus-independent-teams.mjs');
 const {executeHook}=await import('./65816-hook-harness.mjs');
 const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),put=(m,p,v)=>{m[p]=v&255;m[p+1]=v>>8;};
 const offsets=Array.from({length:6},(_,i)=>i*40);offsets.table=0x2DA000;
 for(let id=54;id<60;id++)for(const side of[0,1])for(const gap of[0x5280,0x5A00]){
  const m=new Uint8Array(0x1000000),cache=0x2DB000,plane=240;
  m.set(independentTeamNameHelper(offsets,cache,plane,1400,40),0xE00000);
  for(let p=0;p<4;p++)for(let i=0;i<6;i++)m.fill(p*20+i+1,cpu(cache)+p*plane+i*40,cpu(cache)+p*plane+(i+1)*40);
  put(m,0x7E0DA0,side?0:id*2);put(m,0x7E5FF8,gap);
  const initial={a:0x9999,x:id*2,y:0x4321,db:0x81,p:9};
  const{r}=executeHook(m,0xE00000,initial);
  assert.equal(r.a,gap+1400+side*40);for(const k of['x','y','db'])assert.equal(r[k],initial[k]);assert.equal(r.s,0x1FF);
  for(let p=0;p<4;p++){const start=0x7E0000+gap+1400+side*40+p*0x2000;assert.ok(m.slice(start,start+40).every(v=>v===p*20+id-54+1));assert.equal(m[start-1],0);assert.equal(m[start+40],0);}
  assert.equal(m[0x7E5FF8]|m[0x7E5FF9]<<8,gap);
 }
 const m=new Uint8Array(0x1000000);m.set(independentTeamNameHelper(offsets,0x2DB000,240,1400,40),0xE00000);put(m,cpu(offsets.table)+4,0x123);put(m,0x7E5FF8,0x5280);assert.equal(executeHook(m,0xE00000,{x:4}).r.a,0x53A3);
});

test('expanded palette dispatcher copies exact payloads and leaves native low-address palettes on their original path',async()=>{
 const{independentPaletteCopyHelper}=await import('../src/core/plus-independent-teams.mjs'),{executeHook}=await import('./65816-hook-harness.mjs');
 const w=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>8;};
 for(const pointer of[0x6000,0x6FFE,0x7F00]){
  const m=new Uint8Array(0x1000000);m.set([0x8B,0xDA,0x5A,0x5C,0,0x10,0xE0],0xE00000);m.set(independentPaletteCopyHelper(),0xE01000);w(m,0x819176+0x30,0x2D00);w(m,0xDC8000+pointer,31);const payload=Uint8Array.from({length:32},(_,i)=>i+3);m.set(payload,0xDC8000+pointer+2);m.fill(0xAA,0x7E2CFF,0x7E2D21);
  const{r}=executeHook(m,0xE00000,{a:0x30,x:0x1234,y:pointer,db:0x81});assert.deepEqual(m.slice(0x7E2D00,0x7E2D20),payload);assert.equal(m[0x7E2CFF],0xAA);assert.equal(m[0x7E2D20],0xAA);assert.equal(r.x,0x1234);assert.equal(r.y,pointer);assert.equal(r.db,0x81);assert.equal(r.s,0x1FF);
 }
 for(const y of[0x0001,0x2D00,0x5FFE,0x8000,0xFFFF]){const m=new Uint8Array(0x1000000);m.set(independentPaletteCopyHelper(),0xE00000);const{r,calls}=executeHook(m,0xE00000,{a:0x31,x:4,y},new Set([0x80A4F3]));assert.equal(calls.length,1);assert.equal(r.a,0x30);assert.equal(r.x,0x30);assert.equal(r.y,y);}
});

test('scoreboard GG cache queues both native uploads and preserves scratch and caller registers',async()=>{
 const{independentShortNameHelper}=await import('../src/core/plus-independent-teams.mjs'),{executeHook}=await import('./65816-hook-harness.mjs');const m=new Uint8Array(0x1000000),w=(a,v)=>{m[a]=v&255;m[a+1]=v>>8;};m.set(independentShortNameHelper(0x2DC000),0xE00000);w(0,0x1234);w(0x7E17D4,59*64);w(0x7E17D9,56*64);const initial={a:0xFFFF,x:0x17D0,y:0x5678,db:0x81,p:9};const{r,calls}=executeHook(m,0xE00000,initial,new Set([0x808E37]));assert.deepEqual(calls.map(c=>[c.a,c.x,c.y]),[[0xC000+59*64,64,0x5F50],[0xC000+56*64,64,0x5FD0]]);for(const k of Object.keys(initial))assert.equal(r[k],initial[k]);assert.equal(r.s,0x1FF);assert.equal(m[0]|m[1]<<8,0x1234);
});
