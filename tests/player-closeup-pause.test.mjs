import test from 'node:test';import assert from 'node:assert/strict';
import{closeupHelper,closeupPalette,CLOSEUP_PALETTE_SLOT,CLOSEUP_STYLE_SLOT,CLOSEUP_HEAD_SLOT}from'../src/core/plus-player-closeup.mjs';
import{pauseTableHelper,pauseUploadHelper,PAUSE_TABLE_SLOT,PAUSE_LABEL_SLOT}from'../src/core/plus-pause-menu.mjs';
import{executeHook}from'./65816-hook-harness.mjs';
const cpu=p=>0x800000|(p>>15)<<16|0x8000|(p&32767),word=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>8;};
test('pause reader redirects only its private table; native replay and caller X survive',()=>{
 const m=new Uint8Array(0x1000000),entry=0xE00000;m.set(pauseTableHelper(),entry);
 for(const y of[0xE963,0xE971,0xEFFF,0xF000,0xF010,0xF01E,0xF020]){const at=y>=0xF000&&y<0xF020?cpu(PAUSE_TABLE_SLOT)+y-0xF000:0x810000+y;word(m,at,0x1234);const{r}=executeHook(m,entry,{y,x:0x789A});assert.equal(r.a,0x1234);assert.equal(r.x,0x789A);assert.equal(r.y,y);assert.equal(r.s,0x1FF);}
});
test('pause upload retains native cursor call and queues fourteen new tiles without changing caller context',()=>{
 const m=new Uint8Array(0x1000000),entry=0xE00000;m.set(pauseUploadHelper(),entry);word(m,0,0xC0);const initial={a:0xAA33,x:0x20,y:0x5D80,db:0x81,p:0x89};const{r,calls}=executeHook(m,entry,initial,new Set([0x808E37]));assert.equal(calls.length,2);assert.equal(calls[0].a,initial.a);assert.equal(calls[1].a,cpu(PAUSE_LABEL_SLOT)&65535);assert.equal(calls[1].x,224);assert.equal(calls[1].y,0x5E00);for(const k of Object.keys(initial))assert.equal(r[k],initial[k]);assert.equal(m[0],0xC0);assert.equal(r.s,0x1FF);
});
test('closeup helper follows both teams and current roster, including palette bank boundary, and keeps uniform memory intact',()=>{
 for(const team of[0,30,51,55])for(const slot of[0,19])for(const side of[0,1])for(const flipped of[0,1])for(const hair of[0,14,15]){
  const m=new Uint8Array(0x1000000),entry=0xE00000;m.set(closeupHelper(),entry);const key=team*20+slot;word(m,0x7E19A4,0x84);word(m,0x7E14D2,side?0xE00:0xD00);word(m,0x7E17C6,flipped);word(m,0x7E00A0+((side^flipped)?0xE00:0xD00),team*2);word(m,0x7E14FC,slot);word(m,cpu(CLOSEUP_STYLE_SLOT)+key*2,0x8000|hair);const address=cpu(CLOSEUP_PALETTE_SLOT+(key>=1024?0x8000:0))+(key%1024)*32;const palette=Uint8Array.from({length:32},(_,i)=>i+team);m.set(palette,address);m.fill(0xAB,0x7E2D20,0x7E2D60);word(m,0,0x1234);word(m,2,0x5678);
  const initial={a:0x99AA,x:0x1357,y:0x2468,p:0x89,db:0x81};const{r,calls}=executeHook(m,entry,initial,new Set([0x8B9098,0x808E37]));assert.deepEqual(m.slice(0x7E2D00,0x7E2D20),palette);assert.ok(m.slice(0x7E2D20,0x7E2D60).every(v=>v===0xAB));assert.equal(calls.length,5);assert.deepEqual(calls.slice(1).map(c=>c.y),[0x6000,0x6100,0x6040,0x6140]);assert.deepEqual(calls.slice(1).map(c=>c.a),(Array.from({length:4},(_,i)=>(cpu(CLOSEUP_HEAD_SLOT)&65535)+hair*256+i*64)));for(const k of Object.keys(initial))assert.equal(r[k],initial[k]);assert.equal(r.s,0x1FF);assert.equal(m[0],0x34);assert.equal(m[2],0x78);
 }
});
test('closeup helper leaves native non-victory scenes alone; palette shades are valid BGR555',()=>{
 for(const scene of[0x80,0x82]){const m=new Uint8Array(0x1000000);m.set(closeupHelper(),0xE00000);word(m,0x7E19A4,scene);const{calls,r}=executeHook(m,0xE00000,{},new Set([0x8B9098,0x808E37]));assert.equal(calls.length,1);assert.equal(r.s,0x1FF);}
 const p=closeupPalette([0,0x1234,0x111,0x222,0x333,0x444,0x555]);assert.equal(p.length,16);assert.ok(p.every(v=>v>=0&&v<=32767));assert.equal(p[7],0x555);assert.equal(p[15],0x111);
});

test('large head regeneration preserves native original tiles and keeps facial pixels when making the bald scalp',async()=>{
 const{closeupHeadTiles}=await import('../src/core/plus-player-closeup.mjs'),{encodeHairTile}=await import('../src/core/plus-custom-hair.mjs'),{konamiLzCompress}=await import('../src/core/konami-lz.mjs'),{transformLabelPlanes}=await import('../src/core/plus-graphical-labels.mjs');
 const base=new Uint8Array(0x200000),raw=new Uint8Array(2592),pixels=Uint8Array.from({length:64},(_,i)=>i%3===0?10:1);for(let t=0;t<81;t++)raw.set(encodeHairTile(pixels),t*32);base.set(konamiLzCompress(transformLabelPlanes(raw,true)),0x1127BB);
 const original=closeupHeadTiles(base,14),bald=closeupHeadTiles(base,0),cascao=closeupHeadTiles(base,15);assert.deepEqual(original,Uint8Array.from(Array.from({length:8},()=>[...encodeHairTile(pixels)]).flat()));assert.notDeepEqual(bald,original);assert.notDeepEqual(cascao,bald);assert.deepEqual(closeupHeadTiles(base,15,{hair:{'15:3':Array(64).fill(0)}}),bald);
});

test('final cinematic frame selection handles native special-team overrides and edited native hair',async()=>{
 const{closeupFrameHelper}=await import('../src/core/plus-player-closeup.mjs');
 for(const team of[30,55])for(const style of[0,1,14,15])for(const custom of[false,true]){
  const m=new Uint8Array(0x1000000);m.set(closeupFrameHelper(),0xE00000);word(m,0x7E19A4,0x84);word(m,0x7E14D2,0xD00);word(m,0x7E0DA0,team*2);word(m,0x7E14FC,19);word(m,cpu(CLOSEUP_STYLE_SLOT)+(team*20+19)*2,(custom?0x8000:0)|style);word(m,0x81F0A9+28,0x42AC);
  const{r}=executeHook(m,0xE00000,{x:0xCAFE,y:28,p:9});const expected=custom?0x40E4:0x42AC;assert.equal(r.a,expected);assert.equal(m[0x7E0900]|m[0x7E0901]<<8,expected);assert.equal(r.x,0xCAFE);assert.equal(r.y,28);assert.equal(r.p&0x7D,9);assert.equal(r.s,0x1FF);
 }
});
