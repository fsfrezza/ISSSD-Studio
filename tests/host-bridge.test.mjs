import test from 'node:test';
import assert from 'node:assert/strict';
import {HOST_BRIDGE_METHODS,assertHostBridge} from '../src/platform/host-bridge.mjs';

test('host bridge exposes the four workflow boundaries required by Studio',()=>{
  assert.deepEqual(HOST_BRIDGE_METHODS,[
    'openRom',
    'openProject',
    'saveProject',
    'exportRom',
  ]);
});

test('host bridge validator accepts async-capable function implementations',()=>{
  const bridge={
    openRom:async()=>({name:'base.sfc',bytes:new Uint8Array()}),
    openProject:async()=>({name:'project.issdproj',text:'{}'}),
    saveProject:async()=>({ok:true}),
    exportRom:async()=>({ok:true}),
  };
  assert.equal(assertHostBridge(bridge),bridge);
});

test('host bridge validator rejects missing workflow operations',()=>{
  assert.throws(()=>assertHostBridge({}),/openRom/);
});

test('host bridge contract contains no runtime-specific dependency',async()=>{
  const source=await import('../src/platform/host-bridge.mjs');
  assert.equal(typeof source.assertHostBridge,'function');
});
