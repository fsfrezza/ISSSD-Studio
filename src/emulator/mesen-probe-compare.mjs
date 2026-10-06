import {normalizeProbeReport,rankProbeCandidates} from './mesen-probe-analyzer.mjs';

function hex5(value){
  return `0x${value.toString(16).toUpperCase().padStart(5,'0')}`;
}

export function compareProbeReports(baseReport,generatedReport){
  const base=normalizeProbeReport(baseReport);
  const generated=normalizeProbeReport(generatedReport);
  const baseRank=new Map(rankProbeCandidates(baseReport).map(row=>[row.address,row.score]));
  const generatedRank=new Map(rankProbeCandidates(generatedReport).map(row=>[row.address,row.score]));
  const baseMap=new Map(base.candidates.map(row=>[row.address,row]));
  const generatedMap=new Map(generated.candidates.map(row=>[row.address,row]));

  const promotable=[];
  const divergent=[];
  for(const [address,a] of baseMap){
    const b=generatedMap.get(address);
    if(!b)continue;
    const exact=a.value===b.value&&a.mask===b.mask&&a.changes===b.changes;
    const compatible=!exact&&a.value===b.value&&a.mask===b.mask;
    const common={
      address,
      addressHex:hex5(address),
      base:a,
      generated:b,
    };
    if(exact||compatible){
      const classification=exact?'exact':'compatible';
      const score=Math.min(baseRank.get(address)??0,generatedRank.get(address)??0)+(exact?1000:500);
      promotable.push({...common,classification,score});
    }else{
      divergent.push({...common,classification:'divergent'});
    }
  }

  promotable.sort((a,b)=>b.score-a.score||a.address-b.address);
  divergent.sort((a,b)=>a.address-b.address);
  const onlyBase=base.candidates.filter(row=>!generatedMap.has(row.address)).sort((a,b)=>a.address-b.address);
  const onlyGenerated=generated.candidates.filter(row=>!baseMap.has(row.address)).sort((a,b)=>a.address-b.address);

  return {
    mode:'probe-compare',
    baseFrames:base.frames,
    generatedFrames:generated.frames,
    sharedAddresses:promotable.length+divergent.length,
    promotable,
    divergent,
    onlyBase,
    onlyGenerated,
  };
}
