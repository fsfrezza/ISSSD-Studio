function asInt(value,name,{min=0,max=Number.MAX_SAFE_INTEGER}={}){
  if(!Number.isInteger(value)||value<min||value>max)throw new TypeError(`${name} must be an integer between ${min} and ${max}`);
  return value;
}

function hex5(value){
  return `0x${value.toString(16).toUpperCase().padStart(5,'0')}`;
}

export function normalizeProbeReport(report){
  if(report===null||typeof report!=='object'||Array.isArray(report))throw new TypeError('probe report object required');
  if(report.mode!=='probe')throw new TypeError('probe report mode must be probe');
  const frames=report.frames===undefined?null:asInt(report.frames,'frames',{min:1});
  if(!Array.isArray(report.candidates))throw new TypeError('probe candidates array required');
  const candidates=report.candidates.map((row,index)=>{
    if(row===null||typeof row!=='object'||Array.isArray(row))throw new TypeError(`candidate ${index} object required`);
    const address=asInt(row.address,`candidate ${index} address`,{max:0x1FFFF});
    const value=asInt(row.value,`candidate ${index} value`,{max:0xFF});
    const mask=asInt(row.mask,`candidate ${index} mask`,{max:0xFF});
    const changes=asInt(row.changes,`candidate ${index} changes`,{max:8});
    return {address,addressHex:hex5(address),value,mask,changes};
  });
  return {mode:'probe',frames,candidates};
}

function stateLikeScore(candidate){
  let score=candidate.changes*40;
  if(candidate.value<=0x0F)score+=180;
  else if(candidate.value<=0x3F)score+=90;
  else if(candidate.value<=0x7F)score+=20;
  const transitionBits=candidate.mask.toString(2).replace(/0/g,'').length;
  score+=transitionBits*10;
  if(candidate.mask!==0)score+=10;
  return score;
}

export function rankProbeCandidates(report){
  const normalized=normalizeProbeReport(report);
  return normalized.candidates.map(candidate=>({
    ...candidate,
    score:stateLikeScore(candidate),
  })).sort((a,b)=>b.score-a.score||a.value-b.value||a.address-b.address);
}
