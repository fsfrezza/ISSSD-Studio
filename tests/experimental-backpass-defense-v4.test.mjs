import test from'node:test';import assert from'node:assert/strict';import{executeHook}from'./65816-hook-harness.mjs';import{experimentalDefenseCenter,experimentalDefenseWall}from'../src/core/experimental-backpass-defense-v4.mjs';import{backpassWallHelper,WALL_HELPER,WALL_MARKER,NEAR_GOAL}from'../src/core/backpass-free-kick.mjs';import{DEFENSE_WALL,DEFENSE_CENTER,DEFENSE_KEEPER,backpassDefenseKeeper}from'../src/core/backpass-defense.mjs';
const set=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>8&255;},word=(m,a)=>m[a]|m[a+1]<<8;
test('experimental v4 wall follows projected left/center/right and defending keeper takes its complementary side at both goals',()=>{
 const m=new Uint8Array(0x1000000);for(const[a,f]of[[DEFENSE_CENTER,experimentalDefenseCenter],[DEFENSE_WALL,experimentalDefenseWall],[DEFENSE_KEEPER,backpassDefenseKeeper],[WALL_HELPER,backpassWallHelper]])m.set(f(),a);set(m,WALL_MARKER,0xBACC);set(m,0xc0,5);set(m,0xc2,5);set(m,0x12a2,1856);set(m,0x12d8,320);
 for(const side of[1,2])for(const count of[2,5])for(const projected of[-160,-80,0,80,160]){const goal=side===1?0:1856,ball=side===1?128:1728;set(m,NEAR_GOAL,side);set(m,0x11f6,count);set(m,0x11f0,ball);set(m,0x11f2,320+projected-(ball-goal));set(m,0xbe,side===1?0:2);const centers=[];
  for(let rank=1;rank<=count+1;rank++){set(m,0x668,rank);const {r}=executeHook(m,DEFENSE_WALL,{dp:0x600,a:0,x:400},new Set([0x84e509]));assert.equal(r.x,goal);assert.ok(r.y>=280&&r.y<=360);centers.push(r.y-320);assert.equal(r.s,511);}
  const mean=centers.reduce((a,b)=>a+b,0)/centers.length;assert.equal(Math.sign(mean),Math.sign(projected));for(let i=1;i<centers.length;i++)assert.equal(centers[i]-centers[i-1],12);
  set(m,0x668,0);set(m,0x630,1);executeHook(m,DEFENSE_KEEPER,{dp:0x600,a:0},new Set([0x84e57e]));assert.equal(word(m,0x652)-320,mean===0?0:-mean);assert.equal(word(m,0x650),side===1?24:1832);
 }
});
