import {migrateLegacyPlayerAttributes} from './plus-player-state.mjs';
import {migrateLegacyPlayerNames} from './plus-player-name-state.mjs';
import {migrateLegacyPlusMainMenu} from './plus-main-menu-state.mjs';
import {migrateLegacyPlusStrategyTexts} from './plus-strategy-text.mjs';
import {canonicalizePlusTacticsState} from './plus-tactics-state.mjs';

function mergePlayerEdit(base,override){
  return {
    ...base,
    ...override,
    ...((base?.skills||override?.skills)?{skills:{...(base?.skills||{}),...(override?.skills||{})}}:{}),
  };
}

function mergePlayerEdits(legacy,explicit){
  if(explicit!==undefined&&!Array.isArray(explicit))throw new TypeError('playerEdits must be an array');
  const map=new Map(),order=[];
  const add=edit=>{
    if(!edit||typeof edit!=='object'||Array.isArray(edit))throw new TypeError('player edit must be an object');
    const key=String(edit.team)+':'+String(edit.player);
    if(!map.has(key)){order.push(key);map.set(key,structuredClone(edit));}
    else map.set(key,mergePlayerEdit(map.get(key),structuredClone(edit)));
  };
  for(const edit of legacy||[])add(edit);
  for(const edit of explicit||[])add(edit);
  return order.map(key=>map.get(key));
}

export function canonicalProjectSemantic(project){
  const semantic=project?.state?.semantic ?? project?.semantic ?? {};
  if(semantic===null || typeof semantic!=='object' || Array.isArray(semantic)) {
    throw new TypeError('project semantic state must be an object');
  }
  const out=structuredClone(semantic);

  if(out.teamsV1&&typeof out.teamsV1==='object'&&!Array.isArray(out.teamsV1)){
    // Attributes must migrate before names because old v6.92/v6.93 name-roster
    // records can also carry attrHex beside nameHex.
    const attributes=migrateLegacyPlayerAttributes(out.teamsV1);
    out.teamsV1=attributes.teamsV1;
    if(attributes.edits.length||attributes.quarantined.length){
      out.playerEdits=mergePlayerEdits(attributes.edits,out.playerEdits);
    }
    if(attributes.quarantined.length){
      const existing=Array.isArray(out.legacyPlayerAttributeQuarantine)?out.legacyPlayerAttributeQuarantine:[];
      out.legacyPlayerAttributeQuarantine=[...existing,...attributes.quarantined];
    }

    const names=migrateLegacyPlayerNames(out.teamsV1.names);
    if(names.handled){
      out.playerEdits=mergePlayerEdits(names.edits,out.playerEdits);
      delete out.teamsV1.names;
    }
    if(names.quarantined.length){
      const existing=Array.isArray(out.legacyPlayerNameQuarantine)?out.legacyPlayerNameQuarantine:[];
      out.legacyPlayerNameQuarantine=[...existing,...names.quarantined];
    }
  }

  const legacyTactics=out?.teamsV1?.tactics ?? out?.plusTactics ?? null;
  if(legacyTactics){
    out.plusTactics=canonicalizePlusTacticsState(legacyTactics);
    if(out.teamsV1&&typeof out.teamsV1==='object')delete out.teamsV1.tactics;
  }

  // v6.14 stored the eight Strategy-screen phrases as generic graphical text
  // intentions. They are now a verified native text domain: 8 records of
  // 2 lines x 10 cells. Extract only those keys and leave every unrelated
  // textWorkspaceV2 entry untouched for later migrations.
  const strategyMigration=migrateLegacyPlusStrategyTexts(out.textWorkspaceV2,out.plusStrategyTexts);
  if(strategyMigration.handled.length||out.plusStrategyTexts!=null){
    out.plusStrategyTexts=strategyMigration.state;
    const values=out?.textWorkspaceV2?.sections?.graphicIntents?.values;
    if(values&&typeof values==='object'&&!Array.isArray(values)){
      for(const key of strategyMigration.handled)delete values[key];
    }
  }

  // The historical main menu had three overlapping persistence surfaces:
  // mainMenuDraft/textWorkspaceV2 for logical strings, menuScreenV1 for the
  // preview composition, and mainMenuGraphicTextsV600 for the exact native
  // text renderer settings. Collapse those mirrors into one semantic state.
  // The native compressed graphics are deliberately not generated here yet.
  return migrateLegacyPlusMainMenu(out);
}
