import {spawn} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildMesenSmokeArgs,interpretMesenSmokeResult} from '../src/emulator/mesen-runner.mjs';

const argv=process.argv.slice(2);
let mesenBin=process.env.MESEN_BIN||'';
let timeoutMs=30000;
let mode='smoke';
const positional=[];
for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--mesen'){mesenBin=argv[++i]||'';continue;}
  if(arg==='--timeout-ms'){timeoutMs=Number(argv[++i]);continue;}
  if(arg==='--mode'){mode=String(argv[++i]||'');continue;}
  positional.push(arg);
}

if(positional.length!==1){
  console.error('Usage: npm run test:emulator -- <rom.sfc> [--mode smoke|nav|probe] [--mesen <Mesen.exe>] [--timeout-ms 30000]');
  process.exit(2);
}
if(!['smoke','nav','probe'].includes(mode)){
  console.error('Invalid --mode. Use smoke, nav or probe.');
  process.exit(2);
}
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

const args=buildMesenSmokeArgs({luaPath,romPath});
console.log('Mesen emulator test');
console.log('Mode:',mode);
console.log('Mesen:',exePath);
console.log('ROM:',romPath);
console.log('Target frames:',mode==='smoke'?600:1200);
console.log('Timeout:',timeoutMs+'ms');

let stdout='';
let stderr='';
let timedOut=false;
const child=spawn(exePath,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});
child.stdout.on('data',chunk=>{const s=chunk.toString();stdout+=s;process.stdout.write(s);});
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
  const result=interpretMesenSmokeResult({exitCode:code,stdout,stderr,timedOut});
  if(result.ok){
    if(result.mode==='nav')console.log(`PASS: navigation survived ${result.frames} frames and ${result.steps} input steps.`);
    else if(result.mode==='probe')console.log(`PASS: WRAM probe completed with ${result.candidates} stable changing candidates.`);
    else console.log(`PASS: Mesen completed ${result.frames} frames.`);
    process.exit(0);
  }
  console.error('FAIL:',result.reason);
  process.exit(1);
});
