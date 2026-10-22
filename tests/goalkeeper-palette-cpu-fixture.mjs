import assert from'node:assert/strict';
const pc=v=>((v>>>16)&127)*32768+(v&32767),cpu=v=>((128+(v>>>15))<<16)|32768|(v&32767);
export function executeKeeperPalette(rom,start,{x=60,y=0xFD14,a=0x30,p=1,d=0,wram=new Uint8Array(65536),callerD=null,skin=false}={}){
 let at=cpu(start),db=0x81,stack=callerD===null?[]:[callerD>>8&255,callerD&255,0x98,0xF9,0],initial=stack.length,steps=0;const original={x,y,a,db,p};
 const read8=v=>(v>>>16)===0x7E?wram[v&65535]:rom[pc(v)],read16=v=>read8(v)|read8(v+1)<<8,n8=()=>read8(at++),n16=()=>n8()|n8()<<8,n24=()=>n16()|n8()<<16;
 const nz=v=>p=p&~130|(v===0?2:0)|(v&32768?128:0),push=v=>stack.push(v>>>8&255,v&255),pop=()=>stack.pop()|stack.pop()<<8,cmp=(v,k)=>{p=p&~1|(v>=k?1:0);nz(v-k&65535);},adc=v=>{const sum=a+v+(p&1);a=sum&65535;p=p&~1|(sum>65535?1:0);nz(a);};
 while(steps++<200){const op=n8();switch(op){
 case 0x8B:stack.push(db);break;case 0xAB:db=stack.pop();break;case 0xDA:push(x);break;case 0x5A:push(y);break;case 0x08:stack.push(p);break;case 0x48:push(a);break;
 case 0xD8:p&=~8;break;case 0xB8:p&=~64;break;case 0x18:p&=~1;break;case 0x28:p=stack.pop();break;case 0x68:a=pop();nz(a);break;case 0xFA:x=pop();nz(x);break;case 0x7A:y=pop();nz(y);break;
 case 0xAA:x=a;nz(x);break;case 0xA3:{const s=n8();a=stack.at(-s)|stack.at(-s-1)<<8;nz(a);break;}
 case 0xBF:a=read16(n24()+x);nz(a);break;case 0xAF:a=read16(n24());nz(a);break;case 0x29:a&=n16();nz(a);break;case 0xC9:cmp(a,n16());break;case 0xA9:a=n16();nz(a);break;case 0x69:adc(n16());break;
 case 0x63:{const s=n8();adc(stack.at(-s)|stack.at(-s-1)<<8);break;}
 case 0x0A:p=p&~1|a>>>15;a=a<<1&65535;nz(a);break;
 case 0xD0:case 0xF0:case 0x90:case 0xB0:{const r=n8(),take=op===0xD0&&!(p&2)||op===0xF0&&(p&2)||op===0x90&&!(p&1)||op===0xB0&&(p&1);if(take)at+=r<128?r:r-256;break;}
 case 0x82:{const r=n16();at+=r<32768?r:r-65536;break;}
 case 0x54:{const dest=n8(),source=n8(),count=a+1;assert.equal(dest,0x7E);assert.equal(count,22);for(let i=0;i<count;i++)wram[(y+i)&65535]=read8(source<<16|x+i&65535);x=x+count&65535;y=y+count&65535;a=65535;db=dest;break;}
 case 0x5C:{const target=n24();assert.equal(target,skin?0x8BD110:0x8BD0EF);assert.equal(stack.length,initial);assert.equal(x,original.x);assert.equal(y,original.y);assert.equal(db,original.db);assert.equal(a,original.a);return{native:true};}
 case 0x6B:assert.equal(stack.length,initial);assert.equal(x,original.x);assert.equal(y,original.y);assert.equal(db,original.db);if(skin){assert.equal(p&73,original.p&73);assert.equal(a,original.a);}else{assert.equal(p&73,0);assert.equal(a,65535);}return{native:false};
 default:throw Error('Unsupported opcode '+op.toString(16)+' at '+(at-1).toString(16));
 }}throw Error('Palette helper did not return');
}
