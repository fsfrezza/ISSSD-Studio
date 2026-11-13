import {applyDeluxeTeamVisuals} from './deluxe-team-visuals.mjs';
import {validateTitleComposer} from './deluxe-title-composer.mjs';
import {prepareDeluxeStructure} from './deluxe-structure.mjs';
import {applyDeluxeGroups,applyDeluxeGroupLabels} from './deluxe-groups.mjs';
import {applyDeluxePlayers} from './deluxe-players.mjs';
import {PLUS_STRATEGY_TEXTS, encodePlusStrategyText, readPlusStrategyText} from './plus-strategy-text.mjs';
import {encodeInternalRomTitle, readInternalRomTitle} from './plus-rom-meta.mjs';
import {applyDeluxeTitleScreen} from './deluxe-title-screen.mjs';
import {applyDeluxeMatchTexts} from './deluxe-match-texts.mjs';
import {applyDeluxeSounds} from './deluxe-sounds.mjs';
import {applyDeluxeMainMenu} from './deluxe-main-menu.mjs';
import {applyDeluxeMenuTexts} from './deluxe-menu-text.mjs';
import {applyDeluxeNativeChanges} from './deluxe-native-fields.mjs';
import {diffRanges} from './rom-integrity.mjs';

export const DELUXE_SHA256='d2fe66c1ce66c65ce14e478c94be2e616f9e2cad374b5783a6a64d3c1a99cfa9';
export const DELUXE_SCHEMA='isssd-deluxe-project-v1';
export {IMPROVEMENTS} from './deluxe-improvements.mjs';

export function splitRom(file){
  if(!(file instanceof Uint8Array))throw new TypeError('ROM deve ser Uint8Array');
  const headerSize=file.length%0x8000===512?512:0;
  if(file.length-headerSize!==0x200000)throw new Error('Esta etapa suporta somente a base Deluxe de 2 MB');
  return {header:file.slice(0,headerSize),rom:file.slice(headerSize)};
}
export async function identifyDeluxe(file){
  const {header,rom}=splitRom(file);
  const hash=await globalThis.crypto.subtle.digest('SHA-256',rom);
  const sha256=Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
  if(sha256!==DELUXE_SHA256)throw new Error('ROM incompatível: selecione o Deluxe original (USA). Plus e hacks não são aceitos neste fluxo.');
  return {id:'deluxe-usa',sha256,size:rom.length,headerSize:header.length,title:readInternalRomTitle(rom)};
}
export async function createDeluxeProject(file){
  const base=await identifyDeluxe(file);
  return {schema:DELUXE_SCHEMA,version:1,base,changes:{strategyTexts:{},improvements:[]}};
}
function object(value,label){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError(label+' inválido');
  return value;
}
function keys(value,allowed,label){
  object(value,label);
  for(const key of Object.keys(value))if(!allowed.includes(key))throw new Error(label+': campo não suportado '+key);
}
export async function buildDeluxeProject(file,project){
  const base=await identifyDeluxe(file);
  keys(project,['schema','version','base','changes'],'projeto');
  if(project.schema!==DELUXE_SCHEMA||project.version!==1||project.base?.sha256!==base.sha256||project.base?.id!==base.id)throw new Error('Projeto não pertence à base Deluxe original');
  keys(project.changes,['strategyTexts','internalTitle','improvements','nativeTexts','cursorHelp','stadiums','menuTexts','mainMenu','sounds','trainingHud','matchStatistics','titleScreen','players','groups','structure','titleComposer','groupLabels','teamVisuals'],'alterações');
  const changes=project.changes;
  if(changes.titleComposer!==undefined)validateTitleComposer(changes.titleComposer);
  if(!Array.isArray(changes.improvements))throw new Error('Lista de melhorias inválida');
  if(changes.improvements.length)throw new Error('Melhorias ainda sem patch validado: '+changes.improvements.join(', '));
  const {rom,header}=splitRom(file),playerBase=prepareDeluxeStructure(rom,changes.structure);
  let out=playerBase.slice();
  if(changes.structure&&changes.groups!==undefined)throw Error('Use os grupos da estrutura ampliada');
  if(changes.structure&&changes.groupLabels!==undefined)throw Error('Use os nomes dos grupos da estrutura ampliada');
  applyDeluxeGroupLabels(out,rom,changes.groupLabels);
  const texts=object(changes.strategyTexts,'textos');
  keys(texts,PLUS_STRATEGY_TEXTS.map(x=>x.id),'textos');
  for(const item of PLUS_STRATEGY_TEXTS){
    if(!Object.hasOwn(texts,item.id))continue;
    if(typeof texts[item.id]!=='string')throw new TypeError('Texto deve ser string');
    // Reuse the existing encoder only for the eight byte-identical native records.
    if(texts[item.id]!==readPlusStrategyText(rom,item.id))
      out.set(encodePlusStrategyText(texts[item.id]).bytes,item.pc);
  }
  applyDeluxeGroups(out,rom,changes.groups);
  applyDeluxePlayers(out,playerBase,changes.players);
  applyDeluxeNativeChanges(out,rom,changes);
  applyDeluxeMenuTexts(out,rom,changes.menuTexts);
  applyDeluxeMainMenu(out,rom,changes.mainMenu);
  applyDeluxeSounds(out,rom,changes.sounds);
  applyDeluxeMatchTexts(out,rom,changes);
  applyDeluxeTitleScreen(out,rom,changes.titleScreen);
  if(Object.hasOwn(changes,'internalTitle')){
    if(typeof changes.internalTitle!=='string')throw new TypeError('Título deve ser string');
    out.set(encodeInternalRomTitle(changes.internalTitle),0x7fc0);
  }
  out=applyDeluxeTeamVisuals(out,rom,changes.structure,changes.teamVisuals);
  const edited=diffRanges(rom,out).changedBytes>0;
  if(edited){
    // For the supported 2 MB power-of-two ROM the checksum quartet contributes
    // 0x1FE to the final sum. Keep the original checksum on an untouched export.
    out.set([0xff,0xff,0,0],0x7fdc);
    const sum=out.reduce((sum,b)=>(sum+b)&0xffff,0),complement=sum^0xffff;
    out.set([complement&255,complement>>>8,sum&255,sum>>>8],0x7fdc);
  }
  const output=new Uint8Array(header.length+out.length);
  output.set(header);output.set(out,header.length);
  return {rom:output,diff:diffRanges(rom,out),expanded:out.length>rom.length,base};
}
