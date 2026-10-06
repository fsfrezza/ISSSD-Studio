import test from 'node:test';
import assert from 'node:assert/strict';
import {REGRESSION_CORRIDOR,criticalCorridorPair} from '../src/core/regression-corridor.mjs';

test('v6.92 and v6.93 byte-exact identities are pinned',()=>{
  assert.equal(REGRESSION_CORRIDOR.v692.sha256,'cafe5879e60485edb1bed2c2df72908179d137b6984f234593cec7f59ae43d6e');
  assert.equal(REGRESSION_CORRIDOR.v693.sha256,'dbe6e6cda778cf917277abc4923a3533f620186d4a7555cd337e059ad5367e76');
});

test('critical corridor pair is ordered good-candidate then first persistence candidate',()=>{
  const [a,b]=criticalCorridorPair();
  assert.equal(a.version,'v6.92');
  assert.equal(b.version,'v6.93');
  assert.match(a.label,/TROCAS ESCALACAO E CAMPO/i);
  assert.match(b.label,/PERSISTENCIA EQUIPES/i);
});

test('corridor descriptors are immutable',()=>{
  assert.equal(Object.isFrozen(REGRESSION_CORRIDOR),true);
  assert.equal(Object.isFrozen(REGRESSION_CORRIDOR.v692),true);
  assert.equal(Object.isFrozen(REGRESSION_CORRIDOR.v693),true);
});
