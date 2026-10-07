export const PLUS_STRATEGY_TEXT_PREFIX='strategy.screen.v614.';
export const PLUS_STRATEGY_LINE_LENGTH=10;
export const PLUS_STRATEGY_LINES=2;
export const PLUS_STRATEGY_RECORD_LENGTH=PLUS_STRATEGY_LINE_LENGTH*PLUS_STRATEGY_LINES;

export const PLUS_STRATEGY_TEXTS=Object.freeze([
  Object.freeze({id:'alloutatk',label:'Todos ao ataque',pc:248014,original:'ALL OUT ATTACK',ptBr:'TODOS ATAQUE'}),
  Object.freeze({id:'center',label:'Ataque pelo centro',pc:248034,original:'PUSH ALONG CENTER',ptBr:'ATAQUE CENTRO'}),
  Object.freeze({id:'wings',label:'Ataque pelas alas',pc:248054,original:'PUSH ALONG WINGS',ptBr:'PELAS ALAS'}),
  Object.freeze({id:'counteratk',label:'Contra-ataque',pc:248074,original:'COUNTER ATTACK',ptBr:'CONTRA ATAQUE'}),
  Object.freeze({id:'alloutdef',label:'Todos para defesa',pc:248094,original:'ALL OUT DEFENSE',ptBr:'TODOS PRA DEFESA'}),
  Object.freeze({id:'pressup',label:'Pressão avançada',pc:248114,original:'PRESS UP',ptBr:'PRESSAO'}),
  Object.freeze({id:'zonepress',label:'Pressão por zona',pc:248134,original:'ZONE PRESS',ptBr:'MARCA ZONA'}),
  Object.freeze({id:'offtrap',label:'Linha de impedimento',pc:248154,original:'OFFSIDE TRAP',ptBr:'FORA JOGO'}),
]);

const BY_ID=new Map(PLUS_STRATEGY_TEXTS.map(item=>[item.id,item]));

export function normalizePlusStrategyText(value){
  return String(value??'').toUpperCase().replace(/[^A-Z ]/g,'').replace(/\s+/g,' ').trim();
}

export function wrapPlusStrategyText(value){
  const normalized=normalizePlusStrategyText(value);
  const words=normalized?normalized.split(' '):[];
  if(words.some(word=>word.length>PLUS_STRATEGY_LINE_LENGTH)){
    throw new RangeError('strategy word exceeds 10 characters');
  }
  const lines=['',''];
  let line=0;
  for(const word of words){
    const candidate=lines[line]?`${lines[line]} ${word}`:word;
    if(candidate.length<=PLUS_STRATEGY_LINE_LENGTH){
      lines[line]=candidate;
      continue;
    }
    line++;
    if(line>=PLUS_STRATEGY_LINES)throw new RangeError('strategy text exceeds two lines of 10 characters');
    lines[line]=word;
  }
  return lines;
}

export function centerPlusStrategyLine(value){
  const line=String(value??'');
  if(line.length>PLUS_STRATEGY_LINE_LENGTH)throw new RangeError('strategy line exceeds 10 characters');
  const padding=PLUS_STRATEGY_LINE_LENGTH-line.length;
  const left=Math.floor(padding/2);
  return ' '.repeat(left)+line+' '.repeat(padding-left);
}

function encodeChar(char){
  if(char===' ')return 0;
  const code=char.charCodeAt(0);
  if(code>=65&&code<=90)return 11+(code-65);
  throw new RangeError('strategy text supports only A-Z and spaces');
}

export function encodePlusStrategyText(value){
  const lines=wrapPlusStrategyText(value);
  const visual=lines.map(centerPlusStrategyLine);
  const bytes=Uint8Array.from(visual.join('').split('').map(encodeChar));
  return {text:normalizePlusStrategyText(value),lines,visual,bytes};
}

export function decodePlusStrategyLine(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length!==PLUS_STRATEGY_LINE_LENGTH){
    throw new TypeError('10-byte Uint8Array strategy line required');
  }
  return Array.from(bytes,value=>value===0?' ':value>=11&&value<=36?String.fromCharCode(65+value-11):' ').join('');
}

export function decodePlusStrategyText(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length!==PLUS_STRATEGY_RECORD_LENGTH){
    throw new TypeError('20-byte Uint8Array strategy record required');
  }
  const first=decodePlusStrategyLine(bytes.slice(0,10)).trim();
  const second=decodePlusStrategyLine(bytes.slice(10,20)).trim();
  return normalizePlusStrategyText([first,second].filter(Boolean).join(' '));
}

export function readPlusStrategyText(rom,id){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const descriptor=BY_ID.get(String(id));
  if(!descriptor)throw new RangeError('unknown Plus strategy id');
  if(descriptor.pc+PLUS_STRATEGY_RECORD_LENGTH>rom.length)throw new RangeError('strategy record outside ROM');
  return decodePlusStrategyText(rom.slice(descriptor.pc,descriptor.pc+PLUS_STRATEGY_RECORD_LENGTH));
}

export function canonicalizePlusStrategyTexts(input){
  if(input==null)return {schema:'isssd-plus-strategy-texts-v1',version:1,items:{}};
  if(typeof input!=='object'||Array.isArray(input))throw new TypeError('Plus strategy text state must be an object');
  const items=input.items??{};
  if(typeof items!=='object'||Array.isArray(items))throw new TypeError('Plus strategy text items must be an object');
  const out={schema:'isssd-plus-strategy-texts-v1',version:1,items:{}};
  for(const descriptor of PLUS_STRATEGY_TEXTS){
    if(!Object.prototype.hasOwnProperty.call(items,descriptor.id))continue;
    const value=items[descriptor.id];
    if(typeof value!=='string')throw new TypeError(`strategy ${descriptor.id} must be a string`);
    const encoded=encodePlusStrategyText(value);
    out.items[descriptor.id]=encoded.text;
  }
  return out;
}

export function migrateLegacyPlusStrategyTexts(textWorkspace,explicitState){
  const explicit=canonicalizePlusStrategyTexts(explicitState);
  const migrated={};
  const values=textWorkspace?.sections?.graphicIntents?.values;
  const handled=[];
  if(values&&typeof values==='object'&&!Array.isArray(values)){
    for(const descriptor of PLUS_STRATEGY_TEXTS){
      const key=PLUS_STRATEGY_TEXT_PREFIX+descriptor.id;
      if(!Object.prototype.hasOwnProperty.call(values,key))continue;
      const value=values[key];
      if(typeof value!=='string')throw new TypeError(`legacy strategy ${descriptor.id} must be a string`);
      migrated[descriptor.id]=encodePlusStrategyText(value).text;
      handled.push(key);
    }
  }
  return {
    handled,
    state:{
      schema:'isssd-plus-strategy-texts-v1',version:1,
      items:{...migrated,...explicit.items},
    },
  };
}

export function plusStrategyTextWriter(rom,state={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const raw=state?.plusStrategyTexts;
  if(raw==null)return rom;
  const semantic=canonicalizePlusStrategyTexts(raw);
  for(const descriptor of PLUS_STRATEGY_TEXTS){
    if(!Object.prototype.hasOwnProperty.call(semantic.items,descriptor.id))continue;
    if(descriptor.pc+PLUS_STRATEGY_RECORD_LENGTH>rom.length)throw new RangeError(`strategy ${descriptor.id} outside ROM`);
    rom.set(encodePlusStrategyText(semantic.items[descriptor.id]).bytes,descriptor.pc);
  }
  return rom;
}
