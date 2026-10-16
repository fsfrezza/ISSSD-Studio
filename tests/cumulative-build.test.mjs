import {ADDITIONAL_TEXT_SECTIONS} from '../src/core/additional-screen-text-fields.mjs';
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
 return {base,project:{state:{patchesCompact:[{off:0x7FC0,data:'AB'}],semantic:{teamsV1:{schema:'isssd-teams-v1',version:3,mode:'sparse-overrides',teams:{30:{teamId:30,players}}},romInternalTitle:'ISSSD TEST'}}}};
}

test('cumulative ROMs retain previous edits, delay tactics until their step and finish at canonical output',()=>{
 const {base,project}=fixture(),before=base.slice(),projectBefore=structuredClone(project),snapshots=[];
 const manifest=buildCumulativeProject(base,project,{onRom:(rom,entry)=>snapshots.push({rom,entry})});
 const cafu=snapshots.findIndex(x=>x.entry.stage==='jogadores');
 const tactic=snapshots.findIndex(x=>x.entry.stage==='formacoes');
 assert.ok(cafu>=3&&tactic>cafu);
 assert.deepEqual(snapshots.slice(0,4).map(x=>x.entry.stage),['infraestrutura','metadados','tela-inicial','menu-principal']);
 assert.equal(readPlusPlayerName(snapshots[cafu-1].rom,30,1).name,'BASE1');
 for(let i=cafu;i<snapshots.length;i++){
  assert.equal(readPlusPlayerName(snapshots[i].rom,30,1).name,'Cafu');
  assert.equal(readPlusPlayerName(snapshots[i].rom,30,2).name,'Lucio');
 }
 const r=decodePlusTacticalRecord(resolvePlusTacticalRecord(snapshots[tactic].rom,30).raw).players[0];
 assert.equal(r.x,-30);assert.equal(r.y,30);assert.equal(r.attack,true);
 const earlyA=resolvePlusTacticalRecord(snapshots[0].rom,30),earlyB=resolvePlusTacticalRecord(snapshots[0].rom,31);
 assert.notEqual(earlyA.recordPc,earlyB.recordPc);
 assert.ok(snapshots.length<=10);
 const attr=snapshots.at(-1).rom.slice(playerOffset(30,1),playerOffset(30,1)+7);
 assert.equal(attr[0]&15,8);assert.equal(attr[4]>>4,3);assert.equal(attr[5],1);
 for(const {rom} of snapshots){assert.equal(rom.length,0x400000);assert.ok(validatePlusRuntimeMirrors(rom));}
 assert.deepEqual(snapshots.at(-1).rom,buildPlusProjectRom(base,project,{forceTacticalInfrastructure:true}).rom);
 assert.deepEqual(base,before);assert.deepEqual(project,projectBefore);assert.equal(manifest.finalMatchesSelectedAreas,true);
});

test('identity move copies original attributes and names before applying destination overrides',()=>{
 const {base,project}=fixture();project.state.semantic.teamsV1.teams[30].players=[{slot:3,baseSlot:2,playerId:'30:2',custom:{name:'Cafu',skills:{speed:10}}},{slot:2,baseSlot:3,playerId:'30:3'}];
 const rom=buildPlusProjectRom(base,project,{forceTacticalInfrastructure:true}).rom;
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

test('canonical project preserves names and sparse coordinates from the user-tested upload',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url)));
 const ps=p.state.semantic.teamsV1.teams[30].players;
 // The current user-tested project preserves X from the immutable baseline.
 // Explicit -30/30 regression coverage remains in the synthetic fixture above.
 assert.equal(ps[1].custom.name,'Cafu');assert.equal(Object.hasOwn(ps[1].custom.tactical,'x'),false);assert.equal(ps[1].custom.tactical.y,32);
 assert.equal(ps[9].custom.name,'Ronaldo');assert.equal(ps[9].custom.tactical.x,36);assert.equal(ps[10].custom.tactical.y,30);
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
  assert.deepEqual(files.get(manifest.finalRom),Buffer.from(buildPlusProjectRom(base,project,{forceTacticalInfrastructure:true}).rom));
  assert.deepEqual(fs.readFileSync(file),Buffer.from(base));
  // Reproduce the user's exact failure: all six new control inscriptions
  // are confirmed while the previously supported player edits stay selected.
  const pendingProject=structuredClone(project),controlSection=ADDITIONAL_TEXT_SECTIONS.find(s=>s.id==='control-labels');
  pendingProject.state.semantic.additionalScreenTextsV1={schema:'isssd-additional-screen-texts-v1',values:{'control-labels':Object.fromEntries(controlSection.fields.map(([id,,pt])=>[id,pt]))}};
  const pendingBefore=structuredClone(pendingProject);
  const partial=await fetch(url+'__isssd/build-plus-project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:pendingProject,cumulative:true})});
  assert.equal(partial.status,200,await(partial.ok?Promise.resolve(''):partial.text()));
  assert.equal(partial.headers.get('X-ISSSD-Pending-Text-Count'),'6');assert.equal(partial.headers.get('X-ISSSD-Export-Status'),'partial');
  const archive=Buffer.from(await partial.arrayBuffer()),partialFiles=new Map();let cursor=0;
  while(archive.readUInt32LE(cursor)===0x04034b50){const packed=archive.readUInt32LE(cursor+18),len=archive.readUInt16LE(cursor+26),extra=archive.readUInt16LE(cursor+28),start=cursor+30+len+extra,name=archive.toString('utf8',cursor+30,cursor+30+len),bytes=inflateRawSync(archive.subarray(start,start+packed));assert.equal(crc32(bytes),archive.readUInt32LE(cursor+14));partialFiles.set(name,bytes);cursor=start+packed;}
  const partialManifest=JSON.parse(partialFiles.get('indice.json'));
  assert.equal(partialManifest.entries.length,9);assert.equal(partialManifest.allSelectedChangesApplied,false);
  assert.equal(partialManifest.pendingTextChanges.length,6);
  assert.equal(partialManifest.entries.find(e=>e.stage==='pre-partida').pendingTextChanges.length,6);
  assert.match(partialFiles.get('TEXTOS-PENDENTES.txt').toString('utf8'),/TIPO-A/);
  assert.match(partialFiles.get('LEIA-ME.txt').toString('utf8'),/6 novos textos NÃO foram aplicados/);
  for(const entry of partialManifest.entries){assert.equal(partialFiles.get(entry.name).length,0x400000);assert.deepEqual(partialFiles.get(entry.name),files.get(entry.name),'supported changes remain identical in '+entry.name);}
  assert.deepEqual(pendingProject,pendingBefore);assert.deepEqual(fs.readFileSync(file),Buffer.from(base));
  const filtered=await fetch(url+'__isssd/build-plus-project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:pendingProject,cumulative:true,selectedAreas:['jogadores']})});
  assert.equal(filtered.status,200);assert.equal(filtered.headers.get('X-ISSSD-Pending-Text-Count'),'0');assert.equal(filtered.headers.get('X-ISSSD-Export-Status'),'complete');await filtered.arrayBuffer();
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


test('title and menu write sets are atomic game areas before player edits',()=>{
 const {base,project}=fixture(),shots=[];
 project.state.patchesCompact.push({off:0x4C292,data:'1234'},{off:0xF0000,data:'5678'});
 const manifest=buildCumulativeProject(base,project,{onRom:(rom,e)=>shots.push({rom,e})});
 assert.deepEqual(shots.slice(0,4).map(x=>x.e.name),['01-infraestrutura.sfc','02-metadados.sfc','03-tela-inicial.sfc','04-menu-principal.sfc']);
 assert.equal(shots[0].rom[0x4C292],base[0x4C292]);assert.equal(shots[0].rom[0xF0000],base[0xF0000]);
 assert.equal(shots[2].rom[0x4C292],0x12);assert.equal(shots[2].rom[0x4C293],0x34);assert.equal(shots[2].rom[0xF0000],base[0xF0000]);
 assert.equal(shots[3].rom[0x4C292],0x12);assert.equal(shots[3].rom[0xF0000],0x56);assert.equal(shots[3].rom[0xF0001],0x78);
 assert.equal(readPlusPlayerName(shots[3].rom,30,1).name,'BASE1');assert.equal(manifest.granularity,'selected-game-area');
 assert.equal(manifest.entries.filter(e=>e.stage==='jogadores').length,1);
});

test('mandatory individualization also runs with no player or tactical overrides',()=>{
 const {base}=fixture(),shots=[];
 const manifest=buildCumulativeProject(base,{state:{semantic:{}}},{onRom:(rom,e)=>shots.push({rom,e})});
 assert.equal(manifest.entries.length,9);
 const a=resolvePlusTacticalRecord(shots[0].rom,30),b=resolvePlusTacticalRecord(shots[0].rom,31);
 assert.notEqual(a.recordPc,b.recordPc);assert.equal(shots[0].rom.length,0x400000);
 assert.equal(manifest.entries[2].status,'sem-alteracao-binaria');
});

test('unchecked phases are neither exported nor applied to later ROMs',()=>{
 const {base,project}=fixture(),shots=[];
 project.state.patchesCompact.push({off:0x4C292,data:'1234'},{off:0xF0000,data:'5678'});
 const selectedAreas=['infraestrutura','metadados','jogadores','formacoes'];
 const m=buildCumulativeProject(base,project,{selectedAreas,onRom:(r,e)=>shots.push({r,e})});
 assert.deepEqual(shots.map(x=>x.e.index),[1,2,8,9]);
 for(const {r}of shots){assert.equal(r[0x4C292],base[0x4C292]);assert.equal(r[0xF0000],base[0xF0000]);}
 assert.equal(readPlusPlayerName(shots.at(-1).r,30,1).name,'Cafu');
 assert.ok(m.skippedAreas.includes('tela-inicial'));
 project.state.semantic.teamsV1.teams[30].players[0].custom.number=999;
 assert.doesNotThrow(()=>buildCumulativeProject(base,project,{selectedAreas:['metadados'],onRom(){}}));
 assert.throws(()=>buildCumulativeProject(base,project,{selectedAreas:[],onRom(){}}),/Marque/);
});

test('legacy bytes without a confirmed area are reported and never silently applied',()=>{
 const {base,project}=fixture();project.state.patchesCompact.push({off:0x100,data:'AB'});let final;
 const m=buildCumulativeProject(base,project,{onRom:r=>{final=r}});
 assert.equal(final[0x100],base[0x100]);assert.ok(m.unassignedLegacyRanges.some(r=>r.start===0x100));
});
