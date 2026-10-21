import assert from 'node:assert/strict';
const pc=v=>((v>>>16)&127)*32768+(v&32767),cpu=v=>((128+(v>>>15))<<16)|32768|(v&32767);
export function execute(rom,start,{d=0x500,x=0xA3D7,y=0x120,a=0xBBCC,p=1,wram=new Uint8Array(65536)}={}){
 let at=cpu(start),stack=[],steps=0;const init={x,y,p};const read8=v=>(v>>>16)===0x7E?wram[v&65535]:rom[pc(v)],read16=v=>read8(v)|read8(v+1)<<8;
 const next8=()=>read8(at++),next16=()=>next8()|next8()<<8,next24=()=>next16()|next8()<<16,nz=v=>{p=(p&~130)|(v===0?2:0)|(v&32768?128:0);},push16=v=>{stack.push(v>>>8&255,v&255);},pop16=()=>stack.pop()|stack.pop()<<8,cmp=(v,k)=>{p=(p&~1)|(v>=k?1:0);nz((v-k)&65535);};
 while(steps++<250){const op=next8();switch(op){
 case 0x08:stack.push(p);break;case 0xD8:p&=~8;break;case 0x28:p=stack.pop();break;
 case 0xDA:push16(x);break;case 0x5A:push16(y);break;case 0x48:push16(a);break;
 case 0xFA:x=pop16();nz(x);break;case 0x7A:y=pop16();nz(y);break;
 case 0xE0:cmp(x,next16());break;case 0xC9:cmp(a,next16());break;
 case 0xD0:case 0xF0:case 0x90:case 0xB0:case 0x80:{const r=next8(),take=op===0x80||op===0xD0&&!(p&2)||op===0xF0&&(p&2)||op===0x90&&!(p&1)||op===0xB0&&(p&1);if(take)at+=r<128?r:r-256;break;}
 case 0x82:{const v=next16();at+=v<32768?v:v-65536;break;}
 case 0x7B:a=d;nz(a);break;case 0x29:a&=next16();nz(a);break;
 case 0xA5:a=read16(0x7E0000|d+next8());nz(a);break;case 0xA9:a=next16();nz(a);break;
 case 0xAA:x=a;nz(x);break;case 0xBF:a=read16(next24()+x);nz(a);break;
 case 0xBD:a=read16(0x7E0000|(next16()+x)&65535);nz(a);break;
 case 0x0A:p=(p&~1)|(a>>>15);a=a<<1&65535;nz(a);break;case 0x18:p&=~1;break;
 case 0x63:{const s=next8(),v=stack.at(-s)|stack.at(-s-1)<<8,sum=a+v+(p&1);a=sum&65535;p=(p&~1)|(sum>65535?1:0);nz(a);break;}
 case 0x6B:assert.equal(stack.length,0);assert.equal(x,init.x);assert.equal(y,init.y);assert.equal(p&125,init.p&125);return a;
 default:throw Error('Unsupported opcode '+op.toString(16)+' at '+(at-1).toString(16));
 }}throw Error('Helper did not return');
}
