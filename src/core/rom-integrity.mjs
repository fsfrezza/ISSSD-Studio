export function snesChecksum(bytes, checksumOffset=0x7FDE) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Uint8Array required');
  if (bytes.length < checksumOffset + 2) throw new RangeError('ROM too small');
  // SNES checksum convention used by this project: sum all ROM bytes while
  // treating the stored checksum/complement quartet as zero, then write the
  // 16-bit checksum and one's complement.
  let sum=0;
  const complementOffset=checksumOffset-2;
  for(let i=0;i<bytes.length;i++){
    if(i>=complementOffset && i<checksumOffset+2) continue;
    sum=(sum+bytes[i])&0xFFFF;
  }
  return {checksum:sum,complement:(sum^0xFFFF)&0xFFFF};
}

export function writeSnesChecksum(bytes, checksumOffset=0x7FDE) {
  const {checksum,complement}=snesChecksum(bytes,checksumOffset);
  const co=checksumOffset-2;
  bytes[co]=complement&0xFF; bytes[co+1]=(complement>>>8)&0xFF;
  bytes[checksumOffset]=checksum&0xFF; bytes[checksumOffset+1]=(checksum>>>8)&0xFF;
  return {checksum,complement};
}

export function readSnesChecksum(bytes, checksumOffset=0x7FDE) {
  const co=checksumOffset-2;
  const complement=bytes[co]|(bytes[co+1]<<8);
  const checksum=bytes[checksumOffset]|(bytes[checksumOffset+1]<<8);
  return {checksum,complement,complementsMatch:((checksum^complement)&0xFFFF)===0xFFFF};
}

export function diffRanges(base,out) {
  const n=Math.max(base.length,out.length), ranges=[]; let start=-1, changed=0;
  for(let i=0;i<n;i++){
    const different=(i>=base.length||i>=out.length||base[i]!==out[i]);
    if(different){changed++;if(start<0)start=i;}
    else if(start>=0){ranges.push({start,end:i-1,length:i-start});start=-1;}
  }
  if(start>=0)ranges.push({start,end:n-1,length:n-start});
  return {changedBytes:changed,ranges};
}

export function assertExpectedSize(size,{baseSize=0x200000,allowExpanded=true}={}) {
  const allowed=allowExpanded?[baseSize,0x400000,0x800000]:[baseSize];
  if(!allowed.includes(size)) throw new RangeError('unexpected ROM size: '+size);
  return size;
}
