import {
  PLUS_TACTICAL_BANK_SELECTOR_MARKER,
  PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC,
  PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC,
  PLUS_TACTICAL_POINTER_TABLE_PC,
  plusLoRomPc,
  plusTacticalBankSelectorActive,
} from './plus-tactics-address.mjs';

const EXPANDED_SIZE=0x400000;
const EXPANSION_SIG_PC=0x20A000;
const EXPANSION_SIG='ISSSD-PLUS-4M-ONLY';
const SELECTOR_TABLE_BANK=0xC0;
const SELECTOR_TABLE_ADDR=0x8100;
const HELPER_PCS=[0x200200,0x200210,0x200220];
const ALTERNATE_BANKS=[0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7];
const OLD_MARKER='ISSDTACTICS56V1';

export const PLUS_TACTICAL_EXPECTED_LOADERS=Object.freeze([
  Object.freeze({pc:0x02AA88,pointerDp:0x02,bankDp:0x04,helperPc:HELPER_PCS[0]}),
  Object.freeze({pc:0x02B160,pointerDp:0xC2,bankDp:0xC4,helperPc:HELPER_PCS[1]}),
  Object.freeze({pc:0x031934,pointerDp:0xC0,bankDp:0xC2,helperPc:HELPER_PCS[2]}),
]);

function bytesEqual(source,off,bytes){
  if(off<0||off+bytes.length>source.length)return false;
  for(let i=0;i<bytes.length;i++)if(source[off+i]!==bytes[i])return false;
  return true;
}
function ascii(text){return new TextEncoder().encode(text);}
function hasAscii(source,pc,text){return bytesEqual(source,pc,ascii(text));}
function ptrAt(source,entry){
  const off=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  if(off+1>=source.length)return null;
  return source[off]|(source[off+1]<<8);
}
function helperBytes(bankDp){
  return new Uint8Array([0xBF,SELECTOR_TABLE_ADDR&255,(SELECTOR_TABLE_ADDR>>>8)&255,SELECTOR_TABLE_BANK,0x85,bankDp,0x6B]);
}
function jslPatch(helperPc){
  const bank=0x80+Math.floor(helperPc/0x8000),addr=0x8000+(helperPc&0x7FFF);
  return new Uint8Array([0x22,addr&255,(addr>>>8)&255,bank,0xEA]);
}
function loaderBytes(e,patched=false){
  const head=[0xBF,0xD0,0xFD,0x8B,0x85,e.pointerDp];
  return new Uint8Array(patched?[...head,...jslPatch(e.helperPc)]:[...head,0xA9,0x8B,0x00,0x85,e.bankDp]);
}
function loaderState(source,e){
  if(bytesEqual(source,e.pc,loaderBytes(e,false)))return 'original';
  if(bytesEqual(source,e.pc,loaderBytes(e,true)))return 'patched';
  return 'unknown';
}
function safeWrite(writes,source,pc,bytes,label){
  if(pc<0||pc+bytes.length>source.length)throw new RangeError(`${label}: destination out of bounds`);
  let blank=true;for(let i=0;i<bytes.length;i++)if(source[pc+i]!==0xFF){blank=false;break;}
  const same=bytesEqual(source,pc,bytes);
  if(!blank&&!same)throw new Error(`${label}: incompatible occupied area at 0x${pc.toString(16)}`);
  if(!same)writes.push({off:pc,bytes:Uint8Array.from(bytes)});
}
function groupEntriesByPtr(source){
  const groups=new Map();
  for(let i=0;i<57;i++){
    const ptr=ptrAt(source,i);
    if(ptr===null||ptr<0x8000)throw new Error(`invalid tactical pointer for entry ${i}`);
    if(!groups.has(ptr))groups.set(ptr,[]);
    groups.get(ptr).push(i);
  }
  return groups;
}

export function planPlusTacticalInfrastructure(source){
  if(!(source instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  if(source.length!==0x400000&&source.length!==0x800000)throw new RangeError('Plus tactical infrastructure requires 4 MiB or 8 MiB ROM');
  if(hasAscii(source,PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC,OLD_MARKER))throw new Error('rejected old tactical pool marker');

  const states=PLUS_TACTICAL_EXPECTED_LOADERS.map(e=>({...e,state:loaderState(source,e)}));
  if(states.some(x=>x.state==='unknown'))throw new Error('tactical loader preflight mismatch');

  const bankWords=new Uint8Array(57*2);
  for(let i=0;i<57;i++)bankWords[i*2]=0x8B;
  const writes=[],cloneMap=[],groups=groupEntriesByPtr(source);

  for(const [ptr,entries] of groups){
    if(entries.length<=1)continue;
    for(let rank=1;rank<entries.length;rank++){
      if(rank-1>=ALTERNATE_BANKS.length)throw new Error(`too many teams share tactical pointer 0x${ptr.toString(16)}`);
      const entry=entries[rank],bank=ALTERNATE_BANKS[rank-1];
      const srcPc=plusLoRomPc(0x8B,ptr),dstPc=plusLoRomPc(bank,ptr);
      if(srcPc===null||dstPc===null||srcPc+31>source.length||dstPc+31>source.length)throw new Error('tactical clone address out of bounds');
      const srcBytes=source.slice(srcPc,srcPc+31);
      let blank=true;for(let j=0;j<31;j++)if(source[dstPc+j]!==0xFF){blank=false;break;}
      const same=bytesEqual(source,dstPc,srcBytes);
      if(!blank&&!same)throw new Error(`tactical clone destination occupied/incompatible at 0x${dstPc.toString(16)}`);
      if(!same)writes.push({off:dstPc,bytes:srcBytes});
      bankWords[entry*2]=bank;
      cloneMap.push({entry,ptr,sourceBank:0x8B,targetBank:bank,sourcePc:srcPc,targetPc:dstPc,already:same});
    }
  }

  safeWrite(writes,source,PLUS_TACTICAL_BANK_SELECTOR_MARKER_PC,ascii(PLUS_TACTICAL_BANK_SELECTOR_MARKER),'tactical marker');
  safeWrite(writes,source,PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC,bankWords,'tactical bank selector');
  safeWrite(writes,source,HELPER_PCS[0],helperBytes(0x04),'tactical helper 0');
  safeWrite(writes,source,HELPER_PCS[1],helperBytes(0xC4),'tactical helper 1');
  safeWrite(writes,source,HELPER_PCS[2],helperBytes(0xC2),'tactical helper 2');

  for(const e of states)if(e.state==='original')writes.push({off:e.pc+6,bytes:jslPatch(e.helperPc)});

  return {
    already:plusTacticalBankSelectorActive(source)&&states.every(x=>x.state==='patched')&&writes.length===0,
    writes,
    cloneMap,
    loaderStates:states.map(({pc,state,pointerDp,bankDp})=>({pc,state,pointerDp,bankDp})),
    bankSelector:Array.from({length:57},(_,i)=>bankWords[i*2]),
    sharedGroups:[...groups.entries()].filter(([,entries])=>entries.length>1).map(([ptr,entries])=>({ptr,entries:[...entries]})),
  };
}

function expandTo4MiB(source){
  if(source.length===0x400000)return source.slice();
  if(source.length!==0x200000)throw new RangeError('Plus tactical preparation requires 2 MiB or 4 MiB ROM');
  const out=new Uint8Array(EXPANDED_SIZE);out.fill(0xFF);out.set(source);
  out.set(ascii(EXPANSION_SIG),EXPANSION_SIG_PC);
  out[0x7FD7]=0x0C;
  return out;
}

export function preparePlusTacticalInfrastructure(source){
  if(!(source instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const out=expandTo4MiB(source);
  const plan=planPlusTacticalInfrastructure(out);
  for(const w of plan.writes)out.set(w.bytes,w.off);
  return out;
}
