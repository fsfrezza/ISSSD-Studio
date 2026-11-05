import test from 'node:test';import assert from 'node:assert/strict';import {assertEditorReleasedRules}from'../src/core/editor-release-policy.mjs';
test('Editor blocks experimental backpass export without changing imported choices or preventing penalty/off exports',()=>{
 const p={state:{semantic:{specialRulesV1:{goalkeeperBackpassNoHands:true,goalkeeperBackpassPunishment:'free-kick'}}}},saved=JSON.stringify(p);
 assert.throws(()=>assertEditorReleasedRules(p),/temporariamente bloqueado/);assert.equal(JSON.stringify(p),saved);assert.doesNotThrow(()=>assertEditorReleasedRules(p,{selectedAreas:['jogadores']}));
 p.state.semantic.specialRulesV1.goalkeeperBackpassNoHands=false;assert.doesNotThrow(()=>assertEditorReleasedRules(p));p.state.semantic.specialRulesV1.goalkeeperBackpassNoHands=true;p.state.semantic.specialRulesV1.goalkeeperBackpassPunishment='penalty';assert.doesNotThrow(()=>assertEditorReleasedRules(p));
});
