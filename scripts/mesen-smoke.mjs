import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildMesenSmokeArgs,interpretMesenSmokeResult} from '../src/emulator/mesen-runner.mjs';

const argv=process.argv.slice(2);
let mesenBin=process.env.MESEN_BIN||'';
let timeoutMs=null;
let mode='smoke';
let reportPath='';
const positional=[];
for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--mesen'){mesenBin=argv[++i]||'';continue;}
  if(arg==='--timeout-ms'){timeoutMs=Number(argv[++i]);continue;}
  if(arg==='--mode'){mode=String(argv[++i]||'');continue;}
  if(arg==='--report'){reportPath=String(argv[++i]||'');continue;}
  positional.push(arg);
}

if(positional.length!==1){
  console.error('Usage: npm run test:emulator -- <rom.sfc> [--mode smoke|nav|probe] [--mesen <Mesen.exe>] [--timeout-ms <ms>] [--report report.json]');
  process.exit(2);
}
if(!['smoke','nav','probe'].includes(mode)){
  console.error('Invalid --mode. Use smoke, nav or probe.');
  process.exit(2);
}
if(reportPath&&mode!=='probe'){
  console.error('--report is only valid with --mode probe.');
  process.exit(2);
}
if(timeoutMs===null) timeoutMs=mode==='probe'?120000:30000;
if(!Number.isFinite(timeoutMs)||timeoutMs<=0){
  console.error('Invalid --timeout-ms value');
  process.exit(2);
}

if(!mesenBin){
  const pathFile=resolve('.tools/mesen/mesen-path.txt');
  if(existsSync(pathFile)){
    mesenBin=readFileSync(pathFile,'utf8').replace(/^\uFEFF/,'').trim();
  }
}
if(!mesenBin){
  const common=resolve('.tools/mesen/Mesen.exe');
  if(existsSync(common))mesenBin=common;
}
if(!mesenBin){
  console.error('Mesen executable not configured. Run scripts/setup-mesen-windows.ps1, set MESEN_BIN, or pass --mesen <path>.');
  process.exit(2);
}

const romPath=resolve(positional[0]);
const luaName=mode==='nav'?'nav.lua':mode==='probe'?'probe.lua':'smoke.lua';
const luaPath=resolve(fileURLToPath(new URL('./mesen/'+luaName,import.meta.url)));
const exePath=resolve(mesenBin);
if(!existsSync(romPath)){console.error('ROM not found: '+romPath);process.exit(2);}
if(!existsSync(exePath)){console.error('Mesen not found: '+exePath);process.exit(2);}

const args=buildMesenSmokeArgs({
  luaPath,
  romPath,
  testRunnerTimeoutSec:Math.max(180,Math.ceil(timeoutMs/1000)+30),
});
console.log('Mesen emulator test');
console.log('Mode:',mode);
console.log('Mesen:',exePath);
console.log('ROM:',romPath);
console.log('Lua:',luaPath);
console.log('Target frames:',mode==='smoke'?600:1200);
console.log('Timeout:',timeoutMs+'ms');

let stdout='';
let stdoutBuffer='';
let stderr='';
let timedOut=false;
let suppressedUninitializedReads=0;
const child=spawn(exePath,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});

function consumeStdoutText(text,{flush=false}={}){
  stdoutBuffer+=text;
  const parts=stdoutBuffer.split(/\r?\n/);
  if(!flush) stdoutBuffer=parts.pop()??'';
  else stdoutBuffer='';
  for(const line of parts){
    if(!line&&flush) continue;
    if(line.includes('[CPU] Uninitialized memory read:')){
      suppressedUninitializedReads++;
      continue;
    }
    stdout+=line+'\n';
    process.stdout.write(line+'\n');
  }
}

child.stdout.on('data',chunk=>consumeStdoutText(chunk.toString()));
child.stderr.on('data',chunk=>{const s=chunk.toString();stderr+=s;process.stderr.write(s);});
const timer=setTimeout(()=>{
  timedOut=true;
  child.kill();
},timeoutMs);

child.on('error',error=>{
  clearTimeout(timer);
  console.error('Failed to launch Mesen:',error.message);
  process.exit(2);
});

child.on('close',code=>{
  clearTimeout(timer);
  if(stdoutBuffer) consumeStdoutText('\n',{flush:true});
  if(suppressedUninitializedReads>0){
    console.log(`Suppressed ${suppressedUninitializedReads} repetitive uninitialized-memory warnings.`);
  }
  const result=interpretMesenSmokeResult({exitCode:code,stdout,stderr,timedOut});
  if(result.ok){
    if(result.mode==='nav'){
      console.log(`PASS: navigation survived ${result.frames} frames and ${result.steps} input steps.`);
    }else if(result.mode==='probe'){
      console.log(`PASS: WRAM probe completed with ${result.candidates} stable changing candidates.`);
      if(reportPath){
        const output=resolve(reportPath);
        const report={
          schema:'isssd-mesen-probe-v1',
          romPath,
          frames:result.frames,
          totalCandidates:result.candidates,
          emittedCandidates:result.probeCandidates.length,
          candidates:result.probeCandidates,
        };
        writeFileSync(output,JSON.stringify(report,null,2)+'\n','utf8');
        console.log('Probe report:',output);
      }
    }else{
      console.log(`PASS: Mesen completed ${result.frames} frames.`);
    }
    process.exit(0);
  }
  console.error('FAIL:',result.reason);
  console.error('Mesen exit code:',code);
  console.error('Mesen args:',JSON.stringify(args));
  if(stdout.trim()) console.error('Captured stdout:\n'+stdout.trim());
  if(stderr.trim()) console.error('Captured stderr:\n'+stderr.trim());
  process.exit(1);
});
