const SMOKE_PASS_RE=/ISSSD_SMOKE_PASS\s+frames=(\d+)/;
const NAV_PASS_RE=/ISSSD_NAV_PASS\s+frames=(\d+)\s+steps=(\d+)/;
const PROBE_PASS_RE=/ISSSD_PROBE_PASS\s+frames=(\d+)\s+candidates=(\d+)/;
const SEMANTIC_PASS_RE=/ISSSD_SEMANTIC_PASS\s+frames=(\d+)\s+checkpoints=(\d+)/;
const SEMANTIC_FAIL_RE=/ISSSD_SEMANTIC_FAIL\s+checkpoint=([^\s]+)\s+frame=(\d+)/;
const SEMANTIC_STATE_RE=/ISSSD_SEMANTIC_STATE\s+([^\s]+)\s+frame=(\d+)\s+value=(\d+)/g;
const PROBE_CAND_RE=/ISSSD_PROBE_CAND\s+addr=(0x[0-9A-Fa-f]+)\s+value=(\d+)\s+mask=(0x[0-9A-Fa-f]+)\s+changes=(\d+)/g;

export function buildMesenSmokeArgs({luaPath,romPath,testRunnerTimeoutSec=180}={}){
  if(!luaPath)throw new TypeError('luaPath required');
  if(!romPath)throw new TypeError('romPath required');
  if(!Number.isFinite(testRunnerTimeoutSec)||testRunnerTimeoutSec<=0)throw new TypeError('testRunnerTimeoutSec must be positive');
  return ['--enableStdout',`--timeout=${Math.ceil(testRunnerTimeoutSec)}`,'--testRunner',String(luaPath),String(romPath)];
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

export function parseMesenSemanticStates(stdout=''){
  const rows=[];
  for(const match of String(stdout??'').matchAll(SEMANTIC_STATE_RE)){
    rows.push({name:match[1],frame:Number(match[2]),value:Number(match[3])});
  }
  return rows;
}

export function interpretMesenSmokeResult({exitCode,stdout='',stderr='',timedOut=false}={}){
  const out=String(stdout??'');
  const err=String(stderr??'');
  const empty={frames:null,mode:null,steps:null,candidates:null,probeCandidates:[],checkpoints:null,semanticStates:[]};
  if(timedOut){
    return {ok:false,reason:'Mesen smoke test timeout',exitCode,stdout:out,stderr:err,...empty};
  }
  const semanticFail=SEMANTIC_FAIL_RE.exec(out);
  if(semanticFail){
    return {ok:false,reason:`Semantic checkpoint not reached: ${semanticFail[1]}`,exitCode,stdout:out,stderr:err,frames:Number(semanticFail[2]),mode:'semantic',steps:null,candidates:null,probeCandidates:[],checkpoints:null,semanticStates:parseMesenSemanticStates(out)};
  }
  if(exitCode!==0){
    return {ok:false,reason:`Mesen exited with exit code ${exitCode}`,exitCode,stdout:out,stderr:err,...empty};
  }
  const semantic=SEMANTIC_PASS_RE.exec(out);
  if(semantic){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(semantic[1]),mode:'semantic',steps:null,candidates:null,probeCandidates:[],checkpoints:Number(semantic[2]),semanticStates:parseMesenSemanticStates(out)};
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
      checkpoints:null,
      semanticStates:[],
    };
  }
  const nav=NAV_PASS_RE.exec(out);
  if(nav){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(nav[1]),mode:'nav',steps:Number(nav[2]),candidates:null,probeCandidates:[],checkpoints:null,semanticStates:[]};
  }
  const smoke=SMOKE_PASS_RE.exec(out);
  if(smoke){
    return {ok:true,reason:'ok',exitCode,stdout:out,stderr:err,frames:Number(smoke[1]),mode:'smoke',steps:null,candidates:null,probeCandidates:[],checkpoints:null,semanticStates:[]};
  }
  return {ok:false,reason:'Mesen smoke test pass marker not found',exitCode,stdout:out,stderr:err,...empty};
}
