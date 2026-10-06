import test from 'node:test';
import assert from 'node:assert/strict';
import {StudioSession} from '../src/app/studio-session.mjs';

function fixture(){
  const base=new Uint8Array(0x200000);
  const project={state:{targetLength:0x200000,patchesCompact:[],semantic:{}}};
  const calls=[];
  const host={
    async openRom(){calls.push('openRom');return {name:'base.sfc',bytes:base};},
    async openProject(){calls.push('openProject');return {name:'test.issdproj',project};},
    async saveProject(value,options){calls.push(['saveProject',value,options]);return {name:options?.suggestedName||'test.issdproj'};},
    async exportRom(value,options){calls.push(['exportRom',new Uint8Array(value),options]);return {name:options?.suggestedName||'output.sfc'};},
  };
  return {base,project,calls,host};
}

test('session can open project without a ROM and never mutates project data',async()=>{
  const {host,project}=fixture();
  const session=new StudioSession({host,verifyBase:async()=>true});
  const snapshot=structuredClone(project);
  const opened=await session.openProject();
  assert.equal(opened.name,'test.issdproj');
  assert.equal(opened.canonical.targetLength,0x200000);
  assert.deepEqual(project,snapshot);
  assert.equal(session.hasBase,false);
  assert.equal(session.hasProject,true);
});

test('session verifies and clones immutable base ROM on open',async()=>{
  const {host,base}=fixture();
  let verified=null;
  const session=new StudioSession({host,verifyBase:async bytes=>{verified=bytes;return true;}});
  const before=base.slice();
  await session.openRom();
  assert.ok(verified instanceof Uint8Array);
  assert.notEqual(verified,base);
  base[0]=0x99;
  assert.equal(session.baseRom[0],before[0]);
});

test('session refuses build until both base and project are loaded',()=>{
  const {host}=fixture();
  const session=new StudioSession({host,verifyBase:async()=>true});
  assert.throws(()=>session.build({writeChecksum:false}),/base ROM.*project/i);
});

test('no-op session build is deterministic and leaves immutable base untouched',async()=>{
  const {host,base}=fixture();
  const before=base.slice();
  const session=new StudioSession({host,verifyBase:async()=>true});
  await session.openRom();
  await session.openProject();
  const a=session.build({writeChecksum:false});
  const b=session.build({writeChecksum:false});
  assert.deepEqual(a.rom,b.rom);
  assert.deepEqual(a.rom,before);
  assert.deepEqual(base,before);
});

test('exportBuilt exports exactly the latest built ROM',async()=>{
  const {host,calls}=fixture();
  const session=new StudioSession({host,verifyBase:async()=>true});
  await session.openRom();
  await session.openProject();
  const built=session.build({writeChecksum:false});
  await session.exportBuilt({suggestedName:'test-output'});
  const exportCall=calls.find(x=>Array.isArray(x)&&x[0]==='exportRom');
  assert.ok(exportCall);
  assert.deepEqual(exportCall[1],built.rom);
  assert.equal(exportCall[2].suggestedName,'test-output');
});

test('saveProject delegates a detached project snapshot to host',async()=>{
  const {host,project,calls}=fixture();
  const session=new StudioSession({host,verifyBase:async()=>true});
  await session.openProject();
  await session.saveProject({suggestedName:'saved'});
  const saveCall=calls.find(x=>Array.isArray(x)&&x[0]==='saveProject');
  assert.ok(saveCall);
  assert.notEqual(saveCall[1],project);
  assert.deepEqual(saveCall[1],project);
});
