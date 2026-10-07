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

test('canonical main menu state supplies the eight logical menu entries',()=>{
  const state=canonicalizePlusMainMenuState({texts:{options:'opcoes'}});
  assert.equal(state.schema,PLUS_MAIN_MENU_SCHEMA);
  assert.equal(state.version,1);
  assert.equal(Object.keys(state.texts).length,8);
  assert.equal(state.texts.options,'OPCOES');
  assert.equal(state.texts.scenario,'SCENARIO');
  assert.deepEqual(state.style,{size:115,bold:0});
  assert.equal(state.composition,null);
});

test('legacy aliases international and worldSeries map to current semantic IDs',()=>{
  const state=canonicalizePlusMainMenuState({texts:{international:'CAMPEONATO',worldSeries:'COPA'}});
  assert.equal(state.texts.championship,'CAMPEONATO');
  assert.equal(state.texts.cup,'COPA');
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
  assert.deepEqual(migrated.plusMainMenu.style,{size:120,bold:1});
  assert.equal(migrated.mainMenuDraft,undefined);
  assert.equal(migrated.textWorkspaceV2.sections.mainMenu.values.openGame,undefined);
  assert.equal(migrated.textWorkspaceV2.sections.mainMenu.values.unrelated,'KEEP');
  assert.equal(migrated.textWorkspaceV2.sections.graphicIntents.values[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY],undefined);
  assert.equal(migrated.textWorkspaceV2.sections.graphicIntents.values.otherGraphic,'KEEP');
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
