import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserStudioSession} from '../src/app/browser-studio.mjs';
import {PLUS_BASELINE} from '../src/core/plus-baseline.mjs';

test('browser Studio session composes IO, canonical Plus verification and session flow',async()=>{
  const base=new Uint8Array(PLUS_BASELINE.size);
  const io={
    async openFile(options){
      if(options.kind==='rom')return {name:'base.sfc',bytes:base};
      return {name:'empty.issdproj',text:JSON.stringify({state:{targetLength:PLUS_BASELINE.size,patchesCompact:[],semantic:{}}})};
    },
    async saveFile(options){return {name:options.suggestedName};},
  };
  let hashes=0;
  const session=createBrowserStudioSession({io,sha256:async bytes=>{
    hashes++;
    assert.equal(bytes.length,PLUS_BASELINE.size);
    return PLUS_BASELINE.sha256;
  }});
  await session.openRom();
  await session.openProject();
  const result=session.build({writeChecksum:false});
  assert.equal(hashes,1);
  assert.deepEqual(result.rom,base);
});

test('browser Studio session refuses non-canonical Plus ROM before accepting it',async()=>{
  const io={
    async openFile(){return {name:'wrong.sfc',bytes:new Uint8Array(PLUS_BASELINE.size)};},
    async saveFile(){throw new Error('not used');},
  };
  const session=createBrowserStudioSession({io,sha256:async()=> 'ff'.repeat(32)});
  await assert.rejects(()=>session.openRom(),/SHA-256 mismatch/i);
  assert.equal(session.hasBase,false);
});
