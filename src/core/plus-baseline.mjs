export const PLUS_BASELINE=Object.freeze({
  size:0x200000,
  sha256:'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a',
});

function normalizeSha256(value){
  if(typeof value!=='string') throw new TypeError('SHA-256 must be a string');
  const sha=value.trim().toLowerCase();
  if(!/^[0-9a-f]{64}$/.test(sha)) throw new TypeError('SHA-256 must be 64 hexadecimal characters');
  return sha;
}

export function assertPlusBaseDescriptor({size,sha256}={}){
  const normalizedSize=Number(size);
  if(!Number.isInteger(normalizedSize) || normalizedSize!==PLUS_BASELINE.size){
    throw new RangeError(`Plus base size mismatch: expected ${PLUS_BASELINE.size}, got ${size}`);
  }
  const normalizedSha=normalizeSha256(sha256);
  if(normalizedSha!==PLUS_BASELINE.sha256){
    throw new Error(`Plus base SHA-256 mismatch: ${normalizedSha}`);
  }
  return PLUS_BASELINE;
}
