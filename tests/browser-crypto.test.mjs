import test from 'node:test';
import assert from 'node:assert/strict';
import {browserSha256} from '../src/platform/browser-crypto.mjs';

test('browserSha256 returns lowercase hexadecimal digest and clones input',async()=>{
  const input=new Uint8Array([1,2,3]);
  let seen=null;
  const cryptoImpl={subtle:{digest:async(algorithm,buffer)=>{
    assert.equal(algorithm,'SHA-256');
    seen=new Uint8Array(buffer);
    return Uint8Array.from({length:32},(_,i)=>i).buffer;
  }}};
  const digest=await browserSha256(input,{cryptoImpl});
  assert.deepEqual(Array.from(seen),[1,2,3]);
  assert.equal(digest,'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
});

test('browserSha256 validates bytes and WebCrypto availability',async()=>{
  await assert.rejects(()=>browserSha256([],{cryptoImpl:{subtle:{digest:async()=>new ArrayBuffer(32)}}}),/Uint8Array/i);
  await assert.rejects(()=>browserSha256(new Uint8Array(),{cryptoImpl:null}),/WebCrypto/i);
});
