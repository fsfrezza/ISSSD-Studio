// Battery-backed native password. SRAM 70:1000..1043 is separate from the
// backpass workspace at 70:1800. A signature and checksum reject empty/torn data.
export const PASSWORD_SAVE_PC=0x34e00,PASSWORD_LOAD_PC=0x34f00;
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...v){this.b.push(...v);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){this.put(op);this.refs.push([this.b.length,n]);this.put(0);return this;}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-1;if(d< -128||d>127)throw Error('Battery branch');this.b[at]=d&255;}return Uint8Array.from(this.b);}}
const preserve=c=>c.put(0x08,0xc2,0x30,0x48,0xda,0x5a,0x8b,0xd8),restore=c=>c.put(0xab,0x7a,0xfa,0x68,0x28,0x6b);
function checksum(c){c.put(0xa9,0,0,0xa2,0,0).label('sum').put(0x18,0x7f,8,0x10,0x70,0xe8,0xe8,0xe0,60,0).branch(0x90,'sum');}
export function passwordSaveHelper(){const c=new Code();c.put(0x22,0x64,0xcb,0x86);preserve(c);
 c.put(0xa9,0,0,0x8f,0,0x10,0x70,0xa9,59,0,0xa2,0xd0,0xe2,0xa0,8,0x10,0x54,0x70,0x7e);
 checksum(c);c.put(0x8f,4,0x10,0x70,0xa9,1,0,0x8f,6,0x10,0x70,0xa9,0x53,0x44,0x8f,2,0x10,0x70,0xa9,0x49,0x53,0x8f,0,0x10,0x70);restore(c);return c.finish();}
export function passwordLoadHelper(){const c=new Code();c.put(0x22,0xfe,0xca,0x86);preserve(c);
 for(const[at,value]of[[0,0x5349],[2,0x4453],[6,1]])c.put(0xaf,at,0x10,0x70,0xc9,value&255,value>>8).branch(0xd0,'done');
 checksum(c);c.put(0xcf,4,0x10,0x70).branch(0xd0,'done');
 c.put(0xa9,59,0,0xa2,8,0x10,0xa0,0xd0,0xe2,0x54,0x7e,0x70).label('done');restore(c);return c.finish();}
export function applyDeluxePasswordSave(input,base){const out=input.slice();
 for(const[at,expected,bytes]of[[0x57205,[0x22,0x64,0xcb,0x86],[0x22,0,0xce,0x86]],[0x5699b,[0x22,0xfe,0xca,0x86],[0x22,0,0xcf,0x86]]]){
  if(expected.some((v,i)=>base[at+i]!==v||out[at+i]!==v))throw Error('Bateria: rotina de password incompatível');out.set(bytes,at);
 }
 for(const[at,bytes]of[[PASSWORD_SAVE_PC,passwordSaveHelper()],[PASSWORD_LOAD_PC,passwordLoadHelper()]]){if(out.slice(at,at+bytes.length).some(v=>v!==255))throw Error('Bateria: reserva ocupada');out.set(bytes,at);}
 if(base[0x7fd6]!==0||base[0x7fd8]!==0)throw Error('Bateria: cabeçalho Deluxe incompatível');
 out[0x7fd6]=2;out[0x7fd8]=Math.max(out[0x7fd8],3);return out;
}
