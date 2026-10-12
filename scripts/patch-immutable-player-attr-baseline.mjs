import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const oldFn=`function studioTeamsV3PlayerOverride(current,base){\n const custom={};\n for(const k of ['name','number','position'])if(!studioTeamsV3Same(current?.[k],base?.[k]))custom[k]=current?.[k];\n if(studioTeamsV3Has(custom,'name')&&current?.nameHex)custom.nameHex=current.nameHex;\n const skills={};\n for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])if(!studioTeamsV3Same(current?.skills?.[k],base?.skills?.[k]))skills[k]=current?.skills?.[k];\n if(Object.keys(skills).length)custom.skills=skills;\n const appearance={};\n for(const k of ['hair','palette'])if(!studioTeamsV3Same(current?.appearance?.[k],base?.appearance?.[k]))appearance[k]=current?.appearance?.[k];\n if(Object.keys(appearance).length)custom.appearance=appearance;\n const tactical={};\n for(const k of ['x','y','className','attack'])if(!studioTeamsV3Same(current?.tactical?.[k],base?.tactical?.[k]))tactical[k]=current?.tactical?.[k];\n if(Object.keys(tactical).length)custom.tactical=tactical;\n return custom;\n}\n`;

const newFn=`function studioTeamsV3OriginalAttrs(t,i){\n try{\n  const src=(typeof original!=='undefined'&&original&&typeof original.slice==='function')?original:null;\n  if(!src)return null;\n  const hs=(src.length%0x8000===0x200)?0x200:0,off=hs+0x150000+(Number(t)*20+Number(i))*7;\n  return studioTeamsV3DecodeAttr(src.slice(off,off+7))||null;\n }catch(_){return null}\n}\nfunction studioTeamsV3PlayerOverride(current,base,originalAttrs){\n const custom={},attrBase=originalAttrs||base||{};\n if(!studioTeamsV3Same(current?.name,base?.name))custom.name=current?.name;\n for(const k of ['number','position'])if(!studioTeamsV3Same(current?.[k],attrBase?.[k]))custom[k]=current?.[k];\n if(studioTeamsV3Has(custom,'name')&&current?.nameHex)custom.nameHex=current.nameHex;\n const skills={};\n for(const k of ['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'])if(!studioTeamsV3Same(current?.skills?.[k],attrBase?.skills?.[k]))skills[k]=current?.skills?.[k];\n if(Object.keys(skills).length)custom.skills=skills;\n const appearance={};\n for(const k of ['hair','palette'])if(!studioTeamsV3Same(current?.appearance?.[k],attrBase?.appearance?.[k]))appearance[k]=current?.appearance?.[k];\n if(Object.keys(appearance).length)custom.appearance=appearance;\n const tactical={};\n for(const k of ['x','y','className','attack'])if(!studioTeamsV3Same(current?.tactical?.[k],base?.tactical?.[k]))tactical[k]=current?.tactical?.[k];\n if(Object.keys(tactical).length)custom.tactical=tactical;\n return custom;\n}\n`;

if(!html.includes(oldFn))throw new Error('Não encontrei studioTeamsV3PlayerOverride sparse para instalar baseline imutável de atributos.');
html=html.replace(oldFn,newFn);
const oldCall='const custom=studioTeamsV3PlayerOverride(team.players[i],bt.players?.[i]);';
const newCall='const custom=studioTeamsV3PlayerOverride(team.players[i],bt.players?.[i],studioTeamsV3OriginalAttrs(Number(team.teamId??id),i));';
if(!html.includes(oldCall))throw new Error('Não encontrei chamada do snapshot sparse para usar ROM-base imutável.');
html=html.replace(oldCall,newCall);

if(!html.includes('studioTeamsV3OriginalAttrs(Number(team.teamId??id),i)'))throw new Error('Baseline imutável de atributos não foi ligado ao snapshot.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: camisa, posição, skills e aparência agora são comparadas diretamente com a ROM-base imutável ao salvar sparse overrides.');
