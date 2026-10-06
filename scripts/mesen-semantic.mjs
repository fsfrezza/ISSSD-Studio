import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {buildMesenSmokeArgs,interpretMesenSmokeResult} from '../src/emulator/mesen-runner.mjs';
import {normalizeSemanticProfile,renderSemanticLua} from '../src/emulator/mesen-semantic-profile.mjs';

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
if(positional.length!==2){
  console.error('Usage: npm run test:emulator:semantic -- <rom.sfc> <profile.json> [--mesen <Mesen.exe>] [--timeout-ms 30000]');
  process.exit(2);
}
if(!Number.isFinite(timeoutMs)||timeoutMs<=0){console.error('Invalid --timeout-ms value');process.exit(2);}
if(!mesenBin){
  const pathFile=resolve('.tools/mesen/mesen-path.txt');
  if(existsSync(pathFile))mesenBin=readFileSync(pathFile,'utf8').replace(/^\uFEFF/,'').trim();
}
if(!mesenBin){
  const common=resolve('.tools/mesen/Mesen.exe');
  if(existsSync(common))mesenBin=common;
}
if(!mesenBin){console.error('Mesen executable not configured. Run npm run setup:mesen:windows first.');process.exit(2);}

const romPath=resolve(positional[0]);
const profilePath=resolve(positional[1]);
const exePath=resolve(mesenBin);
if(!existsSync(romPath)){console.error('ROM not found: '+romPath);process.exit(2);}
if(!existsSync(profilePath)){console.error('Semantic profile not found: '+profilePath);process.exit(2);}
if(!existsSync(exePath)){console.error('Mesen not found: '+exePath);process.exit(2);}

let profile;
try{
  profile=normalizeSemanticProfile(JSON.parse(readFileSync(profilePath,'utf8')));
}catch(error){
  console.error('Invalid semantic profile:',error.message);
  process.exit(2);
}
const workDir=mkdtempSync(join(tmpdir(),'isssd-mesen-semantic-'));
const luaPath=join(workDir,'semantic.lua');
writeFileSync(luaPath,renderSemanticLua(profile),'utf8');

console.log('Mesen semantic test');
console.log('Mesen:',exePath);
console.log('ROM:',romPath);
console.log('Profile:',profilePath);
console.log('Checkpoints:',profile.checkpoints.length);
console.log('Max frames:',profile.maxFrames);

let stdout='';
let stderr='';
let timedOut=false;
let settled=false;
const finish=(code)=>{
  if(settled)return;
  settled=true;
  rmSync(workDir,{recursive:true,force:true});
  process.exit(code);
};
const child=spawn(exePath,buildMesenSmokeArgs({luaPath,romPath}),{stdio:['ignore','pipe','pipe'],windowsHide:true});
child.stdout.on('data',chunk=>{const s=chunk.toString();stdout+=s;process.stdout.write(s);});
child.stderr.on('data',chunk=>{const s=chunk.toString();stderr+=s;process.stderr.write(s);});
const timer=setTimeout(()=>{timedOut=true;child.kill();},timeoutMs);
child.on('error',error=>{
  clearTimeout(timer);
  console.error('Failed to launch Mesen:',error.message);
  finish(2);
});
child.on('close',code=>{
  clearTimeout(timer);
  const result=interpretMesenSmokeResult({exitCode:code,stdout,stderr,timedOut});
  if(result.ok&&result.mode==='semantic'){
    console.log(`PASS: ${result.checkpoints} semantic checkpoints reached in ${result.frames} frames.`);
    finish(0);
    return;
  }
  console.error('FAIL:',result.reason);
  finish(1);
});
