import test from 'node:test';
import assert from 'node:assert/strict';
import {executeHook} from './65816-hook-harness.mjs';
import {DEFENSE_CENTER,DEFENSE_WALL,DEFENSE_KEEPER,backpassDefenseCenter,backpassDefenseWall,backpassDefenseKeeper} from '../src/core/backpass-defense.mjs';
import {backpassWallHelper,backpassWallArrival,WALL_HELPER,WALL_ARRIVAL,WALL_MARKER,NEAR_GOAL} from '../src/core/backpass-free-kick.mjs';
const set=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>8&255;},word=(m,a)=>m[a]|m[a+1]<<8;
function setup(){const m=new Uint8Array(0x1000000);for(const [a,f]of [[DEFENSE_CENTER,backpassDefenseCenter],[DEFENSE_WALL,backpassDefenseWall],[DEFENSE_KEEPER,backpassDefenseKeeper],[WALL_HELPER,backpassWallHelper]])m.set(f(),a);set(m,WALL_MARKER,0xBACC);set(m,0xC2,5);set(m,0xC0,5);set(m,0x12D8,320);set(m,0x12A2,1856);return m;}
test('lateral near-goal walls retain twelve-unit spacing within both posts for both goals and every native wall count',()=>{
 const m=setup();for(const side of [1,2])for(const count of [0,1,2,3,4,5])for(const lateral of [-320,-160,-80,-24,24,80,160,320]){
  set(m,NEAR_GOAL,side);set(m,0x11F6,count);set(m,0x11F2,320+lateral);const targets=[];
  for(let rank=1;rank<=count+1;rank++){set(m,0x668,rank);const {r}=executeHook(m,DEFENSE_WALL,{dp:0x600,x:400,a:500,y:77,p:1},new Set([0x84E509]));assert.equal(r.x,side===1?0:1856);assert.ok(r.y>=280&&r.y<=360,JSON.stringify({side,count,lateral,rank,y:r.y,half:word(m,0x640),center:word(m,0x644)}));assert.equal(r.s,511);assert.equal(r.dp,0x600);targets.push(r.y);}
  for(let i=1;i<targets.length;i++)assert.equal(targets[i]-targets[i-1],12);
 }
});
test('central validated geometry and ordinary restarts keep the v2 wall path',()=>{
 for(const lateral of [-23,0,23]){const m=setup();set(m,NEAR_GOAL,1);set(m,0x11F2,320+lateral);const {r}=executeHook(m,DEFENSE_WALL,{a:333,x:444,p:1},new Set([0x84E509]));assert.equal(r.y,333);assert.equal(r.x,0);}
 for(const kind of [0,1,2,3,4,6]){const m=setup();set(m,NEAR_GOAL,1);set(m,0xC2,kind);const {r}=executeHook(m,DEFENSE_WALL,{a:333,x:444,p:1},new Set([0x84E509]));assert.equal(r.y,333);assert.equal(r.x,444);}
});
test('only defending keepers receive the complementary target and an interior depth; other actors preserve native results',()=>{
 const m=setup();for(const side of [1,2])for(const lateral of [-160,0,160])for(const rank of [0,1])for(const be of [0,1,2,3]){
  set(m,NEAR_GOAL,side);set(m,0x11F6,2);set(m,0x11F2,320+lateral);set(m,0xBE,be);set(m,0x668,rank);set(m,0x630,1);set(m,0x650,555);
  const {r}=executeHook(m,DEFENSE_KEEPER,{dp:0x600,a:12,x:123,y:456,p:1},new Set([0x84E57E]));const applies=rank===0&&(side===1?be<2:be>=2);
  assert.equal(word(m,0x650),applies?(side===1?24:1832):555);assert.equal(word(m,0x652),applies?320-Math.max(-28,Math.min(28,Math.floor(lateral/4))):332);
  assert.equal(r.a,332);assert.equal(r.x,123);assert.equal(r.y,456);assert.equal(r.s,511);
 }
});
test('lateral wall arrival settles both coordinates but retains central lateral tolerance',()=>{
 for(const lateral of [0,80,-80]){const m=setup();m.set(backpassWallArrival({lateralSnap:true}),WALL_ARRIVAL);set(m,NEAR_GOAL,1);set(m,0x11F2,320+lateral);set(m,0x650,0);set(m,0x652,350);set(m,0x62a,10);set(m,0x62c,355);
 executeHook(m,WALL_ARRIVAL,{dp:0x600},new Set([0x80E1AF,0x848544,0x84AF8A]));assert.equal(word(m,0x62a),0);assert.equal(word(m,0x62c),lateral?350:355);}
});
test('stale private state, distant restarts and field players cannot redirect native keeper targets',()=>{
 for(const variation of ['off','ordinary','distant','field']){const m=setup();set(m,NEAR_GOAL,1);set(m,0x630,1);set(m,0x668,0);set(m,0x650,555);set(m,0xBE,0);
  if(variation==='off')set(m,WALL_MARKER,0);if(variation==='ordinary')set(m,0xC2,4);if(variation==='distant')set(m,NEAR_GOAL,0);if(variation==='field')set(m,0x630,0);
  const {r}=executeHook(m,DEFENSE_KEEPER,{dp:0x600,a:12,x:123,y:456,p:1},new Set([0x84E57E]));assert.equal(word(m,0x650),555);assert.equal(word(m,0x652),332);assert.equal(r.a,332);assert.equal(r.s,511);
 }
});
