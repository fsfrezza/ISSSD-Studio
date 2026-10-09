import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const CORE_DIR_URL=new URL('../src/core/',import.meta.url);
const CORE_DIR=fileURLToPath(CORE_DIR_URL);

async function coreFiles(){
  const names=await readdir(CORE_DIR);
  return names.filter(name=>name.endsWith('.mjs')).sort();
}

test('core stays frontend/runtime agnostic',async()=>{
  const forbidden=[
    /from\s+['"]node:/,
    /import\s*\(\s*['"]node:/,
    /from\s+['"]@tauri-apps\//,
    /from\s+['"]electron['"]/, 
    /\bwindow\./,
    /\bdocument\./,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
  ];
  const violations=[];
  for(const name of await coreFiles()){
    const text=await readFile(join(CORE_DIR,name),'utf8');
    for(const pattern of forbidden){
      if(pattern.test(text))violations.push(`${name}: ${pattern}`);
    }
  }
  assert.deepEqual(violations,[],`src/core must remain portable:\n${violations.join('\n')}`);
});
