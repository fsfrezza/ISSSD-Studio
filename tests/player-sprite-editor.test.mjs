import path from 'node:path';import {fileURLToPath} from 'node:url';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {PLAYER_BODY_CATALOG,readPlayerSprite,playerSpriteWriter,setPlayerSprite,restorePlayerSprite,effectiveProjectHairFrames} from '../src/core/player-sprite-editor.mjs';
import {expandPlusTo4MiB} from '../src/core/plus-tactics-infrastructure.mjs';import {plusCustomHairWriter} from '../src/core/plus-custom-hair.mjs';import {playerOffset} from '../src/core/plus-player.mjs';import {encodeHairTile} from '../src/core/plus-custom-hair.mjs';
function fixture(){const b=new Uint8Array(0x200000);for(const r of PLAYER_BODY_CATALOG){b[r.pc]=r.top&255;b[r.pc+1]=r.top>>8;const q=r.pc+2+r.top;b[q]=r.bottom&255;b[q+1]=r.bottom>>8;for(let i=0;i<r.top;i++)b[r.pc+2+i]=i*17&255;for(let i=0;i<r.bottom;i++)b[q+2+i]=i*31&255;}for(let h=0;h<13;h++){const v=0x97CD58+h*768;b.set([v&255,v>>8&255,v>>16,0],0xED6D+h*4);}b.set([0xB9,0x6D,0xED,0x8D,8,0],0xC7BC3);b.set([0xB9,0x6E,0xED,0x29,0,255],0xC7BE0);return b;}
test('every mapped body frame round-trips without changing DMA headers, padding or neighboring graphics',()=>{
 const base=fixture(),edits={version:1,body:{}};for(const r of PLAYER_BODY_CATALOG){const ref={kind:'body',id:r.id};edits.body[r.id]=readPlayerSprite(base,ref).pixels;}
 const rom=expandPlusTo4MiB(base),before=rom.slice();playerSpriteWriter(rom,{teamsV1:{spriteEdits:edits}},base);assert.deepEqual(rom,before);assert.equal(PLAYER_BODY_CATALOG.length,857);
});
test('mounted body and native hair edits survive project JSON, write only selected pixels, and restore removes overrides',()=>{
 const base=fixture(),body={kind:'body',id:PLAYER_BODY_CATALOG.find(r=>r.mounted).id},hair={kind:'hair',style:3,frame:23};const image=readPlayerSprite(base,body);image.pixels[0]=7;let edits=setPlayerSprite(null,body,image.pixels),h=readPlayerSprite(base,hair).pixels;h[63]=9;edits=setPlayerSprite(edits,hair,h);
 const project=JSON.parse(JSON.stringify({state:{semantic:{teamsV1:{schema:'isssd-teams-v1',version:3,teams:{},spriteEdits:edits}}}})),r=expandPlusTo4MiB(base);playerSpriteWriter(r,project.state.semantic,base);assert.equal(readPlayerSprite(r,body).pixels[0],7);assert.equal(readPlayerSprite(r,hair).pixels[63],9);assert.deepEqual(readPlayerSprite(r,{...hair,frame:22}),readPlayerSprite(base,{...hair,frame:22}));
 const restored=restorePlayerSprite(edits,body);assert.ok(edits.body[body.id]);assert.equal(restored.body[body.id],undefined);const excluded=expandPlusTo4MiB(base),before=excluded.slice();playerSpriteWriter(excluded,project.state.semantic,base,['infraestrutura']);assert.deepEqual(excluded,before);
});
test('custom styles use project pixels in all 24 poses without contaminating asset defaults',()=>{
 const base=fixture(),r=expandPlusTo4MiB(base);r[playerOffset(30,2)+6]=14;r[playerOffset(30,3)+6]=15;let edits;const defaults={14:Array.from({length:24},()=>Array(64).fill(3)),15:Array.from({length:24},()=>Array(64).fill(4))};
 for(const style of [14,15])for(let frame=0;frame<24;frame++){const p=Array(64).fill(style===14?2:5);p[frame]=1;edits=setPlayerSprite(edits,{kind:'hair',style,frame},p);}
 playerSpriteWriter(r,{teamsV1:{spriteEdits:edits}},base);plusCustomHairWriter(r,{teamsV1:{spriteEdits:edits}},base);const frames=effectiveProjectHairFrames(defaults,edits);assert.equal(defaults[14][0][0],3);
 for(const style of [14,15])for(let f=0;f<24;f++){const at=0x3E8100+(style-14)*768+f*32;assert.deepEqual(r.slice(at,at+32),encodeHairTile(frames[style][f]));}
});
test('invalid imported pixels and padding fail before mutating the ROM',()=>{
 const base=fixture(),r=expandPlusTo4MiB(base),body={kind:'body',id:PLAYER_BODY_CATALOG[0].id},p=readPlayerSprite(base,body).pixels,edits=setPlayerSprite(null,body,p);edits.hair={'16:0':Array(64).fill(3)};const before=r.slice();assert.throws(()=>playerSpriteWriter(r,{teamsV1:{spriteEdits:edits}},base));assert.deepEqual(r,before);
 p[p.length-1]=2;assert.throws(()=>setPlayerSprite(null,body,p),/tiles/);assert.throws(()=>setPlayerSprite(null,{kind:'hair',style:1,frame:24},Array(64).fill(1)));assert.throws(()=>setPlayerSprite(null,{kind:'hair',style:1,frame:0},Array(64).fill(16)));
});
test('actual canonical snapshot preserves sprite drawings through repeated save and reopen JSON',()=>{
 const source=fs.readFileSync(new URL('../scripts/patch-player-identity-v1.mjs',import.meta.url),'utf8'),match=source.match(/replaceFunction\('studioTeamsV3Snapshot','studioTeamsV3LegacyPlayerCustom',String.raw`([\s\S]*?)`\);/);assert.ok(match);const value={version:1,hair:{'14:23':Array(64).fill(3)},body:{}},context=vm.createContext({window:{__ISSSD_TEAMS_PROJECT_OVERLAY_V1__:{spriteEdits:value}},studioTeamsV3ReadFull:()=>({teams:{}}),studioTeamsV3Clone:v=>JSON.parse(JSON.stringify(v))});vm.runInContext(match[1],context);for(let i=0;i<3;i++){const saved=JSON.parse(JSON.stringify(vm.runInContext('studioTeamsV3Snapshot()',context)));assert.deepEqual(saved.spriteEdits,value);context.window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__=saved;}
});

test('cumulative export applies body and native hair drawings only in selected Jogadores phase',async()=>{
 const {makePlusTacticalFixture}=await import('./plus-tactics-fixture.mjs'),{buildCumulativeProject}=await import('../src/core/cumulative-build.mjs');const base=makePlusTacticalFixture(),source=fixture(),body={kind:'body',id:PLAYER_BODY_CATALOG[0].id},record=PLAYER_BODY_CATALOG[0];base.set(source.slice(record.pc,record.pc+record.top+record.bottom+4),record.pc);base.set(source.slice(0xED6D,0xEDA1),0xED6D);
 const pixels=readPlayerSprite(base,body).pixels;pixels[0]=5;let edits=setPlayerSprite(null,body,pixels);edits=setPlayerSprite(edits,{kind:'hair',style:1,frame:23},Array(64).fill(4));const project={state:{semantic:{teamsV1:{schema:'isssd-teams-v1',version:3,teams:{},spriteEdits:edits}}}};let final;
 const manifest=buildCumulativeProject(base,project,{selectedAreas:['infraestrutura','jogadores'],onRom:rom=>final=rom});assert.equal(readPlayerSprite(final,body).pixels[0],5);assert.equal(readPlayerSprite(final,{kind:'hair',style:1,frame:23}).pixels[0],4);assert.deepEqual(manifest.unassignedLegacyRanges,[]);
 buildCumulativeProject(base,project,{selectedAreas:['infraestrutura'],onRom:rom=>final=rom});assert.deepEqual(readPlayerSprite(final,body),readPlayerSprite(base,body));
});

test('integrated drawing UI keeps edits across frame switches and applies them to project state',()=>{
 const elements={};class Element{
  constructor(){this.value='';this.style={};this.children=[];this.options=[];this.width=8;this.height=8;}
  set innerHTML(s){this.children=[];this.options=[...s.matchAll(/<option value="([^"]+)"/g)].map(m=>({value:m[1]}));this.value=this.options[0]?.value||'';}
  append(o){this.children.push(o);if(o.tag==='option'){this.options.push(o);if(!this.value)this.value=o.value;}}
  setAttribute(){}setPointerCapture(){}getContext(){return{clearRect(){},fillRect(){}};}getBoundingClientRect(){return{left:0,top:0,width:this.width,height:this.height};}
 }
 const document={getElementById:id=>elements[id]||=(new Element()),createElement:tag=>Object.assign(new Element(),{tag})};const window={ISSSDPlayerSpriteCore:{PLAYER_BODY_CATALOG,readPlayerSprite,setPlayerSprite,restorePlayerSprite,spriteFrameKey:ref=>ref.style+':'+ref.frame,validateSpritePixels:()=>{}},__ISSSD_TEAMS_PROJECT_OVERLAY_V1__:{schema:'isssd-teams-v1',version:3,teams:{}}};window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__=state=>{window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__=state;return true;};
 const colors=Array.from({length:16},(_,i)=>'#'+String(i).repeat(6));const c=vm.createContext({window,document,rom:fixture(),nativeAppearanceSupported:()=>true,nativeAppearanceCore:{hairStyleLabel:i=>'Tipo '+i,readNativeAppearancePalettes:()=>({colors:[colors,colors]})},appearanceTempHair:14,appearanceTempPalette:0,nativeAppearanceFrame:0,currentTeam:30,renderHairGallery:()=>{}});
 vm.runInContext(fs.readFileSync(new URL('../editor-src/player-sprite-editor.mjs',import.meta.url),'utf8')+'\nsetupPlayerSpriteEditor();',c);elements.spriteOpen.onclick();document.getElementById('spriteTool').value='pencil';elements.spriteCanvas.onpointerdown({clientX:0,clientY:0,pointerId:1});elements.spriteCanvas.onpointerup();assert.equal(window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__.spriteEdits,undefined);
 elements.spriteFrame.value='1';elements.spriteFrame.onchange();elements.spriteCanvas.onpointerdown({clientX:1,clientY:0,pointerId:2});elements.spriteCanvas.onpointerup();elements.spriteApply.onclick();const saved=JSON.parse(JSON.stringify(window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__));assert.equal(saved.spriteEdits.hair['14:0'][0],3);assert.equal(saved.spriteEdits.hair['14:1'][1],3);
});

test('Windows CRLF source files generate a valid classic Editor script with no module imports',()=>{
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8'),a=build.indexOf('// Replace only the generated appearance UI;'),z=build.indexOf('// Keep the protected visual baseline',a);
 const root=fileURLToPath(new URL('..',import.meta.url));
 const winFs={...fs,readFileSync:(file,encoding)=>{const data=fs.readFileSync(file,encoding);return typeof data==='string'?data.replace(/\r?\n/g,'\r\n'):data;}};
 const c=vm.createContext({fs:winFs,path,root,loadPlayerHairFiles:()=>({frames:{14:Array.from({length:24},()=>Array(64).fill(3)),15:Array.from({length:24},()=>Array(64).fill(1))}}),html:'<head></head><body><dialog id="appearanceDialog">OLD</dialog><script>const HAIR_NAMES=[];\r\nrenderEmbeddedAssetManifest();</script></body>'});
 vm.runInContext(build.slice(a,z),c);const script=c.html.match(/<script>([\s\S]*?)<\/script>/)[1];assert.doesNotThrow(()=>new vm.Script(script));assert.doesNotMatch(script,/^\s*(import|export)\s/m);assert.ok(c.html.includes('id="spriteWorkspace"'));
});
