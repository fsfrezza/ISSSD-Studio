import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLUS_MAIN_MENU_SCHEMA,
  PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY,
  canonicalizePlusMainMenuState,
  migrateLegacyPlusMainMenu,
  normalizePlusMainMenuText,
} from '../src/core/plus-main-menu-state.mjs';
import {canonicalProjectSemantic} from '../src/core/project-semantic.mjs';

test('main menu text normalization preserves explicit line breaks and canonicalizes case/spacing',()=>{
  assert.equal(normalizePlusMainMenuText('  open   game\r\n  deluxe  '),'OPEN GAME\nDELUXE');
});

test('canonical main menu state supplies the eight logical menu entries and v6.08 item styles',()=>{
  const state=canonicalizePlusMainMenuState({texts:{options:'opcoes'}});
  assert.equal(state.schema,PLUS_MAIN_MENU_SCHEMA);
  assert.equal(state.version,1);
  assert.equal(Object.keys(state.texts).length,8);
  assert.equal(state.texts.options,'OPCOES');
  assert.equal(state.texts.scenario,'SCENARIO');
  assert.equal(state.style.previewSelected,1);
  assert.equal(state.style.items.length,8);
  assert.deepEqual(state.style.items[0],{scale:115,width:100,height:100,x:0,y:0,letterSpacing:0,lineSpacing:16,align:'center',bold:0});
  assert.equal(state.composition,null);
});

test('legacy aliases international and worldSeries map to current semantic IDs',()=>{
  const state=canonicalizePlusMainMenuState({texts:{international:'CAMPEONATO',worldSeries:'COPA'}});
  assert.equal(state.texts.championship,'CAMPEONATO');
  assert.equal(state.texts.cup,'COPA');
});

test('v6.01 global size/bold promote to all eight modern item styles',()=>{
  const state=canonicalizePlusMainMenuState({style:{size:120,bold:1}});
  assert.equal(state.style.items.length,8);
  for(const item of state.style.items){
    assert.equal(item.scale,120);
    assert.equal(item.bold,1);
    assert.equal(item.width,100);
    assert.equal(item.height,100);
  }
});

test('v6.08 per-item style survives semantic canonicalization',()=>{
  const items=Array.from({length:8},(_,i)=>({
    scale:100+i,width:100,height:105,x:i%2?8:0,y:i%2?-8:0,
    letterSpacing:i===3?8:0,lineSpacing:i===4?24:16,align:i===5?'left':'center',bold:i===6?1:0,
  }));
  const state=canonicalizePlusMainMenuState({style:{previewSelected:6,items}});
  assert.equal(state.style.previewSelected,6);
  assert.equal(state.style.items[3].letterSpacing,8);
  assert.equal(state.style.items[4].lineSpacing,24);
  assert.equal(state.style.items[5].align,'left');
  assert.equal(state.style.items[6].bold,1);
});

test('legacy native main-menu graphic intent has priority because it preserves line breaks and style',()=>{
  const graphic=JSON.stringify({
    schema:'isssd-main-menu-text-v2',version:2,
    texts:['JOGO\nRAPIDO','CENARIO','CAMPEONATO','PENALES','COPA','TREINO','CHAVE','OPCOES'],
    style:{size:120,bold:1},
  });
  const semantic={
    mainMenuDraft:{openGame:'OLD DRAFT',options:'OLD OPTIONS'},
    textWorkspaceV2:{sections:{
      mainMenu:{values:{openGame:'WORKSPACE',options:'WORKSPACE OPTIONS',unrelated:'KEEP'}},
      graphicIntents:{values:{[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY]:graphic,otherGraphic:'KEEP'}},
    }},
  };
  const migrated=migrateLegacyPlusMainMenu(semantic);
  assert.equal(migrated.plusMainMenu.texts.openGame,'JOGO\nRAPIDO');
  assert.equal(migrated.plusMainMenu.texts.options,'OPCOES');
  assert.equal(migrated.plusMainMenu.style.items[0].scale,120);
  assert.equal(migrated.plusMainMenu.style.items[7].bold,1);
  assert.equal(migrated.mainMenuDraft,undefined);
  assert.equal(migrated.textWorkspaceV2.sections.mainMenu.values.openGame,undefined);
  assert.equal(migrated.textWorkspaceV2.sections.mainMenu.values.unrelated,'KEEP');
  assert.equal(migrated.textWorkspaceV2.sections.graphicIntents.values[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY],undefined);
  assert.equal(migrated.textWorkspaceV2.sections.graphicIntents.values.otherGraphic,'KEEP');
});

test('v6.08 legacy graphic intent preserves all eight per-item styles',()=>{
  const items=Array.from({length:8},(_,i)=>({scale:110+i,width:95+i,height:100,x:i%2?8:0,y:0,letterSpacing:0,lineSpacing:16,align:'center',bold:i===7?1:0}));
  const graphic=JSON.stringify({texts:['A','B','C','D','E','F','G','H'],style:{previewSelected:5,items}});
  const migrated=migrateLegacyPlusMainMenu({textWorkspaceV2:{sections:{mainMenu:{values:{}},graphicIntents:{values:{[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY]:graphic}}}}});
  assert.equal(migrated.plusMainMenu.style.previewSelected,5);
  assert.equal(migrated.plusMainMenu.style.items[3].scale,113);
  assert.equal(migrated.plusMainMenu.style.items[7].bold,1);
});

test('menuScreenV1 migrates into semantic composition without becoming ROM bytes',()=>{
  const ids=['openGame','scenario','championship','penalty','cup','training','password','options'];
  const composition={schema:'isssd-menu-screen-v1',version:1,background:'menu-base',cursor:3,items:ids.map((id,i)=>({
    id,mode:'text',text:'item '+i,x:10+i,y:20+i,w:100,h:30,font:'retro',size:34,
  }))};
  const out=canonicalProjectSemantic({state:{semantic:{
    menuScreenV1:composition,
    textWorkspaceV2:{sections:{mainMenu:{values:{options:'OPCOES'}},graphicIntents:{values:{}}}},
  }}});
  assert.equal(out.menuScreenV1,undefined);
  assert.equal(out.plusMainMenu.composition.cursor,3);
  assert.equal(out.plusMainMenu.composition.items[7].id,'options');
  assert.equal(out.plusMainMenu.composition.items[7].text,'ITEM 7');
  assert.equal(out.plusMainMenu.texts.options,'OPCOES');
});

test('explicit semantic main menu wins over stale legacy mirrors',()=>{
  const out=canonicalProjectSemantic({state:{semantic:{
    plusMainMenu:{schema:PLUS_MAIN_MENU_SCHEMA,version:1,texts:{options:'CONFIG'},style:{size:100,bold:0}},
    mainMenuDraft:{options:'OLD'},
    textWorkspaceV2:{sections:{mainMenu:{values:{options:'OLDER'}},graphicIntents:{values:{}}}},
  }}});
  assert.equal(out.plusMainMenu.texts.options,'CONFIG');
  assert.equal(out.plusMainMenu.style.items[0].scale,100);
  assert.equal(out.mainMenuDraft,undefined);
  assert.equal(out.textWorkspaceV2.sections.mainMenu.values.options,undefined);
});

test('malformed legacy graphic intent is preserved instead of silently discarded',()=>{
  const semantic={textWorkspaceV2:{sections:{mainMenu:{values:{}},graphicIntents:{values:{
    [PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY]:'{bad json',
  }}}}};
  const out=migrateLegacyPlusMainMenu(semantic);
  assert.equal(out.plusMainMenu,undefined);
  assert.equal(out.textWorkspaceV2.sections.graphicIntents.values[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY],'{bad json');
});

test('migration does not mutate source semantic state',()=>{
  const semantic={mainMenuDraft:{options:'OPCOES'}};
  const before=structuredClone(semantic);
  migrateLegacyPlusMainMenu(semantic);
  assert.deepEqual(semantic,before);
});
