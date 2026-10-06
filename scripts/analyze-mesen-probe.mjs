import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {rankProbeCandidates,normalizeProbeReport} from '../src/emulator/mesen-probe-analyzer.mjs';

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
if(positional.length!==1){
  console.error('Usage: npm run analyze:emulator:probe -- <probe.json> [--limit 20] [--out ranked.json]');
  process.exit(2);
}
if(!Number.isInteger(limit)||limit<1||limit>500){
  console.error('Invalid --limit value');
  process.exit(2);
}

const inputPath=resolve(positional[0]);
let report;
try{
  report=JSON.parse(await readFile(inputPath,'utf8'));
  normalizeProbeReport(report);
}catch(error){
  console.error('Invalid probe report:',error.message);
  process.exit(2);
}

const ranked=rankProbeCandidates(report);
console.log(`Probe frames: ${report.frames ?? 'unknown'}`);
console.log(`Candidates: ${ranked.length}`);
console.log(`Top ${Math.min(limit,ranked.length)}:`);
for(const row of ranked.slice(0,limit)){
  console.log(`${row.addressHex} value=${row.value} mask=0x${row.mask.toString(16).toUpperCase().padStart(2,'0')} changes=${row.changes} score=${row.score}`);
}

if(outPath){
  const payload={mode:'probe-analysis',source:inputPath,frames:report.frames ?? null,candidates:ranked};
  await writeFile(resolve(outPath),JSON.stringify(payload,null,2)+'\n','utf8');
  console.log('Wrote:',resolve(outPath));
}
