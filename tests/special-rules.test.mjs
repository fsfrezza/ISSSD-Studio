import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';

const base=()=>new Uint8Array(0x200000);
const project=enabled=>({state:{
 targetLength:0x200000,
 semantic:{specialRulesV1:{schema:'isssd-special-rules-v1',goalkeeperBackpassNoHands:enabled}},
 patchesCompact:[],
}});

test('goalkeeper rule enabled fails closed before any gameplay writer executes',()=>{
 let called=false;
 assert.throws(()=>buildPlusProjectRom(base(),project(true),{
  writers:[()=>{called=true;}],
 }),/correção de recuo do goleiro ainda não implementada na ROM/);
 assert.equal(called,false);
});

test('goalkeeper rule disabled is not rejected as unimplemented',()=>{
 // The base here is synthetic, so other baseline verification may reject it.
 // We only assert that the specific unimplemented-rule guard is inactive.
 try{
  buildPlusProjectRom(base(),project(false));
 }catch(error){
  assert.doesNotMatch(String(error?.message),/correção de recuo do goleiro ainda não implementada na ROM/);
 }
});
