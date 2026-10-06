export const PLUS_TACTICAL_POINTER_TABLE_PC=0x05FDD0;
export const PLUS_TACTICAL_ENTRY_COUNT=57;
export const PLUS_TACTICAL_ORIGINAL_BANK=0x8B;
export const PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC=0x200040;
export const PLUS_TACTICAL_BANK_SELECTOR_MARKER='ISSDTACTBANKV1';
export const PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC=0x200100;
export const PLUS_TACTICAL_RECORD_SIZE=31;

function requireRom(rom){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  return rom;
}

export function plusLoRomPc(bank,addr){
  if(!Number.isInteger(bank)||!Number.isInteger(addr)||bank<0x80||addr<0x8000)return null;
  return ((bank&0x7F)*0x8000)+(addr&0x7FFF);
}

export function plusTacticalBankSelectorActive(rom){
  const source=requireRom(rom);
  const sig=new TextEncoder().encode(PLUS_TACTICAL_BANK_SELECTOR_MARKER);
  if(PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC+sig.length>source.length)return false;
  for(let i=0;i<sig.length;i++)if(source[PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC+i]!==sig[i])return false;
  return true;
}

function tacticalPointer(entry,rom){
  if(!Number.isInteger(entry)||entry<0||entry>=PLUS_TACTICAL_ENTRY_COUNT)return null;
  const off=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  if(off+1>=rom.length)return null;
  return rom[off]|(rom[off+1]<<8);
}

function tacticalBank(entry,rom,selectorActive){
  if(!selectorActive)return PLUS_TACTICAL_ORIGINAL_BANK;
  const off=PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC+entry*2;
  if(off+1>=rom.length)return PLUS_TACTICAL_ORIGINAL_BANK;
  return rom[off];
}

export function resolvePlusTacticalRecord(rom,entry){
  const source=requireRom(rom);
  if(!Number.isInteger(entry)||entry<0||entry>=PLUS_TACTICAL_ENTRY_COUNT)return null;
  const ptr=tacticalPointer(entry,source);
  if(ptr===null||ptr<0x8000)return null;
  const selectorActive=plusTacticalBankSelectorActive(source);
  const bank=tacticalBank(entry,source,selectorActive);
  const pc=plusLoRomPc(bank,ptr);
  if(pc===null||pc<0||pc+PLUS_TACTICAL_RECORD_SIZE>source.length)return null;
  return {
    entry,
    ptr,
    pointerBank:bank,
    recordPc:pc,
    pointerEntryPc:PLUS_TACTICAL_POINTER_TABLE_PC+entry*2,
    raw:source.slice(pc,pc+PLUS_TACTICAL_RECORD_SIZE),
    layout:selectorActive?'bank-selector-v1':'plus-original',
  };
}
