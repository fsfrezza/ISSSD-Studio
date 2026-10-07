import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_STRATEGY_TEXT_PREFIX,
  PLUS_STRATEGY_TEXTS,
  PLUS_STRATEGY_RECORD_LENGTH,
  wrapPlusStrategyText,
  encodePlusStrategyText,
  decodePlusStrategyText,
  readPlusStrategyText,
  plusStrategyTextWriter,
} from '../src/core/plus-strategy-text.mjs';
import {canonicalProjectSemantic} from '../src/core/project-semantic.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

function blankRom(){return new Uint8Array(0x200000);}

test('strategy screen has eight contiguous 20-byte native records',()=>{
  assert.equal(PLUS_STRATEGY_TEXTS.length,8);
  assert.equal(PLUS_STRATEGY_RECORD_LENGTH,20);
  for(let i=1;i<PLUS_STRATEGY_TEXTS.length;i++){
    assert.equal(PLUS_STRATEGY_TEXTS[i].pc-PLUS_STRATEGY_TEXTS[i-1].pc,20);
  }
  assert.equal(PLUS_STRATEGY_TEXTS[0].pc,248014);
  assert.equal(PLUS_STRATEGY_TEXTS[7].pc,248154);
});

test('TODOS PRA DEFESA wraps only at spaces into the verified two-line layout',()=>{
  assert.deepEqual(wrapPlusStrategyText('TODOS PRA DEFESA'),['TODOS PRA','DEFESA']);
  const encoded=encodePlusStrategyText('TODOS PRA DEFESA');
  assert.deepEqual(encoded.visual,['TODOS PRA ','  DEFESA  ']);
  assert.deepEqual([...encoded.bytes],[
    30,25,14,25,29,0,26,28,11,0,
    0,0,14,15,16,15,29,11,0,0,
  ]);
});

test('strategy codec normalizes to uppercase A-Z and spaces and round-trips text',()=>{
  const encoded=encodePlusStrategyText('  contra   ataque!  ');
  assert.equal(encoded.text,'CONTRA ATAQUE');
  assert.equal(decodePlusStrategyText(encoded.bytes),'CONTRA ATAQUE');
});

test('strategy layout rejects a word longer than ten cells',()=>{
  assert.throws(()=>encodePlusStrategyText('ABCDEFGHIJK'),/word exceeds 10/i);
});

test('strategy layout rejects a phrase requiring more than two lines',()=>{
  assert.throws(()=>encodePlusStrategyText('AAAAA BBBBB CCCCC'),/exceeds two lines/i);
});

test('strategy writer changes only the selected native 20-byte record',()=>{
  const rom=blankRom();
  rom.fill(0xA5);
  const before=rom.slice();
  const target=PLUS_STRATEGY_TEXTS.find(item=>item.id==='alloutdef');
  plusStrategyTextWriter(rom,{plusStrategyTexts:{items:{alloutdef:'TODOS PRA DEFESA'}}});
  assert.equal(readPlusStrategyText(rom,'alloutdef'),'TODOS PRA DEFESA');
  for(let i=0;i<rom.length;i++){
    if(i>=target.pc&&i<target.pc+20)continue;
    assert.equal(rom[i],before[i]);
  }
});

test('legacy textWorkspace strategy intention migrates without consuming unrelated text intentions',()=>{
  const key=PLUS_STRATEGY_TEXT_PREFIX+'alloutdef';
  const project={state:{semantic:{textWorkspaceV2:{
    format:'ISSSD_TEXT_WORKSPACE',version:2,
    sections:{graphicIntents:{values:{[key]:'TODOS PRA DEFESA','other.asset':'KEEP ME'}}}
  }}}};
  const out=canonicalProjectSemantic(project);
  assert.equal(out.plusStrategyTexts.items.alloutdef,'TODOS PRA DEFESA');
  assert.equal(out.textWorkspaceV2.sections.graphicIntents.values[key],undefined);
  assert.equal(out.textWorkspaceV2.sections.graphicIntents.values['other.asset'],'KEEP ME');
  assert.equal(project.state.semantic.textWorkspaceV2.sections.graphicIntents.values[key],'TODOS PRA DEFESA');
});

test('explicit semantic strategy value overrides migrated legacy intention',()=>{
  const key=PLUS_STRATEGY_TEXT_PREFIX+'alloutdef';
  const project={state:{semantic:{
    plusStrategyTexts:{items:{alloutdef:'ALL OUT DEFENSE'}},
    textWorkspaceV2:{sections:{graphicIntents:{values:{[key]:'TODOS PRA DEFESA'}}}}
  }}};
  const out=canonicalProjectSemantic(project);
  assert.equal(out.plusStrategyTexts.items.alloutdef,'ALL OUT DEFENSE');
  assert.equal(out.textWorkspaceV2.sections.graphicIntents.values[key],undefined);
});

test('project build reapplies migrated strategy text through built-in writer',()=>{
  const base=blankRom();
  const key=PLUS_STRATEGY_TEXT_PREFIX+'alloutdef';
  const project={state:{targetLength:base.length,patches:[],semantic:{
    textWorkspaceV2:{sections:{graphicIntents:{values:{[key]:'TODOS PRA DEFESA'}}}}
  }}};
  const before=base.slice();
  const result=buildPlusProjectRom(base,project,{writeChecksum:false});
  assert.equal(readPlusStrategyText(result.rom,'alloutdef'),'TODOS PRA DEFESA');
  assert.deepEqual(base,before);
});
