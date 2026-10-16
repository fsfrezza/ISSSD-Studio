import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const patch=fs.readFileSync(new URL('../scripts/patch-canonical-rom-export.mjs',import.meta.url),'utf8');
function downloadHarness(count,{validPipeline=true}={}){
 const events=[],headers=new Map([['X-ISSSD-Builder',validPipeline?'plus-build-pipeline-v1':'wrong'],['X-ISSSD-Mirrors','ok'],['X-ISSSD-Archive','cumulative-v1'],['X-ISSSD-Pending-Text-Count',String(count)]]);
 const window={__ISSSD_PICK_CUMULATIVE_AREAS__:async()=>['pre-partida']};
 const context=vm.createContext({window,activeRomProfile:{id:'iss-deluxe-plus'},studioProjectObject:async()=>({state:{}}),Uint8Array,Blob,
  fetch:async()=>({ok:true,headers:{get:k=>headers.get(k)||null},arrayBuffer:async()=>Uint8Array.from([0x50,0x4B,3,4]).buffer}),
  document:{createElement:()=>({click(){events.push('download')},remove(){},set href(v){},set download(v){assert.equal(v,'ISSSD-Plus-ROMs-cumulativas.zip')}}),body:{appendChild(){}}},
  URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},alert:msg=>events.push(msg),
 });
 const start=patch.indexOf('const newBlock=')+'const newBlock='.length,end=patch.indexOf('\nhtml=html.slice',start);
 vm.runInContext(vm.runInContext(patch.slice(start,end),context),context);
 return {context,events};
}
test('ZIP with unsupported texts downloads before an explicit pending-text notice',async()=>{
 const {context,events}=downloadHarness(6);
 await context.studioDownloadFile(new Uint8Array(),'ISSSD-Plus.sfc');
 assert.equal(events[0],'download');assert.equal(events.length,2);
 assert.match(events[1],/6 novos textos pendentes/);assert.match(events[1],/NÃO foram aplicados/);assert.match(events[1],/TEXTOS-PENDENTES.txt/);
 assert.equal(context.window.__ISSSD_LAST_CUMULATIVE_EXPORT__.allSelectedChangesApplied,false);
});
test('complete exports download without a pending-text alert',async()=>{
 const {context,events}=downloadHarness(0);await context.studioDownloadFile(new Uint8Array(),'ISSSD-Plus.sfc');
 assert.deepEqual(events,['download']);assert.equal(context.window.__ISSSD_LAST_CUMULATIVE_EXPORT__.allSelectedChangesApplied,true);
});
test('invalid canonical-pipeline responses still fail before download',async()=>{
 const {context,events}=downloadHarness(6,{validPipeline:false});
 await assert.rejects(()=>context.studioDownloadFile(new Uint8Array(),'ISSSD-Plus.sfc'),/Servidor não confirmou/);
 assert.deepEqual(events,[]);
});
