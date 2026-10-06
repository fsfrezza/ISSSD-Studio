import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlusBaseVerifier} from '../src/app/plus-base-verifier.mjs';
import {PLUS_BASELINE} from '../src/core/plus-baseline.mjs';

test('Plus base verifier accepts exact canonical descriptor',async()=>{
  const bytes=new Uint8Array(PLUS_BASELINE.size);
  let seen=null;
  const verify=createPlusBaseVerifier({sha256:async value=>{
    seen=value;
    return PLUS_BASELINE.sha256;
  }});
  const result=await verify(bytes);
  assert.notEqual(seen,bytes);
  assert.deepEqual(seen,bytes);
  assert.equal(result,PLUS_BASELINE);
});

test('Plus base verifier rejects wrong size before hashing',async()=>{
  let hashed=false;
  const verify=createPlusBaseVerifier({sha256:async()=>{hashed=true;return PLUS_BASELINE.sha256;}});
  await assert.rejects(()=>verify(new Uint8Array(1)),/size mismatch/i);
  assert.equal(hashed,false);
});

test('Plus base verifier rejects wrong hash',async()=>{
  const verify=createPlusBaseVerifier({sha256:async()=> '00'.repeat(32)});
  await assert.rejects(()=>verify(new Uint8Array(PLUS_BASELINE.size)),/SHA-256 mismatch/i);
});

test('Plus base verifier requires Uint8Array and hash function',async()=>{
  assert.throws(()=>createPlusBaseVerifier(),/sha256 function required/i);
  const verify=createPlusBaseVerifier({sha256:async()=>PLUS_BASELINE.sha256});
  await assert.rejects(()=>verify([]),/Uint8Array/i);
});
