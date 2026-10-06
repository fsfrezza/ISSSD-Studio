const SMOKE_PASS_RE=/ISSSD_SMOKE_PASS\s+frames=(\d+)/;
const NAV_PASS_RE=/ISSSD_NAV_PASS\s+frames=(\d+)\s+steps=(\d+)/;
const PROBE_PASS_RE=/ISSSD_PROBE_PASS\s+frames=(\d+)\s+candidates=(\d+)/;

export function buildMesenSmokeArgs({luaPath,romPath}={}){
  if(!luaPath)throw new TypeError('luaPath required');
  if(!romPath)throw new TypeError('romPath required');
  return ['--enableStdout','--testRunner',String(luaPath),String(romPath)];
}

export function interpretMesenSmokeResult({exitCode,stdout='',stderr='',timedOut=false}={}){
  const out=String(stdout??'');
  const err=String(stderr??'');
  if(timedOut){
    return {ok:false,reason:'Mesen smoke test timeout',exitCode,stdout:out,stderr:err,frames:null,mode:null,steps:null,candidates:null};
  }
  if(exitCode!==0){
    return {ok:false,reason:`Mesen exited with exit code ${exitCode}`,exitCode,stdout:out,stderr:err,frames:null,mode:null,steps:null,candidates:null};
  }
  const probe=PROBE_PASS_RE.exec(out);
  if(probe){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(probe[1]),mode:'probe',steps:null,candidates:Number(probe[2])};
  }
  const nav=NAV_PASS_RE.exec(out);
  if(nav){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(nav[1]),mode:'nav',steps:Number(nav[2]),candidates:null};
  }
  const smoke=SMOKE_PASS_RE.exec(out);
  if(smoke){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(smoke[1]),mode:'smoke',steps:null,candidates:null};
  }
  return {ok:false,reason:'Mesen smoke test pass marker not found',exitCode,stdout:out,stderr:err,frames:null,mode:null,steps:null,candidates:null};
}
