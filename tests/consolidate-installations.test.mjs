import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {consolidateInstallations} from '../scripts/consolidate-installations.mjs';
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-consolidate-'));
 const put=(name,rel,content)=>{const p=path.join(root,name,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content)};
 for(const [rel,data]of [['package.json','{}'],['scripts/build-editor.mjs','latest'],['.editor-vendor/legacy-ui/ISSSD-Studio.html','baseline'],['custom.issdproj','CURRENT']])put('ISSSD-Studio-Atualizado',rel,data);
 put('ISSSD-Studio','roms/International Superstar Soccer Deluxe Plus.sfc','BASE');
 put('ISSSD-Studio','custom.issdproj','OLD EDIT');
 put('ISSSD-Studio','code.mjs','old code');
 put('ISSSD-Studio','node_modules/generated/file','throwaway');
 put('ISSSD-Studio-UNIFICADO','custom.issdproj','OTHER EDIT');
 put('ISSSD-Studio-UNIFICADO','editor/ISSSD-Studio.html','generated');
 put('ISSSD-Studio-UNIFICADO','.git/refs/heads/local','local history');
 return {root,put,clean:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('consolidation keeps current project and ROM; verifies exclusive old data before removing both old installations',()=>{
 const f=fixture();try{
  const result=consolidateInstallations(f.root,{build:false});
  assert.equal(fs.readFileSync(path.join(result.target,'custom.issdproj'),'utf8'),'CURRENT');
  assert.equal(fs.readFileSync(path.join(result.target,'roms/International Superstar Soccer Deluxe Plus.sfc'),'utf8'),'BASE');
  assert.equal(fs.existsSync(path.join(f.root,'ISSSD-Studio')),false);
  assert.equal(fs.existsSync(path.join(f.root,'ISSSD-Studio-Atualizado')),false);
  assert.equal(result.records.filter(r=>r.path==='custom.issdproj'&&r.stored==='archive').length,2);
  assert(result.records.some(r=>r.path==='.git/refs/heads/local'&&r.stored==='archive'));
  assert(!result.records.some(r=>r.path.startsWith('node_modules/')||r.path==='editor/ISSSD-Studio.html'));
  assert(result.records.some(r=>r.path.startsWith('roms/')&&r.stored==='current'));
  assert.throws(()=>consolidateInstallations(f.root,{build:false}),/Atualizado ausente/);
  assert.equal(fs.readFileSync(path.join(result.target,'custom.issdproj'),'utf8'),'CURRENT');
 }finally{f.clean()}
});
test('symlink in an old installation stops consolidation before removing or replacing any directory',()=>{
 const f=fixture();try{
  fs.symlinkSync(path.join(f.root,'ISSSD-Studio-Atualizado'),path.join(f.root,'ISSSD-Studio','external'),'dir');
  assert.throws(()=>consolidateInstallations(f.root,{build:false}),/Link encontrado/);
  for(const name of ['ISSSD-Studio','ISSSD-Studio-Atualizado','ISSSD-Studio-UNIFICADO'])assert(fs.existsSync(path.join(f.root,name)));
 }finally{f.clean()}
});
