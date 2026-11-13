import {PREMATCH_GRAPHIC_LABELS,DELUXE_PREMATCH_PORTUGUESE} from './deluxe-prematch-labels.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText} from './plus-strategy-text.mjs';
import {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS,readNativeField,readCursorHelp} from './deluxe-native-fields.mjs';
import {DELUXE_MENU_SECTIONS} from './deluxe-menu-text.mjs';
import {DELUXE_PORTUGUESE_MENUS} from './deluxe-portuguese-menu.mjs';
import {TRAINING_HUD_FIELDS,MATCH_STATISTICS_FIELDS} from './deluxe-match-texts.mjs';
import {PLUS_MAIN_MENU_IDS,PLUS_MAIN_MENU_ORIGINAL} from './deluxe-main-menu.mjs';
import {TITLE_TEXT_FIELDS,readTitleText} from './deluxe-title-screen.mjs';
export const NATIVE_PORTUGUESE={SELECT:'ELEJA',ASSIGNMENTS:'MARCACOES',TACTICS:'TATICAS',ADJUST:'AJUSTE',STRATEGY:'TATICA',DISPLAY:'EXIBIR',NONE:'NAO',DISPLAYS:'MOSTRAR',ONLY:'SO',NUMBER:'NUMERO',OF:'DE',STRATEGIES:'TATICAS',SNOW:'NEVE',FINE:'BOM',RAIN:'CHUV'};
export const MENU_PORTUGUESE={openGame:'AMISTOSO',scenario:'CENARIOS',championship:'CAMPEONATO',penalty:'PENAIS',cup:'MEGACOPA',training:'TREINOS',password:'SENHA',options:'OPCOES'};
const stats={shots:'CHUTES',freeKicks:'FALTAS',cornerKicks:'ESCANTEIOS',penaltyKicks:'PÊNALTIS',yellowCards:'AMARELOS',redCards:'VERMELHOS',offsides:'IMPEDIMENTOS',ownGoal:'G CONTRA',firstHalf:'1T',secondHalf:'2T'};
export const TEXT_TAB_SCOPES=['texts','nativeTexts','menuTexts','trainingHud','matchStatistics','preMatchLabels'];
export function textPresetFields(base){const out=[];const add=(scope,key,original,portuguese,path)=>out.push({scope,key,original,portuguese,path});
 for(const f of PLUS_STRATEGY_TEXTS)add('texts',f.id,readPlusStrategyText(base,f.id),f.ptBr,['strategyTexts',f.id]);
 for(const f of NATIVE_SCREEN_TEXT_FIELDS)add('nativeTexts',String(f.pc),readNativeField(base,f),NATIVE_PORTUGUESE[f.original],['nativeTexts',String(f.pc)]);
 for(const s of DELUXE_MENU_SECTIONS)for(const f of s.fields)add('menuTexts',s.id+'/'+f[0],f[1],DELUXE_PORTUGUESE_MENUS[s.id][f[0]],['menuTexts',s.id,f[0]]);
 for(const f of CURSOR_HELP_FIELDS)add('cursorHelp',f[0],readCursorHelp(base,f),f[2],['cursorHelp',f[0]]);
 for(const f of TRAINING_HUD_FIELDS)add('trainingHud',f[0],f[1],f[2],['trainingHud',f[0]]);
 for(const f of MATCH_STATISTICS_FIELDS)add('matchStatistics',f[0],f[1],stats[f[0]],['matchStatistics',f[0]]);
 for(const id of PLUS_MAIN_MENU_IDS)add('mainMenu',id,PLUS_MAIN_MENU_ORIGINAL[id],MENU_PORTUGUESE[id],['mainMenu','texts',id]);
 for(const [id,original]of PREMATCH_GRAPHIC_LABELS)add('preMatchLabels',id,original,DELUXE_PREMATCH_PORTUGUESE[id],['preMatchLabels',id]);
 for(const f of TITLE_TEXT_FIELDS)add('titleTexts',f.id,readTitleText(base,f),f.id==='copyright'?'@1995KONAMI DIREITOS RESERVADOS':'LICENCIADO NINTENDO',['titleScreen','texts',f.id]);
 return out;
}
function prune(o){for(const key of Object.keys(o))if(o[key]&&typeof o[key]==='object'&&!Array.isArray(o[key])){prune(o[key]);if(!Object.keys(o[key]).length)delete o[key];}}
export function applyTextPreset(project,base,scope,mode){if(!['original','portuguese'].includes(mode))throw Error('Preset de texto inválido');const fields=textPresetFields(base).filter(f=>scope==='allTexts'?TEXT_TAB_SCOPES.includes(f.scope):f.scope===scope||f.scope==='menuTexts'&&scope===f.key.split('/')[0]);if(!fields.length)throw Error('Seção de texto desconhecida');const next=structuredClone(project);
 for(const f of fields){const value=mode==='original'?f.original:f.portuguese;if(typeof value!=='string')throw Error('Tradução não disponível: '+f.key);let parent=next.changes;for(const key of f.path.slice(0,-1))parent=parent[key]??={};const key=f.path.at(-1);if(value===f.original)delete parent[key];else parent[key]=value;}
 if(scope==='mainMenu'){if(mode==='portuguese'){next.changes.mainMenu??={texts:{}};next.changes.mainMenu.scale=95;}else if(next.changes.mainMenu)delete next.changes.mainMenu.scale;}
 prune(next.changes);if(next.changes.mainMenu)next.changes.mainMenu.texts??={};next.changes.strategyTexts??={};next.changes.improvements??=[];return next;
}
