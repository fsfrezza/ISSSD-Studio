import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildMesenSmokeArgs,interpretMesenSmokeResult} from '../src/emulator/mesen-runner.mjs';

const argv=process.argv.slice(2);
let mesenBin=process.env.MESEN_BIN||'';
let timeoutMs=30000;
const positional=[];
for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--mesen'){mesenBin=argv[++i]||'';continue;}
  if(arg==='--timeout-ms'){timeoutMs=Number(argv[++i]);continue;}
  positional.push(arg);
}

if(positional.length!==1){
  console.error('Usage: npm run test:emulator -- <rom.sfc> [--mesen <Mesen.exe>] [--timeout-ms 30000]');
  process.exit(2);
}
if(!mesenBin){
  console.error('Mesen executable not configured. Set MESEN_BIN or pass --mesen <path>.');
  process.exit(2);
}
if(!Number.isFinite(timeoutMs)||timeoutMs<=0){
  console.error('Invalid --timeout-ms value');
  process.exit(2);
}

const romPath=resolve(positional[0]);
const luaPath=resolve(fileURLToPath(new URL('./mesen/smoke.lua',import.meta.url)));
const exePath=resolve(mesenBin);
if(!existsSync(romPath)){console.error('ROM not found: '+romPath);process.exit(2);}
if(!existsSync(exePath)){console.error('Mesen not found: '+exePath);process.exit(2);}

const args=buildMesenSmokeArgs({luaPath,romPath});
console.log('Mesen smoke test');
console.log('ROM:',romPath);
console.log('Target frames: 600');
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
    console.log(`PASS: Mesen completed ${result.frames} frames.`);
    process.exit(0);
  }
  console.error('FAIL:',result.reason);
  process.exit(1);
});
