import test from 'node:test';
import assert from 'node:assert/strict';
import {assertHostBridge} from '../src/platform/host-bridge.mjs';
import {createBrowserHost} from '../src/platform/browser-host.mjs';

function mockBrowser(){
  const opens=[];
  const saves=[];
  return {
    opens,saves,
    io:{
      async openFile(options){
        opens.push(options);
        if(options.kind==='rom')return {name:'base.sfc',bytes:new Uint8Array([1,2,3])};
        return {name:'test.issdproj',text:'{"schema":"isssdproj","state":{"x":1}}'};
      },
      async saveFile(options){saves.push(options);return {name:options.suggestedName};},
    }
  };
}

test('browser host satisfies runtime-neutral host bridge contract',()=>{
  const {io}=mockBrowser();
  assert.equal(assertHostBridge(createBrowserHost({io})).openRom instanceof Function,true);
});

test('openRom returns detached Uint8Array and requests SNES ROM extensions',async()=>{
  const {io,opens}=mockBrowser();
  const host=createBrowserHost({io});
  const result=await host.openRom();
  assert.equal(result.name,'base.sfc');
  assert.deepEqual(Array.from(result.bytes),[1,2,3]);
  assert.ok(result.bytes instanceof Uint8Array);
  assert.equal(opens[0].kind,'rom');
  assert.deepEqual(opens[0].extensions,['.sfc','.smc']);
});

test('openProject parses JSON project text without mutating source object',async()=>{
  const {io,opens}=mockBrowser();
  const host=createBrowserHost({io});
  const result=await host.openProject();
  assert.equal(result.name,'test.issdproj');
  assert.deepEqual(result.project,{schema:'isssdproj',state:{x:1}});
  assert.equal(opens[0].kind,'project');
  assert.deepEqual(opens[0].extensions,['.issdproj']);
});

test('saveProject serializes deterministic pretty JSON with issdproj name',async()=>{
  const {io,saves}=mockBrowser();
  const host=createBrowserHost({io});
  const project={b:2,a:{x:1}};
  const snapshot=structuredClone(project);
  await host.saveProject(project,{suggestedName:'Brasil'});
  assert.deepEqual(project,snapshot);
  assert.equal(saves.length,1);
  assert.equal(saves[0].kind,'project');
  assert.equal(saves[0].suggestedName,'Brasil.issdproj');
  assert.equal(saves[0].mimeType,'application/json');
  assert.equal(saves[0].text,JSON.stringify(project,null,2)+'\n');
});

test('exportRom saves exact ROM bytes with sfc extension',async()=>{
  const {io,saves}=mockBrowser();
  const host=createBrowserHost({io});
  const rom=new Uint8Array([0xAA,0x55]);
  const before=rom.slice();
  await host.exportRom(rom,{suggestedName:'output'});
  assert.deepEqual(rom,before);
  assert.equal(saves[0].kind,'rom');
  assert.equal(saves[0].suggestedName,'output.sfc');
  assert.deepEqual(Array.from(saves[0].bytes),[0xAA,0x55]);
});

test('openProject rejects malformed JSON',async()=>{
  const host=createBrowserHost({io:{
    async openFile(){return {name:'bad.issdproj',text:'{bad'};},
    async saveFile(){throw new Error('not used');}
  }});
  await assert.rejects(()=>host.openProject(),/invalid project json/i);
});
