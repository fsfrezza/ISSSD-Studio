import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import{centerPlayerNameBytes,centeredRosterNames,centerPlusPlayerNames}from'../src/core/player-name-centering.mjs';
import{encodeFixedPlayerName,decodeFixedPlayerName,resolvePlusPlayerNameOffset}from'../src/core/plus-player-name.mjs';
import{buildPlusProjectRom}from'../src/core/project-build.mjs';import{makePlusTacticalFixture}from'./plus-tactics-fixture.mjs';
function baseRom(){const b=makePlusTacticalFixture();for(let t=0;t<56;t++){const ptr=0x8000+t*160;b[0x38138+t*2]=ptr&255;b[0x38139+t*2]=ptr>>8;for(let p=0;p<20;p++)b.set(encodeFixedPlayerName(t===30?'Ronaldo':'Messi'),resolvePlusPlayerNameOffset(b,t,p));}return b;}
test('centering changes only outer blank slots, preserving native glyphs, internal spaces and source bytes',()=>{
 for(const [before,after]of [['Cafu    ','  Cafu  '],['Messi   ',' Messi  '],['Ronaldo ','Ronaldo '],[' Taffare','Taffare '],['A B     ','  A B   '],['        ','        ']]){const bytes=encodeFixedPlayerName(before),copy=bytes.slice();assert.equal(decodeFixedPlayerName(centerPlayerNameBytes(bytes)),after);assert.deepEqual(bytes,copy);}
 const glyph=Uint8Array.of(0,0x58,0,0x59,0,0,0,0);assert.deepEqual(centerPlayerNameBytes(glyph),Uint8Array.of(0,0,0x58,0,0x59,0,0,0));assert.throws(()=>centeredRosterNames([0]),/vinte/);
});
test('player export centers every native team after nameHex overrides and stays disabled outside player phase',()=>{
 const base=baseRom(),before=base.slice(),project={state:{patchesCompact:[],semantic:{playerNameAlignment:'center',teamsV1:{schema:'isssd-teams-v1',version:3,teams:{31:{teamId:31,players:[{playerId:'31:1',baseSlot:1,slot:1,custom:{name:'Messi',nameHex:Buffer.from(encodeFixedPlayerName('Messi')).toString('hex')}}]}}}}}};
 const {rom}=buildPlusProjectRom(base,project,{selectedAreas:['infraestrutura','jogadores'],writeChecksum:false});
 for(let t=0;t<56;t++)for(let p=0;p<20;p++)assert.equal(decodeFixedPlayerName(rom.slice(resolvePlusPlayerNameOffset(rom,t,p),resolvePlusPlayerNameOffset(rom,t,p)+8)),t===30?'Ronaldo ':' Messi  ');
 const skipped=buildPlusProjectRom(base,project,{selectedAreas:['infraestrutura'],writeChecksum:false}).rom;assert.deepEqual(skipped.slice(0x178000,0x178000+56*160),base.slice(0x178000,0x178000+56*160));assert.deepEqual(base,before);
 const off=base.slice();centerPlusPlayerNames(off,{});assert.deepEqual(off,base);
});
test('UI forces centered player preview and persists the policy without changing name text or other profiles',()=>{
 const select={},player={name:'Cafu',align:'left'},context={activeRomProfile:{id:'iss-deluxe-plus'},teams:{30:{players:[player]}},currentTeam:30,currentPlayer:0,$:()=>select,window:{},document:{readyState:'complete'},alignName:(text,mode)=>mode+':'+text,renderPlayer(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../editor-src/player-name-centering.mjs',import.meta.url),'utf8'),context);vm.runInContext('renderPlayer()',context);assert.equal(player.align,'center');assert.equal(select.value,'center');assert.equal(select.disabled,true);assert.equal(player.name,'Cafu');assert.equal(vm.runInContext('alignName("Cafu","left")',context),'center:Cafu');
 const p={state:{semantic:{keep:1}}};context.window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(p);assert.equal(p.state.semantic.playerNameAlignment,'center');assert.equal(p.state.semantic.keep,1);context.activeRomProfile.id='other';assert.equal(vm.runInContext('alignName("Cafu","left")',context),'left:Cafu');
});
test('centering policy chains the final project bridge installed after the legacy runtime',()=>{
 let load;const context={activeRomProfile:{id:'iss-deluxe-plus'},document:{readyState:'loading'},window:{addEventListener:(_event,callback)=>{load=callback;}},alignName:()=>'',renderPlayer(){}};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../editor-src/player-name-centering.mjs',import.meta.url),'utf8'),context);
 context.window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=p=>{p.bridge=true;return p;};load();const p={state:{semantic:{}}};context.window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__(p);assert.equal(p.bridge,true);assert.equal(p.state.semantic.playerNameAlignment,'center');
});
