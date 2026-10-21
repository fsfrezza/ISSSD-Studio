import test from 'node:test';import assert from 'node:assert/strict';
import {readProofBody,alignProofHead,encodeProofBody,composeProofBody,installBodyCompositionProof,proofBodyWrites,BODY_PROOF_SLOT,BODY_PROOF_VARIANTS} from '../src/core/player-body-proof.mjs';
import {expandPlusTo4MiB} from '../src/core/plus-tactics-infrastructure.mjs';
const pc=v=>((v>>>16)&127)*32768+(v&32767),cpu=v=>((128+(v>>>15))<<16)|32768|(v&32767);
function fixture(){const b=new Uint8Array(0x200000),pixels=Uint8Array.from({length:768},(_,i)=>i%16);b.set(encodeProofBody(pixels),0xB0000);b.set([0xD4,0x42,0,0x80,0x96,2,0x68,0x4E,1],0x123D7);for(const [p,v]of [[0x266FB,[0xBF,2,0,0x82]],[0x26706,[0xBF,4,0,0x82]],[0x1C930,[0xBD,6,0,0x29,15,0]],[0x1CAFE,[0xBD,6,0,0x29,15,0]]])b.set(v,p);return b;}
// Execute the emitted 65816 instructions with 16-bit A/X/Y, a byte-accurate
// stack (including PHP), WRAM DB=$7E and the live player's direct page.
function execute(rom,start,{d=0x500,x=0xA3D7,y=0x120,a=0xBBCC,p=1,wram=new Uint8Array(65536)}={}){
 let at=cpu(start),stack=[],steps=0;const init={x,y,p};const read8=v=>(v>>>16)===0x7E?wram[v&65535]:rom[pc(v)],read16=v=>read8(v)|read8(v+1)<<8;
 const next8=()=>read8(at++),next16=()=>next8()|next8()<<8,next24=()=>next16()|next8()<<16,nz=v=>{p=(p&~130)|(v===0?2:0)|(v&32768?128:0);},push16=v=>{stack.push(v>>>8&255,v&255);},pop16=()=>stack.pop()|stack.pop()<<8,cmp=(v,k)=>{p=(p&~1)|(v>=k?1:0);nz((v-k)&65535);};
 while(steps++<150){const op=next8();switch(op){
 case 0x08:stack.push(p);break;case 0xD8:p&=~8;break;case 0x28:p=stack.pop();break;
 case 0xDA:push16(x);break;case 0x5A:push16(y);break;case 0x48:push16(a);break;
 case 0xFA:x=pop16();nz(x);break;case 0x7A:y=pop16();nz(y);break;
 case 0xE0:cmp(x,next16());break;case 0xC9:cmp(a,next16());break;
 case 0xD0:case 0xF0:case 0x90:case 0xB0:case 0x80:{const r=next8(),take=op===0x80||op===0xD0&&!(p&2)||op===0xF0&&(p&2)||op===0x90&&!(p&1)||op===0xB0&&(p&1);if(take)at+=r<128?r:r-256;break;}
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
test('whole body round-trips both native DMA halves; head replacement clears old silhouette without changing uniform',()=>{
 const b=fixture(),before=b.slice(),p=readProofBody(b);assert.deepEqual(encodeProofBody(p),b.slice(0xB0000,0xB0184));
 const head=new Uint8Array(64);head[27]=3;const next=composeProofBody(b,head);
 for(let y=0;y<48;y++)for(let x=0;x<16;x++)assert.equal(next[y*16+x],y<7&&x>=4&&x<12?head[y*8+x-4]:p[y*16+x]);
 assert.deepEqual(b,before);assert.throws(()=>composeProofBody(b,Array(64).fill(16)));assert.throws(()=>encodeProofBody(Array(768).fill(-1)));
});
test('proof preflights all hooks and storage atomically and can be reinstalled identically',()=>{
 const b=fixture(),r=expandPlusTo4MiB(b);installBodyCompositionProof(r,b);const installed=r.slice();installBodyCompositionProof(r,b);assert.deepEqual(r,installed);
 for(const off of [0x266FB,BODY_PROOF_SLOT+0x200,BODY_PROOF_VARIANTS[15]+9]){const bad=expandPlusTo4MiB(b);bad[off]^=0x55;const before=bad.slice();assert.throws(()=>installBodyCompositionProof(bad,b));assert.deepEqual(bad,before);}
 const badBase=b.slice();badBase[0x1C930]=0;assert.throws(()=>proofBodyWrites(badBase));
});
test('emitted pointer helpers follow substitutions for all eleven slots on both sides without allocating special hair objects',()=>{
 const b=fixture(),r=expandPlusTo4MiB(b);installBodyCompositionProof(r,b);
 for(let side=0;side<2;side++)for(let slot=0;slot<11;slot++)for(const roster of [0,1,9,19])for(const hair of [0,1,13,14,15])for(const carry of [0,1,8,9]){
  const d=(side?0x1000:0x500)+slot*256,wram=new Uint8Array(65536);wram[d+0x68]=slot;wram[(side?0x3FA4:0x3F90)+slot]=roster;wram[(side?0x3EC4:0x3DFC)+roster*10]=0x10|hair;
  const low=execute(r,BODY_PROOF_SLOT,{d,wram,p:carry}),bank=execute(r,BODY_PROOF_SLOT+0x200,{d,wram,p:carry});
  assert.equal(low,hair>=14?cpu(BODY_PROOF_VARIANTS[hair])&65535:0x8000);assert.equal(bank,hair>=14?cpu(BODY_PROOF_VARIANTS[hair])>>>16:0x296);
 }
 const wram=new Uint8Array(65536);for(let hair=0;hair<16;hair++){wram[0x206]=0x10|hair;assert.equal(execute(r,BODY_PROOF_SLOT+0x400,{x:0x200,wram}),hair>=14?0:hair);}
});
test('pointer helper falls back for other poses, nonplayers and corrupt roster indices',()=>{
 const b=fixture(),r=expandPlusTo4MiB(b);installBodyCompositionProof(r,b);r.set([0x34,0x92,0x96,2],0x123E2);const wram=new Uint8Array(65536);
 for(const d of [0,0x400,0x6A0,0x1B00])assert.equal(execute(r,BODY_PROOF_SLOT,{d,wram}),0x8000);
 assert.equal(execute(r,BODY_PROOF_SLOT,{x:0xA3E0,wram}),0x9234);
 wram[0x568]=11;assert.equal(execute(r,BODY_PROOF_SLOT,{wram}),0x8000);wram[0x568]=0;wram[0x3F90]=20;assert.equal(execute(r,BODY_PROOF_SLOT,{wram}),0x8000);
});

test('proof aligns current native overlay at body (5,1) and preserves transparent face pixels',()=>{
 const base=fixture(),source=new Uint8Array(64);source[5*8+6]=4;
 const head=alignProofHead(source,base),before=readProofBody(base),after=composeProofBody(base,head);
 for(let y=0;y<48;y++)for(let x=0;x<16;x++)assert.equal(after[y*16+x],x===11&&y===6?4:before[y*16+x]);
 source[6*8]=3;assert.throws(()=>alignProofHead(source,base));
});
