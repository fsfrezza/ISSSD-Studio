export const KONAMI_LZ_RING_SIZE=0x400;
export const KONAMI_LZ_MAX_STREAM=0x7FFF;

function asBytes(value,label='bytes'){
  if(value instanceof Uint8Array)return value;
  if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
  if(Array.isArray(value))return Uint8Array.from(value);
  throw new TypeError(label+' must be byte-like');
}

export function konamiLzDecompress(source,offset=0,{maxOutput=0x20000}={}){
  const bytes=asBytes(source,'source');
  const fileOff=Number(offset);
  if(!Number.isInteger(fileOff)||fileOff<0||fileOff+2>bytes.length)throw new RangeError('Konami LZ stream outside source');
  const total=(bytes[fileOff]|(bytes[fileOff+1]<<8))&KONAMI_LZ_MAX_STREAM;
  if(total<2||fileOff+total>bytes.length)throw new RangeError('invalid Konami LZ compressed size');
  if(!Number.isInteger(maxOutput)||maxOutput<0)throw new RangeError('maxOutput must be a non-negative integer');

  const input=bytes.subarray(fileOff+2,fileOff+total);
  const ring=new Uint8Array(KONAMI_LZ_RING_SIZE),out=[];
  let ip=0,pos=0;
  const put=value=>{
    if(out.length>=maxOutput)throw new RangeError('Konami LZ output exceeds limit');
    const byte=value&0xFF;
    out.push(byte);ring[pos]=byte;pos=(pos+1)&0x3FF;
  };

  while(ip<input.length){
    const control=input[ip++];
    if(control<0x80){
      if(ip>=input.length)throw new RangeError('truncated Konami LZ back-reference');
      const count=(control>>2)+2;
      const word=(control<<8)|input[ip++];
      const readPos=(word-0x3DF)&0x3FF;
      for(let i=0;i<count;i++)put(ring[(readPos+i)&0x3FF]);
    }else if(control<0xA0){
      const count=control&0x1F;
      if(ip+count>input.length)throw new RangeError('truncated Konami LZ literal');
      for(let i=0;i<count;i++)put(input[ip++]);
    }else if(control<0xC0){
      const count=(control&0x1F)+2;
      if(ip+count>input.length)throw new RangeError('truncated Konami LZ zero/value run');
      for(let i=0;i<count;i++){put(0);put(input[ip++]);}
    }else if(control<0xE0){
      const count=(control&0x1F)+2;
      if(ip>=input.length)throw new RangeError('truncated Konami LZ repeat run');
      const value=input[ip++];
      for(let i=0;i<count;i++)put(value);
    }else if(control<0xFF){
      const count=(control&0x1F)+2;
      for(let i=0;i<count;i++)put(0);
    }else{
      if(ip>=input.length)throw new RangeError('truncated Konami LZ long zero run');
      const count=input[ip++]+2;
      for(let i=0;i<count;i++)put(0);
    }
  }

  return {data:Uint8Array.from(out),compressedSize:total};
}

export function konamiLzCompress(data){
  const src=asBytes(data,'data'),n=src.length;
  const INF=0x3FFFFFFF;
  const cost=new Int32Array(n+1),kind=new Uint8Array(n),span=new Uint16Array(n),arg=new Uint16Array(n);
  const matches=new Uint8Array(n),matchRP=new Uint16Array(n);
  const heads=new Int32Array(65536);heads.fill(-1);
  const prev=new Int32Array(n);prev.fill(-1);

  // Exact two-byte history index from the verified Studio compressor. The
  // format accepts back-references of length 2, so starting at 3 loses many
  // useful repetitions in planar tile data.
  for(let i=0;i+1<n;i++){
    const hash=(src[i]<<8)|src[i+1];
    let j=heads[hash],best=0,bestRp=0;
    while(j>=0&&i-j<=1024){
      const distance=i-j,limit=Math.min(33,n-i);
      let length=2;
      while(length<limit&&src[i+length]===src[i+length-distance])length++;
      if(length>best){best=length;bestRp=j&0x3FF;if(best===limit)break;}
      j=prev[j];
    }
    matches[i]=best;matchRP[i]=bestRp;
    prev[i]=heads[hash];heads[hash]=i;
  }

  cost[n]=0;
  for(let i=n-1;i>=0;i--){
    let best=INF,bestKind=0,bestLength=0,bestArg=0;
    const choose=(candidate,nextKind,length,nextArg=0)=>{
      if(candidate<best){best=candidate;bestKind=nextKind;bestLength=length;bestArg=nextArg;}
    };
    for(let length=1;length<=31&&i+length<=n;length++)choose(1+length+cost[i+length],1,length);

    let zeroRun=0;
    while(i+zeroRun<n&&src[i+zeroRun]===0&&zeroRun<257)zeroRun++;
    for(let length=2;length<=Math.min(zeroRun,32);length++)choose(1+cost[i+length],2,length);
    for(let length=33;length<=zeroRun;length++)choose(2+cost[i+length],3,length);

    let repeat=1;
    while(i+repeat<n&&src[i+repeat]===src[i]&&repeat<33)repeat++;
    for(let length=2;length<=repeat;length++)choose(2+cost[i+length],4,length,src[i]);

    let pairs=0;
    while(pairs<33&&i+2*pairs+1<n&&src[i+2*pairs]===0)pairs++;
    for(let length=2;length<=pairs;length++)choose(1+length+cost[i+2*length],5,length);

    for(let length=2;length<=matches[i];length++)choose(2+cost[i+length],6,length,matchRP[i]);
    cost[i]=best;kind[i]=bestKind;span[i]=bestLength;arg[i]=bestArg;
  }

  const out=[0,0];
  for(let i=0;i<n;){
    const entryKind=kind[i],length=span[i],entryArg=arg[i];
    if(entryKind===1){out.push(0x80|length);for(let j=0;j<length;j++)out.push(src[i+j]);i+=length;}
    else if(entryKind===2){out.push(0xE0|(length-2));i+=length;}
    else if(entryKind===3){out.push(0xFF,length-2);i+=length;}
    else if(entryKind===4){out.push(0xC0|(length-2),entryArg);i+=length;}
    else if(entryKind===5){out.push(0xA0|(length-2));for(let j=0;j<length;j++)out.push(src[i+j*2+1]);i+=length*2;}
    else if(entryKind===6){
      const encoded=(entryArg+0x3DF)&0x3FF;
      out.push((((length-2)<<2)|((encoded>>8)&3))&0x7F,encoded&0xFF);i+=length;
    }else throw new Error('Konami LZ dynamic-programming failure at '+i);
  }

  if(out.length>KONAMI_LZ_MAX_STREAM)throw new RangeError('Konami LZ stream too large');
  out[0]=out.length&0xFF;out[1]=(out.length>>8)&0xFF;
  return Uint8Array.from(out);
}

export function konamiLzRoundTrip(data){
  const raw=asBytes(data,'data');
  const compressed=konamiLzCompress(raw);
  const decoded=konamiLzDecompress(compressed).data;
  return {
    compressed,
    decoded,
    equal:decoded.length===raw.length&&decoded.every((value,index)=>value===raw[index]),
  };
}
