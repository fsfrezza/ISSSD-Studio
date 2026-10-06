#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {diffRanges,readSnesChecksum} from '../src/core/rom-integrity.mjs';

const PLUS_SIZE=0x200000;
const PLUS_SHA256='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a';

function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex')}
function load(file){return new Uint8Array(fs.readFileSync(file))}
function hex(n){return '0x'+n.toString(16).toUpperCase().padStart(6,'0')}

function summarize(base,out){
  const ranges=diffRanges(base,out);
  const checksum=readSnesChecksum(out);
  return {
    length:out.length,
    sha256:sha256(out),
    changedBytes:ranges.changedBytes,
    changedRanges:ranges.ranges.map(r=>({start:hex(r.start),end:hex(r.end),length:r.length})),
    checksum,
    checksumPairValid:((checksum.checksum^checksum.complement)&0xFFFF)===0xFFFF,
    hasDataAtExpansionBoundary:out.length>PLUS_SIZE,
  };
}

const [baseFile,...outputs]=process.argv.slice(2);
if(!baseFile||outputs.length===0){
  console.error('usage: node scripts/regression-snapshot.mjs <clean-plus.sfc> <output1.sfc> [output2.sfc ...]');
  process.exit(2);
}
const base=load(baseFile);
if(base.length!==PLUS_SIZE) throw new Error('clean Plus base must be exactly 2 MiB');
const baseHash=sha256(base);
if(baseHash!==PLUS_SHA256) throw new Error('clean Plus base SHA-256 mismatch: '+baseHash);

const report={
  schema:'isssd-regression-snapshot-v1',
  base:{file:path.basename(baseFile),length:base.length,sha256:baseHash},
  outputs:outputs.map(file=>({file:path.basename(file),...summarize(base,load(file))}))
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
