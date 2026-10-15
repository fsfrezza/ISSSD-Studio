import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inflateRawSync} from 'node:zlib';
import {buildCumulativeProject} from '../src/core/cumulative-build.mjs';
import {buildPlusProjectRom} from '../src/core/project-build.mjs';
import {ZipFile,crc32} from '../src/platform/zip-file.mjs';
import {makePlusTacticalFixture} from './plus-tactics-fixture.mjs';
import {playerOffset} from '../src/core/plus-player.mjs';
import {PLUS_NAME_POINTER_TABLE,readPlusPlayerName,encodeFixedPlayerName,resolvePlusPlayerNameOffset} from '../src/core/plus-player-name.mjs';
import {resolvePlusTacticalRecord} from '../src/core/plus-tactics-address.mjs';
import {decodePlusTacticalRecord} from '../src/core/plus-tactics-record.mjs';
import {validatePlusRuntimeMirrors} from '../src/core/plus-export-finalizer.mjs';
function fixture(){
 const base=makePlusTacticalFixture();
 for(let t=0;t<56;t++){const ptr=0x8000+t*160;base[PLUS_NAME_POINTER_TABLE+t*2]=ptr&255;base[PLUS_NAME_POINTER_TABLE+t*2+1]=ptr>>8;}
 for(let p=0;p<20;p++){base.set(encodeFixedPlayerName('BASE'+p),resolvePlusPlayerNameOffset(base,30,p));base.set([0x44,0x44,0x44,0x44,0x24,p,0x11],playerOffset(30,p));}
 const players=[{slot:2,baseSlot:2,playerId:'30:2',custom:{name:'Cafu',number:2,position:'DF-MF',skills:{speed:9},tactical:{x:-30,y:30,attack:true}}},{slot:3,baseSlot:3,playerId:'30:3',custom:{name:'Lucio',number:3}}];
 return {base,project:{state:{patchesCompact:[{off:0x100,data:'AB'}],semantic:{teamsV1:{schema:'isssd-teams-v1',version:3,mode:'sparse-overrides',teams:{30:{teamId:30,players}}},romInternalTitle:'ISSSD TEST'}}}};
}

test('cumulative ROMs retain previous edits, delay tactics until their step and finish at canonical output',()=>{
 const {base,project}=fixture(),before=base.slice(),projectBefore=structuredClone(project),snapshots=[];
 const manifest=buildCumulativeProject(base,project,{onRom:(rom,entry)=>snapshots.push({rom,entry})});
 const cafu=snapshots.findIndex(x=>x.entry.change.includes('player-2-Cafu'));
 const lucio=snapshots.findIndex(x=>x.entry.change.includes('player-3-Lucio'));
 const tactic=snapshots.findIndex(x=>x.entry.change==='team-30-tactical-player-2');
 assert.ok(cafu>0&&lucio>cafu&&tactic>lucio);
 assert.equal(readPlusPlayerName(snapshots[cafu-1].rom,30,1).name,'BASE1');
 for(let i=cafu;i<snapshots.length;i++)assert.equal(readPlusPlayerName(snapshots[i].rom,30,1).name,'Cafu');
 assert.equal(readPlusPlayerName(snapshots[cafu].rom,30,2).name,'BASE2');
 assert.equal(readPlusPlayerName(snapshots[lucio].rom,30,2).name,'Lucio');
 const r=decodePlusTacticalRecord(resolvePlusTacticalRecord(snapshots[tactic].rom,30).raw).players[0];
 assert.equal(r.x,-30);assert.equal(r.y,30);assert.equal(r.attack,true);
 const attr=snapshots.at(-1).rom.slice(playerOffset(30,1),playerOffset(30,1)+7);
 assert.equal(attr[0]&15,8);assert.equal(attr[4]>>4,3);assert.equal(attr[5],1);
 for(const {rom} of snapshots){assert.equal(rom.length,0x400000);assert.ok(validatePlusRuntimeMirrors(rom));}
 assert.deepEqual(snapshots.at(-1).rom,buildPlusProjectRom(base,project).rom);
 assert.deepEqual(base,before);assert.deepEqual(project,projectBefore);assert.equal(manifest.finalMatchesCanonicalBuild,true);
});

test('identity move copies original attributes and names before applying destination overrides',()=>{
 const {base,project}=fixture();project.state.semantic.teamsV1.teams[30].players=[{slot:3,baseSlot:2,playerId:'30:2',custom:{name:'Cafu',skills:{speed:10}}},{slot:2,baseSlot:3,playerId:'30:3'}];
 const rom=buildPlusProjectRom(base,project).rom;
 assert.equal(readPlusPlayerName(rom,30,2).name,'Cafu');assert.equal(readPlusPlayerName(rom,30,1).name,'BASE2');
 assert.equal(rom[playerOffset(30,2)]&15,9);assert.equal(rom[playerOffset(30,1)]&15,4);
});

test('ZIP stores valid CRCs and extractable deterministic compressed contents',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-zip-test-'));
 try{
  const write=file=>{const zip=new ZipFile(file);zip.add('0001-test.sfc',Buffer.alloc(0x400000,7));zip.add('indice.json',Buffer.from('{}'));zip.finish();return fs.readFileSync(file);};
  const a=write(path.join(dir,'a.zip')),b=write(path.join(dir,'b.zip'));assert.deepEqual(a,b);
  let at=0,count=0;
  while(a.readUInt32LE(at)===0x04034b50){const crc=a.readUInt32LE(at+14),packed=a.readUInt32LE(at+18),size=a.readUInt32LE(at+22),len=a.readUInt16LE(at+26),extra=a.readUInt16LE(at+28),start=at+30+len+extra;
   const bytes=inflateRawSync(a.subarray(start,start+packed));assert.equal(bytes.length,size);assert.equal(crc32(bytes),crc);at=start+packed;count++;
  }
  assert.equal(count,2);assert.equal(a.readUInt32LE(at),0x02014b50);assert.equal(a.readUInt32LE(a.length-22),0x06054b50);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('canonical project contains recovered Brazil names and latest coordinates',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url)));
 const ps=p.state.semantic.teamsV1.teams[30].players;
 assert.equal(ps[1].custom.name,'Cafu');assert.equal(ps[1].custom.tactical.x,-30);assert.equal(ps[1].custom.tactical.y,30);
 assert.equal(ps[9].custom.name,'Ronaldo');assert.equal(ps[9].custom.tactical.x,41);assert.equal(ps[10].custom.tactical.y,33);
});

test('HTTP export returns an extractable ZIP, correct manifest and canonical final ROM',async()=>{
 const {spawn}=await import('node:child_process');
 const {once}=await import('node:events');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-http-test-'));
 const {base,project}=fixture(),file=path.join(dir,'base.sfc');fs.writeFileSync(file,base);
 const child=spawn(process.execPath,['scripts/serve-editor.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,ISSSD_PLUS_ROM_PATH:file,ISSSD_PORT:'0',ISSSD_NO_OPEN:'1'},stdio:['ignore','pipe','pipe']});
 try{
  const url=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('server startup timeout')),10000);child.stdout.on('data',b=>{log+=b;const m=log.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);resolve(m[0])}});child.once('exit',code=>{clearTimeout(timer);reject(new Error('server exited '+code))});});
  const res=await fetch(url+'__isssd/build-plus-project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,cumulative:true})});
  assert.equal(res.status,200,await (res.ok?Promise.resolve(''):res.text()));assert.equal(res.headers.get('Content-Type'),'application/zip');
  assert.equal(res.headers.get('X-ISSSD-Archive'),'cumulative-v1');
  const data=Buffer.from(await res.arrayBuffer()),files=new Map();let at=0;
  while(data.readUInt32LE(at)===0x04034b50){const packed=data.readUInt32LE(at+18),len=data.readUInt16LE(at+26),extra=data.readUInt16LE(at+28),start=at+30+len+extra,name=data.toString('utf8',at+30,at+30+len),bytes=inflateRawSync(data.subarray(start,start+packed));
   assert.equal(crc32(bytes),data.readUInt32LE(at+14));files.set(name,bytes);at=start+packed;
  }
  const manifest=JSON.parse(files.get('indice.json'));assert.equal(manifest.entries.length,Number(res.headers.get('X-ISSSD-ROM-Count')));
  for(const e of manifest.entries)assert.equal(files.get(e.name).length,0x400000);
  assert.deepEqual(files.get(manifest.finalRom),Buffer.from(buildPlusProjectRom(base,project).rom));
  assert.deepEqual(fs.readFileSync(file),Buffer.from(base));
  const invalid=structuredClone(project);invalid.state.semantic.teamsV1.teams[30].players[0].custom.number=999;
  const failed=await fetch(url+'__isssd/build-plus-project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:invalid,cumulative:true})});
  assert.equal(failed.status,422);assert.match((await failed.json()).error,/Etapa cumulativa/);
 }finally{child.kill();await once(child,'exit').catch(()=>{});fs.rmSync(dir,{recursive:true,force:true});}
});

test('Plus Save ROM capture directly exports current semantic project without invoking legacy save',async()=>{
 const vm=await import('node:vm');
 const patch=fs.readFileSync(new URL('../scripts/patch-canonical-rom-export.mjs',import.meta.url),'utf8');
 const body=patch.match(/const capture=String.raw`<script[^>]*>([\s\S]*?)<\/script>`/)[1];
 let handler,downloaded=0,stopped=0;
 const button={disabled:false,textContent:'Salvar ROM'};
 const ctx={document:{addEventListener:(name,fn,capture)=>{assert.equal(name,'click');assert.equal(capture,true);handler=fn}},window:{activeRomProfile:{id:'iss-deluxe-plus'}},Uint8Array,console,alert:msg=>assert.fail(msg),studioDownloadFile:async(bytes,name)=>{assert.equal(bytes.length,0);assert.match(name,/\.sfc$/);downloaded++}};
 vm.runInNewContext(body,ctx);
 await handler({target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){stopped++}});
 assert.equal(downloaded,1);assert.equal(stopped,1);assert.equal(button.disabled,false);assert.equal(button.textContent,'Salvar ROM');
});
