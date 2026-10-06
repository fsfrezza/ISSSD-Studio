import {assertPlusBaseDescriptor,PLUS_BASELINE} from '../core/plus-baseline.mjs';

export function createPlusBaseVerifier({sha256}={}){
  if(typeof sha256!=='function')throw new TypeError('sha256 function required');
  return async function verifyPlusBase(bytes){
    if(!(bytes instanceof Uint8Array))throw new TypeError('base ROM must be Uint8Array');
    if(bytes.length!==PLUS_BASELINE.size){
      throw new RangeError(`Plus base size mismatch: expected ${PLUS_BASELINE.size}, got ${bytes.length}`);
    }
    const digest=await sha256(new Uint8Array(bytes));
    return assertPlusBaseDescriptor({size:bytes.length,sha256:digest});
  };
}
