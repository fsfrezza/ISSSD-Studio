#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {analyzeStudioDiff} from '../src/core/studio-diff.mjs';
import {criticalCorridorPair} from '../src/core/regression-corridor.mjs';

function load(file){return new Uint8Array(fs.readFileSync(file))}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex')}
function assertSnapshot(file,bytes,descriptor){
  const actual=sha256(bytes);
  if(actual!==descriptor.sha256){
    throw new Error(`${descriptor.version} SHA-256 mismatch for ${path.basename(file)}: ${actual}`);
  }
  return actual;
}
function persistenceFocus(functionNames){
  const re=/(persist|project|save|load|team|squad|lineup|patch|rom|plus|state|apply|build)/i;
  return functionNames.filter(name=>re.test(name));
}

const [file692,file693]=process.argv.slice(2);
if(!file692||!file693){
  console.error('usage: node scripts/compare-v692-v693.mjs <v6.92.html> <v6.93.html>');
  process.exit(2);
}

const [d692,d693]=criticalCorridorPair();
const a=load(file692),b=load(file693);
const sha692=assertSnapshot(file692,a,d692);
const sha693=assertSnapshot(file693,b,d693);
const diff=analyzeStudioDiff(a,b);

process.stdout.write(JSON.stringify({
  schema:'isssd-v692-v693-regression-diff-v1',
  corridor:{
    from:{...d692,file:path.basename(file692),size:a.length,sha256:sha692},
    to:{...d693,file:path.basename(file693),size:b.length,sha256:sha693},
  },
  diff,
  persistenceFocusFunctions:persistenceFocus(diff.touchedFunctions),
},null,2)+'\n');
