import test from 'node:test';
import assert from 'node:assert/strict';
import {PLUS_BASELINE,assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';

test('known Plus baseline size and SHA-256 have one canonical definition',()=>{
  assert.equal(PLUS_BASELINE.size,0x200000);
  assert.equal(PLUS_BASELINE.sha256,'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a');
  assert.equal(Object.isFrozen(PLUS_BASELINE),true);
});

test('baseline descriptor accepts the exact known Plus ROM identity',()=>{
  assert.doesNotThrow(()=>assertPlusBaseDescriptor({
    size:0x200000,
    sha256:'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a'
  }));
});

test('same-size ROM with another hash is rejected',()=>{
  assert.throws(()=>assertPlusBaseDescriptor({
    size:0x200000,
    sha256:'0'.repeat(64)
  }),/SHA-256 mismatch/);
});

test('known hash with another size is rejected',()=>{
  assert.throws(()=>assertPlusBaseDescriptor({
    size:0x400000,
    sha256:'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a'
  }),/size mismatch/);
});
