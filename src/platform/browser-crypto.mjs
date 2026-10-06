export async function browserSha256(bytes,{cryptoImpl=globalThis.crypto}={}){
  if(!(bytes instanceof Uint8Array))throw new TypeError('bytes must be Uint8Array');
  if(!cryptoImpl?.subtle||typeof cryptoImpl.subtle.digest!=='function'){
    throw new Error('WebCrypto SHA-256 is unavailable');
  }
  const copy=new Uint8Array(bytes);
  const digest=await cryptoImpl.subtle.digest('SHA-256',copy.buffer);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
