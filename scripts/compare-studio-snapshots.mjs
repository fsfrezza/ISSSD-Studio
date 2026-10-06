#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {analyzeStudioDiff} from '../src/core/studio-diff.mjs';

function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex')}
function load(file){return new Uint8Array(fs.readFileSync(file))}

const [fileA,fileB,expectedA,expectedB]=process.argv.slice(2);
if(!fileA||!fileB){
  console.error('usage: node scripts/compare-studio-snapshots.mjs <snapshot-a.html> <snapshot-b.html> [sha256-a] [sha256-b]');
  process.exit(2);
}
const a=load(fileA),b=load(fileB);
const shaA=sha256(a),shaB=sha256(b);
if(expectedA && shaA!==expectedA.toLowerCase()) throw new Error('snapshot A SHA-256 mismatch: '+shaA);
if(expectedB && shaB!==expectedB.toLowerCase()) throw new Error('snapshot B SHA-256 mismatch: '+shaB);
const diff=analyzeStudioDiff(a,b);
process.stdout.write(JSON.stringify({
  schema:'isssd-studio-snapshot-diff-v1',
  a:{file:path.basename(fileA),size:a.length,sha256:shaA},
  b:{file:path.basename(fileB),size:b.length,sha256:shaB},
  diff,
},null,2)+'\n');
