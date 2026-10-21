import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import * as core from '../src/core/player-appearance.mjs';
import {teamsV3PlayerSteps,applySteps} from '../src/core/teams-v3-writer.mjs';
import {playerOffset} from '../src/core/plus-player.mjs';
const word=(b,p,v)=>b.set([v&255,v>>8&255],p),long=(b,p,v)=>b.set([v&255,v>>8&255,v>>16&255],p);
function fixture(){
 const b=new Uint8Array(0x200000),primary=0x10274,skin=0x1043C,hair=0x103CA,gk=0x10358;
 for(const [at,table]of [[0x5CFD0,primary],[0x5CFEA,skin],[0x5CFFB,hair],[0x5D06E,gk]]){b[at]=0xBF;long(b,at+1,0x820000|table&65535);}
 function pal(ptr,colors){word(b,0x40000+ptr,colors.length*2-1);colors.forEach((v,i)=>word(b,0x40000+ptr+2+i*2,v));}
 pal(0x9000,Array.from({length:16},(_,i)=>i*0x421));pal(0x9100,Array(12).fill(0x1F));pal(0x8372,[0x1234]);
 for(const [i,p]of core.NATIVE_SKIN_PRESETS.entries())pal(p.pointer,Array.from({length:5},(_,k)=>(i+1)*0x100+k));
 for(let t=0;t<56;t++){word(b,primary+t*2,0x9000);word(b,primary+(t+56)*2,0x9000);word(b,gk+t*2,0x9100);word(b,skin+t*2,t===1?0:0x8366);word(b,hair+t*2,t===1?0:0x8372);}
 for(let i=0;i<13;i++){long(b,0xED6D+i*4,0x97CD58+i*0x300);for(let f=0;f<24;f++)for(let y=0;y<8;y++)for(let plane=0;plane<4;plane++)b[0xBCD58+i*0x300+f*32+(plane>>1)*16+y*2+(plane&1)]=((i+f+plane+y)%2)?0xAA:0x55;}
 return b;
}
const initial={schema:'isssd-teams-v1',version:3,teams:{30:{teamId:30,players:[{playerId:'30:8',baseSlot:8,slot:6,custom:{name:'R.Gaucho',skills:{speed:9},tactical:{attack:true}}},{playerId:'30:6',baseSlot:6,slot:8,custom:{name:'Dunga'}}]}}};
test('native palette preview reads the actual Plus pointer tables and combines only hair and skin overrides',()=>{
 const b=fixture(),before=b.slice(),r=core.readNativeAppearancePalettes(b,0);
 assert.equal(r.skinPointer,0x8366);assert.equal(r.hairPointer,0x8372);assert.equal(r.palettes[1][1],0x1234);assert.deepEqual(r.palettes[1].slice(2,7),[0x400,0x401,0x402,0x403,0x404]);assert.deepEqual(r.palettes[1].slice(7),r.palettes[0].slice(7));
 assert.equal(core.readNativeAppearancePalettes(b,1).identical,true);assert.equal(r.presets.length,4);assert.equal(r.colors[0].length,16);
 const goalie=core.readNativeAppearancePalettes(b,0,{goalkeeper:true});assert.equal(goalie.identical,true);assert.equal(goalie.palettes[0].length,12);
 const header=new Uint8Array(b.length+512);header.set(b,512);assert.deepEqual(core.readNativeAppearancePalettes(header,0),r);assert.deepEqual(b,before);
 for(const t of [0,30,55])assert.doesNotThrow(()=>core.readNativeAppearancePalettes(b,t));for(const t of [-1,56,0.5])assert.throws(()=>core.readNativeAppearancePalettes(b,t));
 b[0x5CFD0]=0;assert.throws(()=>core.readNativeAppearancePalettes(b,0),/leitor/);
});
test('all thirteen optional hair styles decode all 24 native 4bpp frames without a fixed image or smoothing',()=>{
 const b=fixture();assert.equal(core.decodeNativeHairTile(b,0),null);
 for(let hair=1;hair<=13;hair++)for(let frame=0;frame<24;frame++){
  const p=core.decodeNativeHairTile(b,hair,frame);assert.equal(p.length,64);for(let y=0;y<8;y++)for(let x=0;x<8;x++){let v=0;for(let bit=0;bit<4;bit++)v|=(((hair-1+frame+bit+y)%2?0xAA:0x55)>>(7-x)&1)<<bit;assert.equal(p[y*8+x],v);}
 }
 for(const pair of [[16,0],[-1,0],[1,24],[1,0.5]])assert.throws(()=>core.decodeNativeHairTile(b,...pair));
 const header=new Uint8Array(b.length+512);header.set(b,512);assert.deepEqual(core.decodeNativeHairTile(header,13,23),core.decodeNativeHairTile(b,13,23));
 assert.equal(core.appearanceBgrHex(0x1F),'#ff0000');assert.equal(core.appearanceBgrHex(0x7C00),'#0000ff');
});
test('appearance changes and restoration follow player identity across slots and JSON reopening, preserving other edits',()=>{
 const before=JSON.stringify(initial),id={playerId:'30:8',baseSlot:8};
 const state=core.setProjectPlayerAppearance(initial,30,id,{hair:13,palette:1},{hair:2,palette:0});assert.equal(JSON.stringify(initial),before);
 const reopened=JSON.parse(JSON.stringify(state)),p=reopened.teams[30].players[0];assert.deepEqual(p.custom.appearance,{hair:13,palette:1});assert.equal(p.slot,6);assert.equal(p.custom.skills.speed,9);assert.equal(p.custom.tactical.attack,true);assert.equal(reopened.teams[30].players[1].custom.appearance,undefined);
 const restored=core.setProjectPlayerAppearance(reopened,30,id,{hair:2,palette:0},{hair:2,palette:0});assert.equal(restored.teams[30].players[0].custom.appearance,undefined);assert.equal(restored.teams[30].players[0].custom.name,'R.Gaucho');
 assert.throws(()=>core.setProjectPlayerAppearance(initial,30,{playerId:'30:8',baseSlot:6},{hair:1,palette:0}));for(const value of [{hair:16,palette:0},{hair:0,palette:2}])assert.throws(()=>core.setProjectPlayerAppearance(initial,30,id,value));assert.equal(JSON.stringify(initial),before);
});
test('every editable appearance combination exports only its attribute byte and preserves reserved bits',()=>{
 const base=new Uint8Array(0x200000),off=playerOffset(1,0);base.set([0x12,0x34,0x56,0x78,0x29,0,0x2E],off);
 for(let hair=0;hair<16;hair++)for(let palette=0;palette<2;palette++){
  const state={teamsV1:{schema:'isssd-teams-v1',version:3,teams:{1:{teamId:1,players:[{slot:1,baseSlot:1,playerId:'1:1',custom:{appearance:{hair,palette}}}]}}}},rom=base.slice();applySteps(rom,teamsV3PlayerSteps(base,state));assert.equal(rom[off+6],hair<<4|0xE|palette);assert.deepEqual(rom.slice(off,off+6),base.slice(off,off+6));for(let i=0;i<rom.length;i++)if(rom[i]!==base[i])assert.equal(i,off+6);
 }
});
test('generated build installs native appearance instead of legacy artwork and keeps all bound input IDs',()=>{
 const source=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8'),a=source.indexOf('// Replace only the generated appearance UI;'),z=source.indexOf('// Keep the protected visual baseline',a);assert.ok(a>0&&z>a);
 const context=vm.createContext({fs,path,root:path.resolve(new URL('..',import.meta.url).pathname),html:'<head></head><body><dialog id="appearanceDialog">OLD</dialog><script>const HAIR_NAMES=["fake"];function commitAppearance(){throw Error("old")}\nrenderEmbeddedAssetManifest();</script></body>'});vm.runInContext(source.slice(a,z),context);assert.ok(context.html.includes('appearanceNativePalettes'));assert.ok(context.html.includes('setProjectPlayerAppearance'));assert.ok(!context.html.includes('const HAIR_NAMES='));assert.ok(!context.html.includes('image-001-102023cc5a9.png'));assert.ok(!context.html.includes('function commitAppearance(){throw'));
 const script=context.html.match(/<script>([\s\S]*?)<\/script>/)[1];assert.doesNotThrow(()=>new Function(script));
 for(const id of ['appearanceHairRange','appearanceHairValue','appearancePalette','appearancePrevPlayerBtn','appearanceNextPlayerBtn','closeAppearanceDialog','cancelAppearanceBtn','applyAppearanceBtn','applyAppearanceNextBtn','appearanceEditSharedBtn'])assert.ok(context.html.includes('id="'+id+'"'),id);
});

test('cumulative Jogadores applies appearance and synchronizes the native Brazil mirrors, while unchecked export excludes it',async()=>{
 const {makePlusTacticalFixture}=await import('./plus-tactics-fixture.mjs'),{buildCumulativeProject}=await import('../src/core/cumulative-build.mjs'),{knownMirrorSlices}=await import('../src/core/plus-player.mjs');
 const base=makePlusTacticalFixture(),off=playerOffset(30,2);base.set([0x12,0x34,0x56,0x78,0x29,2,0x20],off);
 const project={state:{semantic:{teamsV1:{schema:'isssd-teams-v1',version:3,teams:{30:{teamId:30,players:[{slot:3,baseSlot:3,playerId:'30:3',custom:{appearance:{hair:13,palette:1}}}]}}}}}},shots=[];
 const result=buildCumulativeProject(base,project,{selectedAreas:['infraestrutura','jogadores'],onRom:(rom,entry)=>shots.push({rom,entry})});assert.deepEqual(result.unassignedLegacyRanges,[]);assert.equal(shots.at(-1).rom[off+6],0xD1);for(const s of knownMirrorSlices(30,2))assert.equal(shots.at(-1).rom[s.mirror+6-s.mainStart],0xD1);assert.deepEqual(shots.at(-1).rom.slice(off,off+6),base.slice(off,off+6));assert.equal(shots[0].rom[off+6],0x20);
 const excluded=[];buildCumulativeProject(base,project,{selectedAreas:['infraestrutura'],onRom:rom=>excluded.push(rom)});assert.equal(excluded.at(-1)[off+6],0x20);assert.equal(base[off+6],0x20);
});

test('copy and swap work across teams by identity without moving players or their unrelated fields',()=>{
 const state=structuredClone(initial);state.teams[55]={teamId:55,custom:{teamName:'Outro'},players:[{playerId:'55:4',baseSlot:4,slot:9,custom:{name:'Destino',number:12,appearance:{hair:11}}}]};
 const a={team:30,identity:{playerId:'30:8',baseSlot:8}},b={team:55,identity:{playerId:'55:4',baseSlot:4}},original=(t,s)=>t===30?{hair:2,palette:1}:{hair:4,palette:0};
 const before=JSON.stringify(state),copied=core.transferProjectPlayerAppearance(state,a,b,'copy',original);
 assert.deepEqual(copied.teams[55].players[0].custom.appearance,{hair:2,palette:1});assert.deepEqual(copied.teams[30],state.teams[30]);assert.equal(copied.teams[55].players[0].slot,9);assert.equal(copied.teams[55].players[0].custom.number,12);
 const swapped=JSON.parse(JSON.stringify(core.transferProjectPlayerAppearance(state,a,b,'swap',original)));
 assert.deepEqual(swapped.teams[30].players[0].custom.appearance,{hair:11,palette:0});assert.deepEqual(swapped.teams[55].players[0].custom.appearance,{hair:2,palette:1});assert.equal(swapped.teams[30].players[0].custom.skills.speed,9);assert.equal(swapped.teams[30].players[0].custom.tactical.attack,true);assert.equal(swapped.teams[55].players[0].custom.name,'Destino');
 const restored=core.transferProjectPlayerAppearance(swapped,a,b,'swap',original);assert.equal(restored.teams[30].players[0].custom.appearance,undefined);assert.deepEqual(restored.teams[55].players[0].custom.appearance,{hair:11});assert.equal(JSON.stringify(state),before);
 for(const [target,mode]of [[a,'swap'],[{team:56,identity:b.identity},'copy'],[{team:55,identity:{...b.identity,baseSlot:3}},'swap'],[b,'invalid']])assert.throws(()=>core.transferProjectPlayerAppearance(state,a,target,mode,original));assert.equal(JSON.stringify(state),before);
});
test('same-team swapping and bidirectional copying preserve sparse originals, and export only both appearance bytes',()=>{
 const state=structuredClone(initial);state.teams[30].players[0].custom.appearance={hair:13,palette:1};
 const a={team:30,identity:{playerId:'30:8',baseSlot:8}},b={team:30,identity:{playerId:'30:6',baseSlot:6}},original=()=>({hair:2,palette:0});
 const swapped=core.transferProjectPlayerAppearance(state,a,b,'swap',original);assert.equal(swapped.teams[30].players[0].custom.appearance,undefined);assert.deepEqual(swapped.teams[30].players[1].custom.appearance,{hair:13,palette:1});
 const reverse=core.transferProjectPlayerAppearance(state,b,a,'copy',original);assert.equal(reverse.teams[30].players[0].custom.appearance,undefined);
 // Export an appearance-only cross-team transfer so byte changes cannot be hidden by unrelated edits.
 const base=new Uint8Array(0x200000),oa=playerOffset(30,0),ob=playerOffset(1,0);base[oa+6]=0x2E;base[ob+6]=0x9F;
 const clean={schema:'isssd-teams-v1',version:3,teams:{30:{teamId:30,players:[{slot:1,baseSlot:1,playerId:'30:1'}]},1:{teamId:1,players:[{slot:1,baseSlot:1,playerId:'1:1'}]}}};
 const result=core.transferProjectPlayerAppearance(clean,{team:30,identity:{playerId:'30:1',baseSlot:1}},{team:1,identity:{playerId:'1:1',baseSlot:1}},'swap',t=>t===30?{hair:2,palette:0}:{hair:9,palette:1});
 const out=base.slice();applySteps(out,teamsV3PlayerSteps(base,{teamsV1:result}));assert.equal(out[oa+6],0x9F);assert.equal(out[ob+6],0x2E);for(let i=0;i<out.length;i++)if(out[i]!==base[i])assert.ok(i===oa+6||i===ob+6);
});

test('opening appearance selects canonical applied hair and palette instead of stale model defaults',()=>{
 const source=fs.readFileSync(new URL('../editor-src/player-appearance.mjs',import.meta.url),'utf8'),start=source.indexOf('function loadAppearancePlayer('),end=source.indexOf('function openAppearanceDialog(',start),elements={};
 const c=vm.createContext({currentPlayer:0,currentTeam:30,appearanceTempHair:0,appearanceTempPalette:0,nativeAppearanceIdentity:null,nativeAppearanceCore:core,teams:{30:{players:[{playerId:'30:8',baseSlot:8,name:'Pele',hair:0,palette:0}]}},TEAM_NAMES:{30:'Brasil'},$:id=>elements[id]||=( {} ),studioTeamsV3ReadFull:()=>({teams:{30:{players:[{playerId:'30:8',baseSlot:8,appearance:{hair:12,palette:1}}]}}}),renderAppearancePreview(){},renderAppearanceTransferPlayers(){}});
 vm.runInContext(source.slice(start,end)+'loadAppearancePlayer(0);',c);assert.equal(c.appearanceTempHair,12);assert.equal(c.appearanceTempPalette,1);assert.equal(elements.appearanceCurrentSummary.textContent,'APARÊNCIA ATUAL — Cabelo: Tipo 12 · Paleta: 1');assert.equal(c.nativeAppearanceIdentity.baseSlot,8);
});

test('appearance controls retain the applied selection independently of legacy clamp and unavailable graphics',()=>{
 const source=fs.readFileSync(new URL('../editor-src/player-appearance.mjs',import.meta.url),'utf8'),start=source.indexOf('function renderAppearancePreview('),end=source.indexOf('function loadAppearancePlayer(',start),elements={},options=[{value:'0'},{value:'1'}];let gallery=false;
 const c=vm.createContext({appearanceTempHair:12,appearanceTempPalette:1,currentTeam:30,rom:new Uint8Array(),$:id=>elements[id]||=({querySelectorAll:()=>options}),clamp(){throw Error('Legacy clamp must not run');},nativeAppearanceSupported:()=>true,renderHairGallery(){gallery=true;},nativeAppearanceCore:{readNativeAppearancePalettes(){throw Error('preview unavailable');}},nativeAppearanceNote(){}});
 vm.runInContext(source.slice(start,end)+'renderAppearancePreview();',c);assert.equal(elements.appearanceHairValue.value,12);assert.equal(elements.appearancePalette.value,'1');assert.equal(options[1].selected,true);assert.equal(options[0].selected,false);assert.equal(gallery,true);assert.match(elements.appearanceSelectedSummary.textContent,/12.*1/);
});
