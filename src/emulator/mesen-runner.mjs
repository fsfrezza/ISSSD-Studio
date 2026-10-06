const PASS_RE=/ISSSD_SMOKE_PASS\s+frames=(\d+)/;

export function buildMesenSmokeArgs({luaPath,romPath}={}){
  if(!luaPath)throw new TypeError('luaPath required');
  if(!romPath)throw new TypeError('romPath required');
  return ['--enableStdout','--testRunner',String(luaPath),String(romPath)];
}

export function interpretMesenSmokeResult({exitCode,stdout='',stderr='',timedOut=false}={}){
  const out=String(stdout??'');
  const err=String(stderr??'');
  if(timedOut){
    return {ok:false,reason:'Mesen smoke test timeout',exitCode,stdout:out,stderr:err,frames:null};
  }
  if(exitCode!==0){
    return {ok:false,reason:`Mesen exited with exit code ${exitCode}`,exitCode,stdout:out,stderr:err,frames:null};
  }
  const match=PASS_RE.exec(out);
  if(!match){
    return {ok:false,reason:'Mesen smoke test pass marker not found',exitCode,stdout:out,stderr:err,frames:null};
  }
  return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(match[1])};
}
