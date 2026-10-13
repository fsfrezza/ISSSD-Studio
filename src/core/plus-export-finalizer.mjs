import {knownMirrorSlices,playerOffset} from './plus-player.mjs';

function headerSize(bytes){
  if(!(bytes instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  return (bytes.length%0x8000===0x200)?0x200:0;
}

function supportedBodySize(bytes){
  const body=bytes.length-headerSize(bytes);
  return body===0x200000||body===0x400000;
}

export function validatePlusRuntimeMirrors(bytes){
  if(!(bytes instanceof Uint8Array)||!supportedBodySize(bytes))return false;
  const hs=headerSize(bytes);
  for(let player=1;player<=7;player++){
    const main=hs+playerOffset(30,player);
    for(const slice of knownMirrorSlices(30,player)){
      for(let i=0;i<slice.length;i++){
        if(bytes[main+slice.mainStart+i]!==bytes[hs+slice.mirror+i])return false;
      }
    }
  }
  return true;
}

export function syncPlusRuntimeMirrors(bytes){
  if(!(bytes instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  if(!supportedBodySize(bytes))throw new RangeError(`unexpected Plus ROM size: ${bytes.length}`);
  const hs=headerSize(bytes);
  for(let player=1;player<=7;player++){
    const main=hs+playerOffset(30,player);
    for(const slice of knownMirrorSlices(30,player)){
      const src=main+slice.mainStart;
      bytes.set(bytes.slice(src,src+slice.length),hs+slice.mirror);
    }
  }
  return bytes;
}

// This matches the checksum procedure used by the manually repaired ROM that
// was confirmed to boot: zero the quartet, sum the ROM, then account for the
// checksum+complement bytes themselves (0x01FE total byte sum).
export function writeFinalSnesChecksum(bytes){
  if(!(bytes instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const hs=headerSize(bytes),off=hs+0x7FDC;
  if(off+4>bytes.length)throw new RangeError('SNES header outside ROM');
  bytes.fill(0,off,off+4);
  let sum=0;
  for(let i=0;i<bytes.length;i++)sum=(sum+bytes[i])&0xFFFF;
  const checksum=(sum+0x01FE)&0xFFFF;
  const complement=checksum^0xFFFF;
  bytes[off]=complement&0xFF;
  bytes[off+1]=(complement>>>8)&0xFF;
  bytes[off+2]=checksum&0xFF;
  bytes[off+3]=(checksum>>>8)&0xFF;
  return {checksum,complement};
}

export function finalizePlusRomForExport(input){
  if(!(input instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const out=input.slice();
  syncPlusRuntimeMirrors(out);
  if(!validatePlusRuntimeMirrors(out))throw new Error('Plus runtime mirror validation failed before checksum');
  const checksum=writeFinalSnesChecksum(out);
  if(!validatePlusRuntimeMirrors(out))throw new Error('Plus runtime mirror validation failed after checksum');
  return {rom:out,checksum};
}
