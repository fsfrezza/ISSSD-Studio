import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY} from '../src/core/plus-main-menu-state.mjs';
import {PLUS_MAIN_MENU_REGIONS,plusMainMenuWriteRegions} from '../src/core/plus-main-menu-renderer.mjs';

const texts=['JOGATINA','CENÁRIOS','CAMPEONATO','PÊNALTIS','MEGACOPA','TREINOS','SENHA','OPÇÕES'];
const style={previewSelected:0,items:Array.from({length:8},()=>({scale:115,width:100,height:100,x:0,y:0,letterSpacing:0,lineSpacing:16,align:'center',bold:0}))};
const legacyGraphic=JSON.stringify({schema:'isssd-main-menu-text-v5',version:5,texts,style});

function legacyCommittedProject(){
  return {state:{targetLength:0x200000,patchesCompact:[],semantic:{textWorkspaceV2:{sections:{mainMenu:{values:{}},graphicIntents:{values:{[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY]:legacyGraphic}}}}}}};
}

function logicalOnlyProject(){
  return {state:{targetLength:0x200000,patchesCompact:[],semantic:{textWorkspaceV2:{sections:{mainMenu:{values:{options:'OPÇÕES'}},graphicIntents:{values:{}}}}}}};
}

test('project build materializes a historically committed native main menu',()=>{
  const base=new Uint8Array(0x200000);base.fill(0xAA);const before=base.slice();
  const project=legacyCommittedProject();
  const result=buildPlusProjectRom(base,project,{writeChecksum:false});
  assert.deepEqual(base,before);

  const expected=plusMainMenuWriteRegions({
    texts:{openGame:texts[0],scenario:texts[1],championship:texts[2],penalty:texts[3],cup:texts[4],training:texts[5],password:texts[6],options:texts[7]},
    style,composition:null,nativeCommitted:true,
  }).regions;
  for(const region of expected){
    assert.deepEqual(result.rom.slice(region.pc,region.pc+region.bytes.length),region.bytes,region.name);
  }
});

test('logical main-menu text alone never materializes native graphic blocks',()=>{
  const base=new Uint8Array(0x200000);base.fill(0x5A);
  const result=buildPlusProjectRom(base,logicalOnlyProject(),{writeChecksum:false});
  for(const region of Object.values(PLUS_MAIN_MENU_REGIONS)){
    const length=region.capacity??region.length;
    assert.ok(result.rom.slice(region.pc,region.pc+length).every(value=>value===0x5A));
  }
});

test('committed main-menu build is deterministic and detached from legacy project input',()=>{
  const base=new Uint8Array(0x200000),project=legacyCommittedProject(),snapshot=structuredClone(project);
  const a=buildPlusProjectRom(base,project,{writeChecksum:false}).rom;
  const b=buildPlusProjectRom(base,project,{writeChecksum:false}).rom;
  assert.deepEqual(a,b);assert.deepEqual(project,snapshot);
});
