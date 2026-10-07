export const PLUS_INTERNAL_TITLE_OFFSET=0x7FC0;
export const PLUS_INTERNAL_TITLE_LENGTH=21;

export function normalizeInternalRomTitle(value){
  return String(value??'').replace(/[^\x20-\x7E]/g,' ').slice(0,PLUS_INTERNAL_TITLE_LENGTH);
}

export function encodeInternalRomTitle(value){
  const clean=normalizeInternalRomTitle(value);
  const out=new Uint8Array(PLUS_INTERNAL_TITLE_LENGTH);
  out.fill(0x20);
  for(let i=0;i<clean.length;i++)out[i]=clean.charCodeAt(i);
  return out;
}

export function readInternalRomTitle(rom){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  if(PLUS_INTERNAL_TITLE_OFFSET+PLUS_INTERNAL_TITLE_LENGTH>rom.length)throw new RangeError('internal ROM title outside ROM');
  let value='';
  for(let i=0;i<PLUS_INTERNAL_TITLE_LENGTH;i++){
    const byte=rom[PLUS_INTERNAL_TITLE_OFFSET+i];
    if(byte>=0x20&&byte<0x7F)value+=String.fromCharCode(byte);
  }
  return value.trim();
}

export function plusRomMetaWriter(rom,state={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const value=state?.romInternalTitle;
  if(value===undefined||value===null)return rom;
  if(typeof value!=='string')throw new TypeError('romInternalTitle must be a string');
  if(PLUS_INTERNAL_TITLE_OFFSET+PLUS_INTERNAL_TITLE_LENGTH>rom.length)throw new RangeError('internal ROM title outside ROM');
  rom.set(encodeInternalRomTitle(value),PLUS_INTERNAL_TITLE_OFFSET);
  return rom;
}
