#!/usr/bin/env node
// Compare SNES WRAM snapshots from matched goalkeeper contacts.
// Requires 128 KiB raw SNES Work RAM dumps taken at comparable frames.
// This is a diagnostic only: no address is classified automatically.
import {readFileSync,writeFileSync} from 'node:fs';

const args=process.argv.slice(2);
if(args.length<3||args.length>4){
  console.error('Usage: node scripts/analyze-goalkeeper-wram.mjs <illegal-before.bin> <illegal-after.bin> <legal-after.bin> [output.json]');
  process.exit(2);
}
const [beforeFile,illegalFile,legalFile,outputFile]=args;
const files=[beforeFile,illegalFile,legalFile];
const dumps=files.map((file)=>{
  const bytes=readFileSync(file);
  if(bytes.length!==0x20000)throw new Error(`${file}: expected 131072 bytes, got ${bytes.length}. Dump SNES Work RAM, not CPU memory or ROM.`);
  return bytes;
});
const [before,illegal,legal]=dumps;
const both=[],illegalOnly=[],legalOnly=[],differentResult=[];
for(let i=0;i<before.length;i++){
  const a=before[i],b=illegal[i],c=legal[i];
  if(a===b&&a===c)continue;
  const row={address:i,addressHex:'0x'+i.toString(16).toUpperCase().padStart(5,'0'),before:a,illegalAfter:b,legalAfter:c};
  if(b!==a&&c===a)illegalOnly.push(row);
  else if(b===a&&c!==a)legalOnly.push(row);
  else if(b===c)both.push(row);
  else differentResult.push(row);
}
const report={
  schema:'isssd-goalkeeper-wram-diff-v1',
  note:'Address candidates only. Differences may arise from animation/timing, not from backpass detection. Repeat at matched contact frames with baseline controls.',
  files:{before:beforeFile,illegalAfter:illegalFile,legalAfter:legalFile},
  counts:{illegalOnly:illegalOnly.length,legalOnly:legalOnly.length,differentResult:differentResult.length,sharedTransition:both.length},
  candidates:{illegalOnly,differentResult,legalOnly,sharedTransition:both},
};
if(outputFile){
  writeFileSync(outputFile,JSON.stringify(report,null,2)+'\n');
  console.log('Report written:',outputFile);
}
console.log(JSON.stringify(report.counts,null,2));
console.log('First 25 illegal-only candidates:',illegalOnly.slice(0,25).map(x=>x.addressHex).join(', ')||'(none)');
