import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';
import * as core from'../src/core/goalkeeper-palettes.mjs';import{plusGoalkeeperPalettesWriter,GOALKEEPER_PALETTE_SLOT,GOALKEEPER_PALETTE_HOOKS,GOALKEEPER_SKIN_HOOKS}from'../src/core/plus-goalkeeper-palettes.mjs';import{expandPlusTo4MiB}from'../src/core/plus-tactics-infrastructure.mjs';import{executeKeeperPalette}from'./goalkeeper-palette-cpu-fixture.mjs';
const word=(b,p,v)=>b.set([v&255,v>>8&255],p);
function fixture(){const b=new Uint8Array(0x200000);b.set([0xBF,0x58,0x83,0x82],0x5D06E);for(let t=0;t<56;t++){const ptr=0xFA44+t*24,p=0x40000+ptr;word(b,0x10358+t*2,ptr);word(b,p,21);for(let i=0;i<11;i++)word(b,p+2+i*2,(t+1)*16+i);}for(const h of GOALKEEPER_PALETTE_HOOKS)b.set([0x22,0xEF,0xD0,0x8B],h.pc);for(const h of GOALKEEPER_SKIN_HOOKS)b.set([0x22,0x10,0xD1,0x8B],h.pc);word(b,0x91A6,0x2D82);word(b,0x91AA,0x2DA2);return b;}
const entry=(color)=>({colors:Array(11).fill(color)});
test('Brazil defaults use a dark green shirt and goalkeeper edits remain independent through JSON',()=>{
 const b=fixture(),original=core.nativeGoalkeeperPalette(b,30),defaults=core.defaultGoalkeeperPalette(b,30);assert.deepEqual(defaults.slice(0,5),original.slice(0,5));assert.deepEqual(defaults.slice(9),original.slice(9));for(const c of defaults.slice(5,9))assert.ok((c>>5&31)>(c&31));
 const state=core.validateGoalkeeperPalettes({schema:core.GOALKEEPER_PALETTE_SCHEMA,version:1,players:{'30:1':entry(123),'30:12':entry(456)}}),again=core.validateGoalkeeperPalettes(JSON.parse(JSON.stringify(state)));assert.equal(core.projectGoalkeeperPalette(b,again,30,1)[8],123);assert.equal(core.projectGoalkeeperPalette(b,again,30,12)[8],456);assert.throws(()=>core.validateGoalkeeperPalettes({...state,players:{'30:21':entry(4)}}));assert.equal(core.goalkeeperHexBgr(core.goalkeeperBgrHex(0x15A0)),0x15A0);
});
test('palette writer follows identities across roster movement and does not mutate the base or neighboring bytes',()=>{
 const b=fixture(),before=b.slice(),r=expandPlusTo4MiB(b),s={goalkeeperPalettesV1:{schema:core.GOALKEEPER_PALETTE_SCHEMA,version:1,players:{'30:1':entry(111),'30:12':entry(222)}},teamsV1:{teams:{30:{players:[{baseSlot:1,slot:12},{baseSlot:12,slot:1}]}}}};plusGoalkeeperPalettesWriter(r,s,b);assert.deepEqual(b,before);const at=(t,p)=>GOALKEEPER_PALETTE_SLOT+(t*20+p)*22;assert.equal(r[at(30,0)]|r[at(30,0)+1]<<8,222);assert.equal(r[at(30,11)]|r[at(30,11)+1]<<8,111);assert.deepEqual(r.slice(0,0x5D076),expandPlusTo4MiB(b).slice(0,0x5D076));
 const no=expandPlusTo4MiB(b),copy=no.slice();plusGoalkeeperPalettesWriter(no,s,b,['infraestrutura']);assert.deepEqual(no,copy);const bad=expandPlusTo4MiB(b);bad[GOALKEEPER_PALETTE_SLOT]=0;const snapshot=bad.slice();assert.throws(()=>plusGoalkeeperPalettesWriter(bad,s,b),/ocupado/);assert.deepEqual(bad,snapshot);
});
test('emitted DMA helpers select each current goalkeeper after substitutions and in Skills previews',()=>{
 const b=fixture(),r=expandPlusTo4MiB(b),s={goalkeeperPalettesV1:{schema:core.GOALKEEPER_PALETTE_SCHEMA,version:1,players:{'30:1':entry(123),'30:12':entry(456)}}};plusGoalkeeperPalettesWriter(r,s,b);
 for(const team of[0,30,55])for(const roster of[0,11,19])for(const mode of['side1','side2','preview'])for(const p of[0,1,4,8,9,12]){
  const h=GOALKEEPER_PALETTE_HOOKS.find(h=>h.mode===mode),wram=new Uint8Array(65536),dest=mode==='side2'?0x2DA2:0x2D82,oldD=0xD00;
  wram[mode==='side2'?0x3FA4:0x3F90]=roster;wram[oldD+0x34]=roster;
  assert.equal(executeKeeperPalette(r,h.helper,{x:team*2,a:mode==='side2'?0x34:0x30,p,wram,callerD:mode==='preview'?oldD:null}).native,false);
  const expected=core.projectGoalkeeperPalette(b,s.goalkeeperPalettesV1,team,roster+1);for(let i=0;i<11;i++)assert.equal(wram[dest+i*2]|wram[dest+i*2+1]<<8,expected[i]);assert.equal(wram[dest-1],0);assert.equal(wram[dest+22],0);
 }
 for(const h of GOALKEEPER_PALETTE_HOOKS){assert.equal(executeKeeperPalette(r,h.helper,{x:112,callerD:h.mode==='preview'?0xD00:null}).native,true);}
});

test('actual goalkeeper panel saves two independent uniforms, hydrates reopened projects and retains native DOM IDs',()=>{
 function session(){const elements={};class E{constructor(){this.children=[];this.value='';this.disabled=false;this.classList={add(){},toggle(){}};}set id(v){this._id=v;elements[v]=this;}get id(){return this._id;}append(...e){this.children.push(...e);}set innerHTML(s){this.children=[];for(const m of s.matchAll(/id="([^"]+)"/g))elements[m[1]]=new E();}get innerHTML(){return'';}setAttribute(){}querySelectorAll(q){return q==='h1,h2'?[{textContent:'Goleiros'}]:q==='.card'?[legacy]:[];}}
  const legacy=new E(),page=new E(),b=fixture(),document={readyState:'loading',head:new E(),addEventListener(){},getElementById:id=>elements[id]||null,querySelectorAll:q=>q==='.page'?[page]:[],createElement:()=>new E()};
  const window={ISSSDGoalkeepers:core,activeRomProfile:{id:'iss-deluxe-plus'},__ISSSD_PREKICK_HOST__:{rom:()=>b},TEAM_NAMES:Array.from({length:56},(_,i)=>'Equipe '+i),__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__:{teams:{30:{players:[{playerId:'30:1',baseSlot:1,slot:1,name:'Taffarel',position:'GO'},{playerId:'30:12',baseSlot:12,slot:12,name:'Dida',position:'GO'}]}}},__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__:p=>{p.other='preserved';}};
  window.__ISSSD_TEAMS_SET_PLAYER_APPEARANCE_V1__=(team,identity,value)=>{const p=window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__.teams[team].players.find(p=>p.baseSlot===identity.baseSlot);p.appearance={...value};};
  vm.runInNewContext(fs.readFileSync(new URL('../editor-src/goalkeepers-editor.mjs',import.meta.url),'utf8'),{window,document,console});window.__ISSSD_GOALKEEPERS_EDITOR__.install();return{window,elements,b};}
 const{window,elements,b}=session(),before=b.slice();assert.ok(elements.gkIndividualPanel);assert.equal(elements.gkIndividualColors.children.length,11);assert.equal(elements.gkIndividualColors.children.filter(e=>e.children[1].disabled).length,0);
 const skin=elements.gkIndividualColors.children[3].children[1];skin.value='#D6A573';skin.oninput();assert.equal(window.__ISSSD_GOALKEEPERS_EDITOR__.snapshot().players['30:1'].colors[3],core.goalkeeperHexBgr('#D6A573'));elements.gkIndividualShirt.oninput({target:{value:'#005A29'}});elements.gkIndividualPlayer.onchange({target:{value:'12'}});elements.gkIndividualShirt.oninput({target:{value:'#2030B0'}});
 const p=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__({state:{semantic:{}}});assert.equal(p.other,'preserved');assert.notDeepEqual(p.state.semantic.goalkeeperPalettesV1.players['30:1'].colors,p.state.semantic.goalkeeperPalettesV1.players['30:12'].colors);
 const next=session();next.window.__ISSSD_GOALKEEPERS_EDITOR__.hydrate(JSON.parse(JSON.stringify(p)));assert.deepEqual(JSON.parse(JSON.stringify(next.window.__ISSSD_GOALKEEPERS_EDITOR__.snapshot())),JSON.parse(JSON.stringify(p.state.semantic.goalkeeperPalettesV1)));assert.deepEqual(b,before);
 elements.gkBrazilReference.onclick();const refs=window.__ISSSD_GOALKEEPERS_EDITOR__.snapshot();assert.deepEqual(refs.players['30:1'].colors.slice(5),refs.players['30:12'].colors.slice(5));const ps=window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__.teams[30].players;assert.equal(ps[0].appearance.hair,13);assert.equal(ps[1].appearance.hair,12);
 const hex=elements.gkIndividualColors.children[1].children[2];hex.value='#AA7733';hex.onchange();assert.equal(window.__ISSSD_GOALKEEPERS_EDITOR__.snapshot().players['30:12'].colors[1],core.goalkeeperHexBgr('#AA7733'));
});

test('browser bundle remains a classic script and includes goalkeeper open/save category integration',()=>{
 const source=fs.readFileSync(new URL('../src/core/goalkeeper-palettes.mjs',import.meta.url),'utf8').replace(/\r\n?/g,'\n').replace(/^export /gm,''),runtime=fs.readFileSync(new URL('../editor-src/goalkeepers-editor.mjs',import.meta.url),'utf8');assert.doesNotThrow(()=>new vm.Script(source+'\n'+runtime));
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');for(const fragment of["goalkeeperPalettesV1||null","delete sem.goalkeeperPalettesV1","ds.goalkeeperPalettesV1=clone(ss.goalkeeperPalettesV1)","+'\\n'+goalkeeperRuntime"])assert.ok(build.includes(fragment),fragment);
});

test('native skin ABI and scratch effects survive explicit palette reapplication in both sides and Skills',()=>{
 const b=fixture(),r=expandPlusTo4MiB(b);plusGoalkeeperPalettesWriter(r,{goalkeeperPalettesV1:{schema:core.GOALKEEPER_PALETTE_SCHEMA,version:1,players:{'30:1':entry(123),'30:12':entry(456)}}},b);
 for(const h of GOALKEEPER_SKIN_HOOKS)for(const team of[0,30,55,56])for(const slot of[0,1,11,19,20])for(const p of[0,1,4,8,9,12]){
 const result=executeKeeperPalette(r,h.helper,{x:team*2,a:slot,y:h.pc===0x5D09B?4:0,p,skin:true});assert.equal(result.native,!(team===30&&(slot===0||slot===11)));
 }
 const a=core.brazilGoalkeeperReference(b,1),c=core.brazilGoalkeeperReference(b,12);assert.deepEqual(a.colors.slice(5),c.colors.slice(5));assert.notDeepEqual(a.colors.slice(0,5),c.colors.slice(0,5));assert.equal(a.hair,13);assert.equal(c.hair,12);
});
