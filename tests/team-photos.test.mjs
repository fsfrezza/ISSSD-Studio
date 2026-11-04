import test from'node:test';import assert from'node:assert/strict';import{quantizeTeamPhoto,validateTeamPhotos,packTeamPhoto,teamPhotoRgba}from'../src/core/team-photos.mjs';import{plusTeamPhotosWriter,teamPhotoSlot,teamPhotoLoader}from'../src/core/plus-team-photos.mjs';
const photo=()=>({pixels:Array.from({length:6144},(_,i)=>i%16),palette:Array.from({length:16},(_,i)=>i*1024)});
test('team photos round-trip independently for all sixty teams with fixed native dimensions and exact 4bpp plane order',()=>{
 const state={schema:'isssd-team-photos-v1',version:1,teams:{0:photo(),59:photo()}},saved=JSON.stringify(state),copy=validateTeamPhotos(JSON.parse(saved));copy.teams[0].pixels[0]=7;assert.equal(copy.teams[59].pixels[0],0);assert.equal(JSON.stringify(state),saved);
 const p=photo(),a=packTeamPhoto(p);assert.equal(a.length,3104);for(let y=0;y<64;y++)for(let x=0;x<96;x++){const t=(y>>3)*12+(x>>3);let v=0;for(let plane=0;plane<4;plane++)v|=((a[t*32+(plane>>1)*16+(y&7)*2+(plane&1)]>>(7-(x&7)))&1)<<plane;assert.equal(v,p.pixels[y*96+x]);}
 for(let i=0;i<60;i++){const at=teamPhotoSlot(i);assert.ok(at>=0x240000&&at+3104<=0x270000);assert.ok((at&32767)+3104<=32768);}
});
test('photo quantization constrains every upload to fifteen visible SNES colors, preserves transparency and is deterministic',()=>{
 const rgba=Uint8ClampedArray.from({length:24576},(_,i)=>i%4===3?(i<4?0:255):(i*13)&255),before=rgba.slice(),a=quantizeTeamPhoto(rgba);assert.equal(a.pixels[0],0);assert.equal(a.palette.length,16);assert.ok(a.pixels.slice(1).every(p=>p>=1&&p<=15));assert.deepEqual(a,quantizeTeamPhoto(rgba));assert.deepEqual(rgba,before);assert.equal(teamPhotoRgba(a)[3],0);assert.throws(()=>quantizeTeamPhoto(rgba.slice(4)));
});
test('photo writer is phase-gated and validates every reservation before modifying any ROM byte',()=>{
 const base=new Uint8Array(0x200000).fill(255);base.set([0x20,0x6f,0xaf,0xaa],0x2afa0);const state={teamPhotosV1:{schema:'isssd-team-photos-v1',version:1,teams:{30:photo()}}};
 const rom=new Uint8Array(0x400000).fill(255);rom.set(base);const before=rom.slice();plusTeamPhotosWriter(rom,state,base,['jogadores']);assert.deepEqual(rom,before);const conflict=rom.slice();conflict[0x47900]=0;const previous=conflict.slice();assert.throws(()=>plusTeamPhotosWriter(conflict,state,base),/ocupado/);assert.deepEqual(conflict,previous);
 plusTeamPhotosWriter(rom,state,base,['selecao-equipes']);assert.equal(rom[0x2afa0],0x5c);assert.equal(rom[0x47900],24);assert.equal(rom[0x247c00+30*4+3],1);assert.ok(teamPhotoLoader().length<=512);assert.deepEqual(base,before.slice(0,0x200000));
});
test('malformed photo data rejects invalid team indices, pixel counts, colors and palette entries',()=>{
 for(const mutate of [p=>p.teams[60]=photo(),p=>p.teams[0].pixels.pop(),p=>p.teams[0].pixels[0]=16,p=>p.teams[0].palette[1]=32768]){const p={schema:'isssd-team-photos-v1',version:1,teams:{0:photo()}};mutate(p);assert.throws(()=>validateTeamPhotos(p));}
});
