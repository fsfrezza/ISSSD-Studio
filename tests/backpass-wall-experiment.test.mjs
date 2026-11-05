import test from'node:test';import assert from'node:assert/strict';
import{executeHook}from'./65816-hook-harness.mjs';import{backpassWallHelper,backpassWallMark,backpassWallArrival,WALL_ARRIVAL,NEAR_GOAL,WALL_HELPER,WALL_MARKER}from'../scripts/experiments/backpass-free-kick-wall.mjs';
const write=(m,a,v)=>{m[a]=v&255;m[a+1]=v>>>8&255;};
test('standalone backpass wall clamps each individual target to either goal line without moving the ball',()=>{
 for(const x of [0xFF80,0,16,0x730,0x740,0x7C0])for(const active of [false,true])for(const c0 of [0,5]){
  const m=new Uint8Array(0x1000000);m.set(backpassWallHelper(),WALL_HELPER);write(m,WALL_MARKER,active?0xBACC:0);write(m,0xC2,5);write(m,0xC0,c0);write(m,0x12A2,0x740);write(m,0x11F0,16);write(m,0x11F2,0x140);
  const{r}=executeHook(m,WALL_HELPER,{a:0x155,x,y:0x7777,dp:0x600,p:1},new Set([0x84E509]));
  assert.equal(r.x,active?(x&0x8000?0:Math.min(x,0x740)):x);assert.equal(r.y,0x155);assert.equal(r.s,0x1FF);assert.equal(r.dp,0x600);assert.equal(r.a,c0?0xAF7C:0);assert.equal(m[0x66A]|m[0x66B]<<8,c0?0xAF7C:0);assert.equal(m[0x11F0],16);assert.equal(m[0x11F2]|m[0x11F3]<<8,0x140);
 }
});
test('ordinary set pieces remain native even if an old private marker survives',()=>{
 for(const kind of [0,1,2,3,4,6]){const m=new Uint8Array(0x1000000);m.set(backpassWallHelper(),WALL_HELPER);write(m,WALL_MARKER,0xBACC);write(m,0xC2,kind);write(m,0x12A2,0x740);const{r}=executeHook(m,WALL_HELPER,{x:0xFF80,a:0x123},new Set([0x84E509]));assert.equal(r.x,0xFF80);}
});

test('penalty-spot distance threshold is symmetric and strict; ball stays at the foul spot',()=>{
 for(const ball of [0,16,255,256,257,0x3A0,0x640,0x641,0x730,0x740]){
 const m=new Uint8Array(0x1000000);m.set(backpassWallMark(),0xFFFEA0);write(m,0x11F0,ball);write(m,0x12A2,0x740);
 executeHook(m,0xFFFEA0,{},new Set([0xA4DD45]));
 assert.equal(m[NEAR_GOAL],ball<256?1:0x740-ball<256?2:0);
 assert.equal(m[0x11F0]|m[0x11F1]<<8,ball);
 m.set(backpassWallHelper(),WALL_HELPER);write(m,0xC2,5);const {r}=executeHook(m,WALL_HELPER,{a:0x155,x:0x300},new Set([0x84E509]));
 assert.equal(r.x,ball<256?0:0x740-ball<256?0x740:0x300);
 }
});
test('near-goal wall arrival snaps actual feet to target before the native standing animation',()=>{
 for(const goal of [0,0x740])for(const active of [false,true]){
 const m=new Uint8Array(0x1000000);m.set(backpassWallArrival(),WALL_ARRIVAL);write(m,WALL_MARKER,0xBACC);write(m,NEAR_GOAL,active?1:0);write(m,0xC2,5);write(m,0x650,goal);write(m,0x62A,(goal+12)&65535);write(m,0x62C,0x140);
 const {r,calls}=executeHook(m,WALL_ARRIVAL,{dp:0x600,x:0x1234,y:0x5678,p:1},new Set([0x80E1AF,0x848544,0x84AF8A]));
 assert.equal(m[0x62A]|m[0x62B]<<8,active?goal:goal+12);assert.equal(m[0x62C]|m[0x62D]<<8,0x140);assert.equal(r.x,0x1234);assert.equal(r.y,0x5678);assert.equal(r.s,0x1FF);assert.equal(calls.at(-2).target,0x848544);assert.equal(calls.at(-2).a,0x478);
 }
});
