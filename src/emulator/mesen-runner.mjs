const SMOKE_PASS_RE=/ISSSD_SMOKE_PASS\s+frames=(\d+)/;
const NAV_PASS_RE=/ISSSD_NAV_PASS\s+frames=(\d+)\s+steps=(\d+)/;
const PROBE_PASS_RE=/ISSSD_PROBE_PASS\s+frames=(\d+)\s+candidates=(\d+)/;
const PROBE_CAND_RE=/ISSSD_PROBE_CAND\s+addr=(0x[0-9A-Fa-f]+)\s+value=(\d+)\s+mask=(0x[0-9A-Fa-f]+)\s+changes=(\d+)/g;

export function buildMesenSmokeArgs({luaPath,romPath}={}){
  if(!luaPath)throw new TypeError('luaPath required');
  if(!romPath)throw new TypeError('romPath required');
  return ['--enableStdout','--testRunner',String(luaPath),String(romPath)];
}

export function parseMesenProbeCandidates(stdout=''){
  const out=String(stdout??'');
  const rows=[];
  for(const match of out.matchAll(PROBE_CAND_RE)){
    const addressHex=match[1].toUpperCase().replace('X','x');
    const maskHex=match[3].toUpperCase().replace('X','x');
    rows.push({
      address:Number.parseInt(match[1],16),
      addressHex,
      value:Number(match[2]),
      mask:Number.parseInt(match[3],16),
      maskHex,
      changes:Number(match[4]),
    });
  }
  return rows;
}

export function interpretMesenSmokeResult({exitCode,stdout='',stderr='',timedOut=false}={}){
  const out=String(stdout??'');
  const err=String(stderr??'');
  const empty={frames:null,mode:null,steps:null,candidates:null,probeCandidates:[]};
  if(timedOut){
    return {ok:false,reason:'Mesen smoke test timeout',exitCode,stdout:out,stderr:err,...empty};
  }
  if(exitCode!==0){
    return {ok:false,reason:`Mesen exited with exit code ${exitCode}`,exitCode,stdout:out,stderr:err,...empty};
  }
  const probe=PROBE_PASS_RE.exec(out);
  if(probe){
    return {
      ok:true,
      reason:'ok',
      exitCode,
      stdout:out,
      stderr:err,
      frames:Number(probe[1]),
      mode:'probe',
      steps:null,
      candidates:Number(probe[2]),
      probeCandidates:parseMesenProbeCandidates(out),
    };
  }
  const nav=NAV_PASS_RE.exec(out);
  if(nav){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(nav[1]),mode:'nav',steps:Number(nav[2]),candidates:null,probeCandidates:[]};
  }
  const smoke=SMOKE_PASS_RE.exec(out);
  if(smoke){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(smoke[1]),mode:'smoke',steps:null,candidates:null,probeCandidates:[]};
  }
  return {ok:false,reason:'Mesen smoke test pass marker not found',exitCode,stdout:out,stderr:err,...empty};
}
