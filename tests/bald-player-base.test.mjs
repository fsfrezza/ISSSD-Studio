import test from'node:test';import assert from'node:assert/strict';
import{PLAYER_BODY_CATALOG,PLAYER_POSE_CATALOG,readPlayerSprite,baldBodyPixels}from'../src/core/player-sprite-editor.mjs';
import{BALD_BODY_PIXEL_INDICES}from'../src/core/player-bald-base-data.mjs';
import{migrateBaldAppearanceTeams}from'../src/core/player-appearance.mjs';
import{plusBaldPlayerBaseWriter,encodeBodySprite,baldBaseSupported,prepareBaldAppearanceState,BALD_BASE_SLOT}from'../src/core/plus-bald-player-base.mjs';
import{expandPlusTo4MiB}from'../src/core/plus-tactics-infrastructure.mjs';import{playerOffset}from'../src/core/plus-player.mjs';import{plusCustomHairWriter}from'../src/core/plus-custom-hair.mjs';
import{makePlusTacticalFixture}from'./plus-tactics-fixture.mjs';import{execute}from'./65816-body-helper-fixture.mjs';
const pc=v=>((v>>>16)&127)*32768+(v&32767),long=(b,p)=>b[p]|b[p+1]<<8|b[p+2]<<16;
function fixture(){const base=makePlusTacticalFixture();for(const r of PLAYER_BODY_CATALOG){const n=r.mounted?768:64*Math.ceil((r.top+r.bottom)/256)*8,p=Array(n).fill(0);for(const i of BALD_BODY_PIXEL_INDICES[r.id])p[i]=1;base.set(encodeBodySprite(r,p),r.pc);}for(const[p,b]of[[0x266FB,[0xBF,2,0,0x82]],[0x26706,[0xBF,4,0,0x82]],[0x1C930,[0xBD,6,0,0x29,15,0]],[0x1CAFE,[0xBD,6,0,0x29,15,0]]])base.set(b,p);for(const pose of PLAYER_POSE_CATALOG){const a=pc(parseInt(pose.id,16))+2,v=parseInt(pose.body,16);base.set([v&255,v>>8&255,v>>16,2],a);}base.set([0xB9,0x6D,0xED,0x8D,8,0],0xC7BC3);base.set([0xB9,0x6E,0xED,0x29,0,255],0xC7BE0);for(let h=0;h<13;h++){const v=0x97CD58+h*768;base.set([v&255,v>>8&255,v>>16,0],0xED6D+h*4);}for(let t=0;t<56;t++)for(let p=0;p<20;p++)base[playerOffset(t,p)+6]=0xB0;return base;}
test('legacy model migrates once: native 0 to original 14, previous bald 14 to base 0, Cascao stays 15',()=>{
 const old={schema:'isssd-teams-v1',version:3,teams:{30:{players:[{custom:{appearance:{hair:0,palette:1}}},{custom:{appearance:{hair:14,palette:0}}},{custom:{appearance:{hair:15,palette:1}}}]}},spriteEdits:{hair:{'14:0':Array(64).fill(3),'15:0':[1,...Array(63).fill(4)]}}};const before=JSON.stringify(old),next=migrateBaldAppearanceTeams(old);assert.deepEqual(next.teams[30].players.map(p=>p.custom.appearance.hair),[14,0,15]);assert.deepEqual(next.spriteEdits.hair['15:0'],[1,...Array(63).fill(0)]);assert.ok(next.legacyBaldHeadDrawings['14:0']);assert.equal(next.spriteEdits.hair['14:0'],undefined);assert.deepEqual(migrateBaldAppearanceTeams(next),next);assert.equal(JSON.stringify(old),before);
});
test('all 857 base bodies become bald, original bodies remain exact under type 14, uniforms and DMA lengths survive',()=>{
 const base=fixture(),before=base.slice(),rom=expandPlusTo4MiB(base),state=prepareBaldAppearanceState({});assert.ok(baldBaseSupported(base));plusBaldPlayerBaseWriter(rom,state,base);assert.deepEqual(base,before);
 for(const r of PLAYER_BODY_CATALOG){const a=readPlayerSprite(base,{kind:'body',id:r.id}),b=readPlayerSprite(rom,{kind:'body',id:r.id});assert.deepEqual(b.pixels,baldBodyPixels(r.id,a.pixels));assert.equal(rom[r.pc],base[r.pc]);assert.equal(rom[r.pc+1],base[r.pc+1]);}
 for(const pose of PLAYER_POSE_CATALOG){const at=BALD_BASE_SLOT+parseInt(pose.id.slice(2),16)-32768,p=pc(long(rom,at)),r=PLAYER_BODY_CATALOG.find(r=>r.id===pose.body);assert.deepEqual(rom.slice(p,p+r.top+r.bottom+4),base.slice(r.pc,r.pc+r.top+r.bottom+4));assert.ok((p&32767)+r.top+r.bottom+4<=32768);}
 for(let t=0;t<56;t++)for(let p=0;p<20;p++)assert.equal(rom[playerOffset(t,p)+6],0xBE);
 plusCustomHairWriter(rom,state,base); // eleven original hairs are not eleven special overlays
});
test('body selector follows both lineups, substitutions and every pose without spending native overlay slots',()=>{
 const base=fixture(),rom=expandPlusTo4MiB(base);plusBaldPlayerBaseWriter(rom,prepareBaldAppearanceState({}),base);
 for(const side of[0,1])for(const slot of[0,5,10])for(const roster of[0,9,19])for(const hair of[0,1,13,14,15])for(const pose of[PLAYER_POSE_CATALOG[0],PLAYER_POSE_CATALOG.at(-1)]){
  const wram=new Uint8Array(65536),d=(side?0x1000:0x500)+slot*256,x=parseInt(pose.id.slice(2),16);wram[d+0x68]=slot;wram[(side?0x3FA4:0x3F90)+slot]=roster;wram[(side?0x3EC4:0x3DFC)+roster*10]=0x10|hair;const expected=hair===14?long(rom,BALD_BASE_SLOT+x-32768):parseInt(pose.body,16);
  for(const p of[0,1,8,9]){assert.equal(execute(rom,0x308000,{d,x,wram,p}),expected&65535);assert.equal(execute(rom,0x308200,{d,x,wram,p})&255,expected>>>16);}
 }
 const wram=new Uint8Array(65536);for(let h=0;h<16;h++){wram[0x206]=h;assert.equal(execute(rom,0x308400,{x:0x200,wram}),h===14?0:h);}
});
test('explicit new bald selection, unchecked phase and occupied allocation are handled without partial writes',()=>{
 const base=fixture(),state=prepareBaldAppearanceState({teamsV1:{schema:'isssd-teams-v1',version:3,teams:{30:{teamId:30,players:[{slot:3,custom:{appearance:{hair:14}}}]}}}}),rom=expandPlusTo4MiB(base);plusBaldPlayerBaseWriter(rom,state,base);assert.equal(rom[playerOffset(30,2)+6]&15,0);assert.equal(rom[playerOffset(30,1)+6]&15,14);
 const no=expandPlusTo4MiB(base),before=no.slice();plusBaldPlayerBaseWriter(no,state,base,['infraestrutura']);assert.deepEqual(no,before);const bad=expandPlusTo4MiB(base);bad[0x308600]=1;const snapshot=bad.slice();assert.throws(()=>plusBaldPlayerBaseWriter(bad,state,base),/ocupado/);assert.deepEqual(bad,snapshot);
});

test('editing original style 14 to transparency exposes the bald base in both preview and ROM',async()=>{
 const {renderPlayerReference,playerReferencePose}=await import('../src/core/player-sprite-editor.mjs');
 const base=fixture(),pose=playerReferencePose({kind:'hair',style:14,frame:0}),ref={kind:'hair',style:14,frame:0},edits={hair:{'14:0':Array(64).fill(0)}},rom=expandPlusTo4MiB(base);
 const empty=renderPlayerReference(base,ref,edits),bald=renderPlayerReference(base,ref,{hair:{'15:0':Array(64).fill(0)}},{style:15});assert.deepEqual(empty.pixels,bald.pixels);
 const state=prepareBaldAppearanceState({teamsV1:{schema:'isssd-teams-v1',version:3,appearanceModel:'bald-base-v1',teams:{},spriteEdits:edits}});plusBaldPlayerBaseWriter(rom,state,base);
 const at=BALD_BASE_SLOT+parseInt(pose.id.slice(2),16)-32768,p=pc(long(rom,at)),r=PLAYER_BODY_CATALOG.find(r=>r.id===pose.body),expected=encodeBodySprite(r,baldBodyPixels(r.id,readPlayerSprite(base,{kind:'body',id:r.id}).pixels));assert.deepEqual(rom.slice(p,p+expected.length),expected);
});

test('later body edits keep priority and uniforms carry across base 0 and original 14',async()=>{
 const {playerSpriteWriter,originalBodyWithEdits}=await import('../src/core/player-sprite-editor.mjs');
 const base=fixture(),r=PLAYER_BODY_CATALOG.find(r=>r.id==='968000'),native=readPlayerSprite(base,{kind:'body',id:r.id}).pixels,pixels=baldBodyPixels(r.id,native);pixels[700]=9;const scalp=BALD_BODY_PIXEL_INDICES[r.id][0];pixels[scalp]=1;
 const state=prepareBaldAppearanceState({teamsV1:{schema:'isssd-teams-v1',version:3,appearanceModel:'bald-base-v1',teams:{},spriteEdits:{version:1,body:{[r.id]:pixels}}}}),rom=expandPlusTo4MiB(base);playerSpriteWriter(rom,state,base);plusBaldPlayerBaseWriter(rom,state,base);assert.deepEqual(readPlayerSprite(rom,{kind:'body',id:r.id}).pixels,pixels);
 const pose=PLAYER_POSE_CATALOG.find(p=>p.body===r.id),at=BALD_BASE_SLOT+parseInt(pose.id.slice(2),16)-32768,p=pc(long(rom,at)),expected=encodeBodySprite(r,originalBodyWithEdits(base,r.id,state.teamsV1.spriteEdits));assert.deepEqual(rom.slice(p,p+expected.length),expected);assert.equal(originalBodyWithEdits(base,r.id,state.teamsV1.spriteEdits)[700],9);
});

test('index-1 shadows on leg and torso remain unchanged when regenerating bald bodies',()=>{
 for(const[id,indices]of Object.entries({'95AD70':[653,717],'9D8AC0':[216,280,281,343,63,512]})){
  const r=PLAYER_BODY_CATALOG.find(r=>r.id===id),n=r.mounted?768:64*Math.ceil((r.top+r.bottom)/256)*8,pixels=Array(n).fill(0);for(const i of indices)pixels[i]=1;const hair=BALD_BODY_PIXEL_INDICES[id][0];pixels[hair]=1;const bald=baldBodyPixels(id,pixels);for(const i of indices)assert.equal(bald[i],1);assert.notEqual(bald[hair],1);
 }
});
