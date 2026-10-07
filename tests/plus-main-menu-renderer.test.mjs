import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_MAIN_MENU_REGIONS,
  decodePlusMainMenuTile,
  encodePlusMainMenuTile,
  normalizePlusMainMenuRenderText,
  plusMainMenuGlyphMetrics,
  plusMainMenuMaxChars,
  plusMainMenuWriteRegions,
  renderPlusMainMenu,
  wrapPlusMainMenuText,
} from '../src/core/plus-main-menu-renderer.mjs';
import {PLUS_MAIN_MENU_SCHEMA} from '../src/core/plus-main-menu-state.mjs';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';

const IDS=['openGame','scenario','championship','penalty','cup','training','password','options'];
function style(scale=115){return {previewSelected:0,items:IDS.map(()=>({scale,width:100,height:100,x:0,y:0,letterSpacing:0,lineSpacing:16,align:'center',bold:0}))}}
function state(overrides={}){
  return {schema:PLUS_MAIN_MENU_SCHEMA,version:1,texts:{openGame:'OPEN GAME',scenario:'SCENARIO',championship:'INTERNATIONAL',penalty:'PENALTY SHOOTKICK',cup:'WORLD SERIES',training:'TRAINING',password:'PASSWORD',options:'OPTIONS',...(overrides.texts||{})},style:overrides.style,composition:null,nativeCommitted:!!overrides.nativeCommitted};
}
function approvedProjectState(){return state({texts:{openGame:'JOGATINA',scenario:'CENÁRIOS',championship:'CAMPEONATO',penalty:'PÊNALTIS',cup:'MEGACOPA',training:'TREINOS',password:'SENHA',options:'OPÇÕES'},style:style(115),nativeCommitted:true})}
function compactState(){return state({texts:Object.fromEntries(IDS.map(id=>[id,'A'])),style:style(80),nativeCommitted:true})}

test('main menu renderer normalization matches the verified glyph repertoire',()=>{
  assert.equal(normalizePlusMainMenuRenderText(' opção  rápida! '),'OPÇÃO RÁPIDA');assert.equal(normalizePlusMainMenuRenderText('abc_123'),'ABC 123');
});

test('v6.79 metrics increase vertical weight but never exceed two tile rows',()=>{
  assert.deepEqual(plusMainMenuGlyphMetrics({scale:100,width:100,height:100}),{width:8,height:15});assert.deepEqual(plusMainMenuGlyphMetrics({scale:115,width:100,height:100}),{width:8,height:16});assert.equal(plusMainMenuGlyphMetrics({scale:160,width:125,height:125}).height,16);assert.ok(plusMainMenuGlyphMetrics({scale:160,width:125,height:125}).width<=16);
});

test('main menu wrapping respects the native 112-pixel slot and explicit line breaks',()=>{
  const st={scale:115,width:100,height:100,letterSpacing:0};assert.equal(plusMainMenuMaxChars(st),14);assert.deepEqual(wrapPlusMainMenuText('PENALTY SHOOTKICK',st),['PENALTY','SHOOTKICK']);assert.deepEqual(wrapPlusMainMenuText('JOGO\nRAPIDO',st),['JOGO','RAPIDO']);assert.throws(()=>wrapPlusMainMenuText('UM DOIS TRES QUATRO CINCO SEIS SETE',st),/more than two lines/i);
});

test('4bpp tile encoding round-trips pixels',()=>{
  const pixels=Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>(x+y)&15));const tile=encodePlusMainMenuTile(pixels);assert.deepEqual([...decodePlusMainMenuTile(tile)],pixels.flat());
});

test('v6.79 native capacity remains authoritative instead of silently relocating oversized defaults',()=>{
  assert.throws(()=>renderPlusMainMenu(state()),/tilemap does not fit native block/i);
});

test('approved persisted project menu renders within every native block budget',()=>{
  const rendered=renderPlusMainMenu(approvedProjectState());
  assert.equal(rendered.sprite.length,PLUS_MAIN_MENU_REGIONS.sprite.rawLength);assert.equal(rendered.background.length,PLUS_MAIN_MENU_REGIONS.background.rawLength);assert.equal(rendered.tilemap.length,PLUS_MAIN_MENU_REGIONS.tilemap.rawLength);assert.equal(rendered.pointers.length,PLUS_MAIN_MENU_REGIONS.pointers.length);assert.ok(rendered.spriteTiles<=70);assert.ok(rendered.backgroundTiles<=126);assert.ok(rendered.totalSprites<=255);
  for(const [name,info] of Object.entries(rendered.compressed)){assert.ok(info.compressed.length<=info.capacity,name+' exceeds native capacity');assert.deepEqual(konamiLzDecompress(info.region).data,info.raw,name+' compressed region does not round-trip')}
});

test('renderer produces the five exact historical native write regions for approved project fixture',()=>{
  const {regions}=plusMainMenuWriteRegions(approvedProjectState());assert.deepEqual(regions.map(r=>[r.pc,r.bytes.length]),[[0x0F0000,1628],[0x0F58AB,2413],[0x1169D0,337],[0x0C1FB8,284],[0x0173AA,32]]);
});

test('OAM pointer table follows the verified selection order and sprite counts',()=>{
  const rendered=renderPlusMainMenu(approvedProjectState());let offset=0;for(let i=0;i<8;i++){const address=rendered.pointers[i*4]|(rendered.pointers[i*4+1]<<8);assert.equal(address,0x4000+offset);assert.equal(rendered.pointers[i*4+2],0x80);assert.equal(rendered.pointers[i*4+3],0x78);offset+=rendered.sizes[i]*2}
});

test('per-item style changes raster output deterministically inside a fitting configuration',()=>{
  const base=renderPlusMainMenu(compactState()),items=style(80).items;items[7]={...items[7],bold:1,x:8};const changed=renderPlusMainMenu(state({texts:Object.fromEntries(IDS.map(id=>[id,'A'])),style:{previewSelected:7,items},nativeCommitted:true}));assert.notDeepEqual(changed.background,base.background);assert.notDeepEqual(changed.sprite,base.sprite);assert.notDeepEqual(changed.oam,base.oam);
});

test('same approved semantic menu state always renders byte-identically',()=>{
  const a=plusMainMenuWriteRegions(approvedProjectState()).regions,b=plusMainMenuWriteRegions(approvedProjectState()).regions;assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)assert.deepEqual(a[i].bytes,b[i].bytes);
});
