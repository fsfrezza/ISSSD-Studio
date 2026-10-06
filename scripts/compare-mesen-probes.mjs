import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compareProbeReports} from '../src/emulator/mesen-probe-compare.mjs';

const argv=process.argv.slice(2);
let outPath='';
let limit=20;
const positional=[];
for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--out'){outPath=argv[++i]||'';continue;}
  if(arg==='--limit'){limit=Number(argv[++i]);continue;}
  positional.push(arg);
}
if(positional.length!==2){
  console.error('Usage: npm run compare:emulator:probes -- <base-probe.json> <generated-probe.json> [--limit 20] [--out comparison.json]');
  process.exit(2);
}
if(!Number.isInteger(limit)||limit<1||limit>500){
  console.error('Invalid --limit value');
  process.exit(2);
}

try{
  const basePath=resolve(positional[0]);
  const generatedPath=resolve(positional[1]);
  const [base,generated]=await Promise.all([
    readFile(basePath,'utf8').then(JSON.parse),
    readFile(generatedPath,'utf8').then(JSON.parse),
  ]);
  const result=compareProbeReports(base,generated);
  console.log(`Shared WRAM addresses: ${result.sharedAddresses}`);
  console.log(`Promotable: ${result.promotable.length}`);
  console.log(`Divergent: ${result.divergent.length}`);
  console.log(`Only base: ${result.onlyBase.length}`);
  console.log(`Only generated: ${result.onlyGenerated.length}`);
  console.log(`Top ${Math.min(limit,result.promotable.length)} promotable candidates:`);
  for(const row of result.promotable.slice(0,limit)){
    console.log(`${row.addressHex} class=${row.classification} value=${row.base.value} mask=0x${row.base.mask.toString(16).toUpperCase().padStart(2,'0')} baseChanges=${row.base.changes} generatedChanges=${row.generated.changes} score=${row.score}`);
  }
  if(outPath){
    const output=resolve(outPath);
    await writeFile(output,JSON.stringify(result,null,2)+'\n','utf8');
    console.log('Wrote:',output);
  }
}catch(error){
  console.error('Probe comparison failed:',error.message);
  process.exit(2);
}
