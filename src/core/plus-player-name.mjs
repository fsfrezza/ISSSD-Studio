export const PLUS_NAME_POINTER_TABLE=0x38138;
export const PLUS_NAME_BANK_PC=0x170000;
export const PLUS_NAME_LENGTH=8;
export const PLUS_NAME_TEAM_COUNT=56;
export const PLUS_NAME_PLAYERS_PER_TEAM=20;

const SPECIAL_DECODE=new Map([
  [0x52,'!'],[0x54,'.'],[0x56,'+'],[0x57,'-'],[0x58,'%'],[0x59,'/'],
  [0x5A,'’'],[0x5B,'~'],[0x5C,':'],[0x5D,'?'],
]);
const SPECIAL_ENCODE=new Map([...SPECIAL_DECODE].map(([byte,char])=>[char,byte]));
SPECIAL_ENCODE.set("'",0x5A);

function validateTeamPlayer(team,player){
  if(!Number.isInteger(team)||team<0||team>=PLUS_NAME_TEAM_COUNT)throw new RangeError('team must be 0..55');
  if(!Number.isInteger(player)||player<0||player>=PLUS_NAME_PLAYERS_PER_TEAM)throw new RangeError('player must be 0..19');
}

export function decodeTallMenuChar(byte){
  const b=Number(byte);
  if(!Number.isInteger(b)||b<0||b>0xFF)throw new RangeError('character byte must be 0..255');
  if(b===0)return ' ';
  if(SPECIAL_DECODE.has(b))return SPECIAL_DECODE.get(b);
  if(b>=0x5E&&b<=0x67)return String.fromCharCode(48+(b-0x5E));
  if(b>=0x68&&b<=0x81)return String.fromCharCode(b-0x27);
  if(b>=0x82&&b<=0x9B)return String.fromCharCode(b-0x21);
  return null;
}

export function encodeTallMenuChar(char){
  const c=String(char??'');
  if([...c].length!==1)throw new TypeError('exactly one character required');
  if(c===' ')return 0;
  if(SPECIAL_ENCODE.has(c))return SPECIAL_ENCODE.get(c);
  const n=c.charCodeAt(0);
  if(n>=48&&n<=57)return 0x5E+(n-48);
  if(n>=65&&n<=90)return n+0x27;
  if(n>=97&&n<=122)return n+0x21;
  throw new RangeError(`unsupported TallMenuText character: ${c}`);
}

export function decodeFixedPlayerName(bytes,{strict=true}={}){
  if(!(bytes instanceof Uint8Array)||bytes.length!==PLUS_NAME_LENGTH)throw new TypeError('player name record must be an 8-byte Uint8Array');
  let out='';
  for(const byte of bytes){
    const char=decodeTallMenuChar(byte);
    if(char===null){
      if(strict)throw new RangeError(`unsupported TallMenuText byte: 0x${byte.toString(16).padStart(2,'0').toUpperCase()}`);
      out+=' ';
    }else out+=char;
  }
  return out;
}

export function encodeFixedPlayerName(value){
  const chars=[...String(value??'')];
  if(chars.length>PLUS_NAME_LENGTH)throw new RangeError('fixed player name must contain at most 8 characters');
  while(chars.length<PLUS_NAME_LENGTH)chars.push(' ');
  return Uint8Array.from(chars.map(encodeTallMenuChar));
}

export function normalizePlayerName(value){
  const normalized=String(value??'')
    .replace(/['‘`´]/g,'’')
    .trim();
  if([...normalized].length>PLUS_NAME_LENGTH)throw new RangeError('player name must contain at most 8 characters');
  if(!/^[A-Za-z .’]*$/.test(normalized))throw new RangeError('player name supports only letters, spaces, period and apostrophe');
  return normalized;
}

export function inferPlayerNameAlignment(fixed){
  const value=String(fixed??'').slice(0,PLUS_NAME_LENGTH).padEnd(PLUS_NAME_LENGTH,' ');
  const lead=(value.match(/^ */)?.[0]??'').length;
  const trail=(value.match(/ *$/)?.[0]??'').length;
  const text=value.trim();
  if(!text)return 'center';
  if(lead+trail===0)return 'center';
  if(Math.abs(lead-trail)<=1)return 'center';
  if(lead===0)return 'left';
  if(trail===0)return 'right';
  return 'manual';
}

export function formatPlayerName(value,alignment='left',{manualFixed=null}={}){
  const name=normalizePlayerName(value);
  const mode=String(alignment||'left');
  if(mode==='manual'){
    if(typeof manualFixed!=='string'||[...manualFixed].length!==PLUS_NAME_LENGTH)throw new TypeError('manual player name layout requires an exact 8-character manualFixed string');
    // Validate every character through the same codec.
    encodeFixedPlayerName(manualFixed);
    return manualFixed;
  }
  if(!['left','center','right'].includes(mode))throw new RangeError('player name alignment must be left, center, right or manual');
  const spare=PLUS_NAME_LENGTH-[...name].length;
  if(mode==='right')return ' '.repeat(spare)+name;
  if(mode==='center'){
    const left=Math.floor(spare/2),right=spare-left;
    return ' '.repeat(left)+name+' '.repeat(right);
  }
  return name+' '.repeat(spare);
}

export function resolvePlusPlayerNameOffset(rom,team,player){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  validateTeamPlayer(team,player);
  const pointerOffset=PLUS_NAME_POINTER_TABLE+team*2;
  if(pointerOffset+2>rom.length)throw new RangeError('Plus player name pointer table outside ROM');
  const pointer=rom[pointerOffset]|(rom[pointerOffset+1]<<8);
  if(pointer<0x8000)throw new RangeError('invalid Plus player name pointer');
  const offset=PLUS_NAME_BANK_PC+pointer+player*PLUS_NAME_LENGTH;
  if(offset+PLUS_NAME_LENGTH>rom.length)throw new RangeError('Plus player name record outside ROM');
  return offset;
}

export function readPlusPlayerName(rom,team,player){
  const offset=resolvePlusPlayerNameOffset(rom,team,player);
  const fixed=decodeFixedPlayerName(rom.slice(offset,offset+PLUS_NAME_LENGTH));
  return {offset,fixed,name:fixed.trim(),alignment:inferPlayerNameAlignment(fixed)};
}

export function writePlusPlayerName(rom,{team,player,name,alignment,manualFixed}={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  validateTeamPlayer(team,player);
  if(typeof name!=='string')throw new TypeError('player name edit requires a name string');
  const offset=resolvePlusPlayerNameOffset(rom,team,player);
  const before=decodeFixedPlayerName(rom.slice(offset,offset+PLUS_NAME_LENGTH));
  const isGoalkeeper=player===0||player===11;
  const effectiveAlignment=isGoalkeeper?'center':(alignment??inferPlayerNameAlignment(before));
  const fixed=formatPlayerName(name,effectiveAlignment,{manualFixed});
  const bytes=encodeFixedPlayerName(fixed);
  rom.set(bytes,offset);
  return {offset,bytes,fixed,name:normalizePlayerName(name),alignment:effectiveAlignment};
}
