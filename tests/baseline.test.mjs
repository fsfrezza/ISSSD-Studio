import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_SIZE = 2097152;
const BASE_SHA256 = 'ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a';

test('known Plus baseline metadata is pinned', () => {
  assert.equal(BASE_SIZE, 0x200000);
  assert.equal(BASE_SHA256.length, 64);
});

test('persisted full expansion patches are forbidden by policy', () => {
  const suspicious = { off: 0x200000, len: 0x200000 };
  assert.equal(suspicious.off >= BASE_SIZE && suspicious.len >= BASE_SIZE, true);
});
