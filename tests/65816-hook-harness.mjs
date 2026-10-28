// Small 16-bit CPU harness for executing emitted ROM hooks. It checks branch
// targets, register/flag preservation and actual WRAM writes, not JS models.
export function executeHook(memory,entry,initial={},nativeCalls=new Set()){
 const r={a:0,x:0,y:0,p:0,s:0x1FF,db:0,dp:0,...initial},calls=[];let pc=entry,depth=0,steps=0;
 const read16=a=>memory[a]|memory[a+1]<<8,write16=(a,v)=>{memory[a]=v&255;memory[a+1]=v>>8&255;};
 const byte=()=>memory[pc++],word=()=>byte()|byte()<<8,long=()=>word()|byte()<<16;
 const push=v=>{memory[r.s--]=v&255;},pop=()=>memory[++r.s],push16=v=>{push(v>>8);push(v);},pop16=()=>pop()|pop()<<8;
 const nz=v=>{r.p=(r.p&~0x82)|(v===0?2:0)|(v&0x8000?0x80:0);return v&65535;};
 const cmp=(a,b)=>{r.p=(r.p&~1)|(a>=b?1:0);nz((a-b)&65535);};
 const adc=v=>{const n=r.a+v+(r.p&1);r.p=(r.p&~1)|(n>65535?1:0);r.a=nz(n&65535);};
 const branch=take=>{const n=byte();if(take)pc+=(n&128?n-256:n);};
 while(++steps<10000){switch(byte()){
  case 0xF4:push16(word());break;case 0x08:push(r.p);break;case 0x28:r.p=pop();break;case 0xC2:r.p&=~byte();break;
  case 0x48:push16(r.a);break;case 0x68:r.a=nz(pop16());break;
  case 0xDA:push16(r.x);break;case 0xFA:r.x=nz(pop16());break;
  case 0x5A:push16(r.y);break;case 0x7A:r.y=nz(pop16());break;
  case 0x8B:push(r.db);break;case 0xAB:r.db=pop();break;
  case 0xA2:r.x=nz(word());break;case 0xA0:r.y=nz(word());break;case 0xA3:r.a=nz(read16(r.s+byte()));break;case 0x9C:write16(word(),0);break;case 0xA9:r.a=nz(word());break;case 0xAF:r.a=nz(read16(long()));break;
  case 0xBF:r.a=nz(read16(long()+r.x));break;case 0xA5:r.a=nz(read16(r.dp+byte()));break;
  case 0x85:write16(r.dp+byte(),r.a);break;case 0x8F:write16(long(),r.a);break;
  case 0x9F:write16(long()+r.x,r.a);break;case 0x7B:r.a=nz(r.dp);break;
  case 0xC5:cmp(r.a,read16(r.dp+byte()));break;
  case 0xE0:cmp(r.x,word());break;case 0xC0:cmp(r.y,word());break;case 0xC9:cmp(r.a,word());break;case 0xCF:cmp(r.a,read16(long()));break;
  case 0xD0:branch(!(r.p&2));break;case 0xF0:branch(r.p&2);break;
  case 0x90:branch(!(r.p&1));break;case 0xB0:branch(r.p&1);break;case 0x80:branch(true);break;
  case 0xE8:r.x=nz((r.x+1)&65535);break;
  case 0xBB:r.x=nz(r.y);break;case 0xAA:r.x=nz(r.a);break;case 0xA8:r.y=nz(r.a);break;
  case 0x8A:r.a=nz(r.x);break;case 0x98:r.a=nz(r.y);break;
  case 0xD8:r.p&=~8;break;case 0x38:r.p|=1;break;case 0x49:r.a=nz(r.a^word());break;case 0x29:r.a=nz(r.a&word());break;case 0xEB:r.a=nz((r.a>>8)|(r.a<<8&65535));break;case 0x0A:r.p=(r.p&~1)|(r.a>>15);r.a=nz(r.a<<1&65535);break;case 0x63:adc(read16(r.s+byte()));break;case 0xE9:adc(word()^65535);break;case 0x82:{const d=word();pc+=d&32768?d-65536:d;break;}case 0x18:r.p&=~1;break;case 0x69:adc(word());break;case 0x6F:adc(read16(long()));break;
  case 0x09:r.a=nz(r.a|word());break;case 0x05:r.a=nz(r.a|read16(r.dp+byte()));break;
  case 0x4A:r.p=(r.p&~1)|(r.a&1);r.a=nz(r.a>>1);break;
  case 0x54:{const dest=byte()<<16,source=byte()<<16,n=r.a+1;for(let i=0;i<n;i++)memory[dest+((r.y+i)&65535)]=memory[source+((r.x+i)&65535)];r.x=(r.x+n)&65535;r.y=(r.y+n)&65535;r.a=65535;r.db=dest>>16;break;}
  case 0x5C:{const target=long();if(nativeCalls.has(target)){calls.push({target,...r});return{r,calls,steps};}pc=target;break;}
  case 0x22:{const target=long();if(nativeCalls.has(target)){calls.push({target,...r});break;}push(pc>>16);push16((pc-1)&65535);depth++;pc=target;break;}
  case 0x6B:if(depth===0)return {r,calls,steps};else{pc=(pop16()+1)&65535;pc|=pop()<<16;depth--;}break;
  case 0xEA:break;
  default:throw Error('Unsupported hook opcode at '+(pc-1).toString(16));
 }}throw Error('Hook did not return');
}
