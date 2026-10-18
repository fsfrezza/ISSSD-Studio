import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {pendingAdditionalTextExports} from '../src/core/additional-screen-text-fields.mjs';
import {plusLinkedScreenTextWriter} from '../src/core/plus-linked-screen-text.mjs';
import {plusGraphicalLabelsWriter,transformLabelPlanes} from '../src/core/plus-graphical-labels.mjs';
import {GRAPHICAL_LABEL_ASSETS} from '../src/core/graphical-label-layout.mjs';
import {seedGraphicalLabelFixture} from './graphical-label-fixture.mjs';
import {konamiLzDecompress} from '../src/core/konami-lz.mjs';
import {NATIVE_MENU_FONTS} from '../src/core/native-menu-text-fields.mjs';
test('the exact eight reported pending fields are supported and actually write native bytes',()=>{
 const state={additionalScreenTextsV1:{schema:'isssd-additional-screen-texts-v1',values:{'strategy-labels':{one:'1',four:'4'},'uniform-labels':{shirt:'CAMISA',pants:'CALÇÃO',socks:'MEIAS',color:'COR',type:'TIPO',edit:'EDITAR'}}}};
 const base=seedGraphicalLabelFixture(new Uint8Array(0x200000).fill(0xA5)),rom=base.slice(),before=base.slice();
 assert.deepEqual(pendingAdditionalTextExports(state),[]);
 plusLinkedScreenTextWriter(rom,state,base);plusGraphicalLabelsWriter(rom,state,base);
 assert.equal(rom[0x3CA1D],NATIVE_MENU_FONTS.TallMenuText['1']);assert.equal(rom[0x3CA21],NATIVE_MENU_FONTS.TallMenuText['4']);
 const a=GRAPHICAL_LABEL_ASSETS.find(a=>a.id==='uniformLabels'),decoded=konamiLzDecompress(rom,a.slot).data,raw=a.planar?transformLabelPlanes(decoded):decoded;
 for(const [tile,count]of [[0,4],[4,4],[8,4],[12,3],[24,4],[28,3]])assert.ok(raw.slice(tile*16,(tile+count)*16).some(Boolean));
 assert.deepEqual(base,before);
});
test('a fresh editor server avoids an occupied port and identifies its active build',async()=>{
 const busy=http.createServer();await new Promise(r=>busy.listen(0,'127.0.0.1',r));
 const port=busy.address().port;
 const child=spawn(process.execPath,['scripts/serve-editor.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,ISSSD_PORT:String(port),ISSSD_NO_OPEN:'1'},stdio:['ignore','pipe','pipe']});
 try{
  const url=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('server startup timeout')),10000);child.stdout.on('data',b=>{log+=b;const m=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);resolve(m[0]);}});child.once('exit',code=>{clearTimeout(timer);reject(Error('server exited '+code));});});
  assert.notEqual(new URL(url).port,String(port));
  const response=await fetch(url+'__isssd/build-info'),info=await response.json();assert.equal(response.status,200);assert.equal(info.root,path.resolve(fileURLToPath(new URL('..',import.meta.url))));assert.ok(info.supportedTextWriters.includes('uniform-labels'));assert.ok(info.supportedTextWriters.includes('strategy-one-four'));assert.ok(info.commit);
  const html=await (await fetch(url)).text();assert.ok(html.includes('id="isssd-active-server"'));assert.ok(html.includes('Servidor '+info.commit));assert.ok(html.includes('textos 1/4 + uniformes ativos'));
 }finally{child.kill();await new Promise(r=>busy.close(r));}
});
