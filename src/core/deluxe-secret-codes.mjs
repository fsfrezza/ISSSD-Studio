// All title cheats share input, but never share progress or clear rewards.
// Native dog/teams/skills flags: $7ED854/$56/$58. $D85A..$5F are the
// original three matcher words; $D862 is reserved for golden ball.
const w=n=>[n&255,n>>>8&255],l=n=>[...w(n),n>>>16&255];
const cpu=pc=>0x808000+pc;
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){this.put(op);this.refs.push([this.b.length,n]);return this.put(0);}finish(){for(const [i,n]of this.refs){const d=this.labels[n]-i-1;if(!Number.isInteger(d)||d< -128||d>127)throw Error('Código secreto: salto inválido');this.b[i]=d&255;}return Uint8Array.from(this.b);}}
export const SECRET_CODE_SEQUENCES=Object.freeze({dog:[0x800,0x800,0x400,0x400,0x200,0x100,0x200,0x100,0x8000,0x80],teams:[0x10,0x800,0x400,0x20,0x40,0x8000,0x200,0x80,0x100,0x4000],skills:[0x8000,0x80,0x40,0x4000],ball:[0x8000,0x80,0x20,0x20]});
const lanes=[['dog',0x7ed85a,0x7c00,0x7e00],['teams',0x7ed85c,0x7c80,0x7e20],['skills',0x7ed85e,0x7d00,0x7e40],['ball',0x7ed862,0x7d80,0x7e60]];
function matcher(name,state,table,teamDog){
 const seq=SECRET_CODE_SEQUENCES[name],bytes=seq.length*2,c=new Code();
 // A=pressed edge; Y holds it across the comparisons and sound calls.
 if(name==='skills')c.put(0xaf,...l(0x7ed854),0x0f,...l(0x7ed856)).branch(0xf0,'done');
 c.put(0xaf,...l(state),0xc9,...w(bytes)).branch(0xb0,'done').put(0xaa,0x98,0xdf,...l(cpu(table))).branch(0xd0,'miss');
 c.put(0xe8,0xe8,0x8a,0x8f,...l(state),0xc9,...w(bytes)).branch(0xd0,'done');
 if(name!=='ball'){
  c.put(0xa9,0,0,0x8f,...l(state),0xa9,1,0);
  for(const flag of name==='dog'?[0x7ed854]:name==='teams'?(teamDog?[0x7ed854,0x7ed856]:[0x7ed856]):[0x7ed858])c.put(0x8f,...l(flag));
 }
 // Both native audio routines may clobber X or Y; restore input for the next lane.
 c.put(0x5a,0x8b,0x22,...l(name==='dog'||name==='teams'?0x86ddc6:0x86ddcb),0x22,...l(0x86d4b9),0xab,0x7a).branch(0x80,'done');
 c.label('miss').put(0x98,0xc9,...w(seq[0])).branch(0xf0,'restart').put(0xa9,0,0).branch(0x80,'store').label('restart').put(0xa9,2,0).label('store').put(0x8f,...l(state)).label('done').put(0x6b);
 return c.finish();
}
export function applyIndependentSecretCodes({hook,helper},ids){
 const golden=ids.includes('golden-ball-code'),enabled=lanes.filter(([name])=>name!=='ball'||golden);
 // Always enable the native codes; team code also grants dog, and Skills
 // requires either of the native unlocks, not an immediately adjacent suffix.
 const entry=new Code().put(0x08,0xc2,0x30,0x48,0xda,0x5a,0x8b,0xa5,0x28,0x05,0x2a).branch(0xf0,'end').put(0xa8);
 for(const [, ,at]of enabled)entry.put(0x22,...l(cpu(at)));
 entry.label('end').put(0xab,0x7a,0xfa,0x68,0x28,0x6b);
 hook(0x4c2,[0x22,0x0d,0xf5,0x80],[0x22,0,0xfa,0x80]);helper(0x7a00,entry.finish());
 const init=new Code().put(0x48,0xa9,0,0);for(const [,state]of lanes.slice(0,3))init.put(0x8f,...l(state));
 if(golden)init.put(0xaf,...l(0x7ed862),0xc9,8,0).branch(0xf0,'end').put(0xa9,0,0,0x8f,...l(0x7ed862));
 init.label('end').put(0x68,0x6b);hook(0x4b5,[0x22,0xfa,0xf4,0x80],[0x22,0x40,0xfb,0x80]);helper(0x7b40,init.finish());
 for(const [name,state,at,table]of enabled){const code=matcher(name,state,table,true);if(code.length>0x80)throw Error('Código secreto: reserva excedida');helper(at,code);helper(table,Uint8Array.from(SECRET_CODE_SEQUENCES[name].flatMap(w)));}
}
