function requireBytes(value,label){
  if(!(value instanceof Uint8Array) && !Buffer.isBuffer(value)) throw new TypeError(label+' must be bytes');
  return value;
}

function firstDiff(a,b){
  const n=Math.min(a.length,b.length);
  for(let i=0;i<n;i++) if(a[i]!==b[i]) return i;
  return a.length===b.length?null:n;
}

function commonSuffix(a,b,first){
  if(first===null) return Math.min(a.length,b.length);
  let count=0;
  while(
    count<a.length-first &&
    count<b.length-first &&
    a[a.length-1-count]===b[b.length-1-count]
  ) count++;
  return count;
}

function functionRanges(text){
  const out=[];
  const re=/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
  const matches=[...text.matchAll(re)];
  for(let i=0;i<matches.length;i++){
    out.push({
      name:matches[i][1],
      start:matches[i].index,
      end:i+1<matches.length?matches[i+1].index:text.length,
    });
  }
  return out;
}

function touchedFunctionNames(text,start,end){
  if(start===null || end===null) return [];
  return functionRanges(text)
    .filter(r=>r.start<=end && r.end>start)
    .map(r=>r.name);
}

export function analyzeStudioDiff(aInput,bInput){
  const a=requireBytes(aInput,'snapshot A');
  const b=requireBytes(bInput,'snapshot B');
  const first=firstDiff(a,b);
  if(first===null){
    return {
      identical:true,
      sizeA:a.length,sizeB:b.length,
      firstDifference:null,lastDifferenceA:null,lastDifferenceB:null,
      commonPrefix:a.length,commonSuffix:a.length,
      changedBytesA:0,changedBytesB:0,
      touchedFunctions:[],
    };
  }
  const suffix=commonSuffix(a,b,first);
  const lastA=a.length-1-suffix;
  const lastB=b.length-1-suffix;
  const textA=Buffer.from(a).toString('utf8');
  const textB=Buffer.from(b).toString('utf8');
  const names=new Set([
    ...touchedFunctionNames(textA,first,lastA),
    ...touchedFunctionNames(textB,first,lastB),
  ]);
  return {
    identical:false,
    sizeA:a.length,sizeB:b.length,
    firstDifference:first,
    lastDifferenceA:lastA,
    lastDifferenceB:lastB,
    commonPrefix:first,
    commonSuffix:suffix,
    changedBytesA:Math.max(0,lastA-first+1),
    changedBytesB:Math.max(0,lastB-first+1),
    touchedFunctions:[...names].sort(),
  };
}
