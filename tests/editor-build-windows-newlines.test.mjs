import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('Editor bundles photo modules identically with Windows CRLF and Unix LF',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url));
 const output=new URL('../editor/ISSSD-Studio.html',import.meta.url);
 const previous=fs.existsSync(output)?fs.readFileSync(output):null;
 function build(newline){
  // Change only the builder's text read, preserving the real source on disk.
  const preload=`import fs from 'node:fs';import{syncBuiltinESMExports}from'node:module';const read=fs.readFileSync;fs.readFileSync=function(path,...args){const result=read.call(this,path,...args);if(String(path).replaceAll('\\\\','/').endsWith('/src/core/team-photos.mjs')&&typeof result==='string')return result.replace(/\\r\\n?/g,'\\n').replace(/\\n/g,${JSON.stringify(newline)});return result;};syncBuiltinESMExports();`;
  const result=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),'scripts/build-editor.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  return fs.readFileSync(output);
 }
 try{assert.deepEqual(build('\r\n'),build('\n'));}
 finally{if(previous)fs.writeFileSync(output,previous);else fs.rmSync(output,{force:true});}
});
