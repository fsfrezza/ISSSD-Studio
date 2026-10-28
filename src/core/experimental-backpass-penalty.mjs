// Isolated experiment. Not wired into the editor's validated export pipeline.
// Source: Yoshifanatic ISSD disassembly, Routine_Macros_ISSD.asm.
export const BACKPASS_EXPERIMENT_SLOT=0x3FF000;
export const BACKPASS_EXPERIMENT_EVENT=0x7F01;
const cpu=off=>0x808000|((off>>15)<<16)|(off&0x7FFF);
const offset=addr=>((addr>>16)&0x7F)*0x8000+(addr&0x7FFF);
const long=n=>[n&255,n>>8&255,n>>16&255];
const word=n=>[n&255,n>>8&255];
const inverse={0xD0:0xF0,0xF0:0xD0,0x90:0xB0,0xB0:0x90};
function assembler(start){
 const bytes=[],labels={},fixups=[];
 return {bytes,emit(...v){bytes.push(...v);},label(name){labels[name]=bytes.length;},
  reject(op,label){bytes.push(inverse[op],3,0x82,0,0);fixups.push({at:bytes.length-2,label});},
  finish(){for(const {at,label} of fixups){if(labels[label]===undefined)throw Error('Missing label '+label);const d=labels[label]-at-2;if(d< -32768||d>32767)throw Error('Branch overflow');bytes[at]=d&255;bytes[at+1]=d>>8&255;}return Uint8Array.from(bytes);},start};
}

export function experimentalBackpassHooks(){
 const entry=cpu(BACKPASS_EXPERIMENT_SLOT),captureEntry=entry+0x200,dispatch=entry+0x400;
 function makeContact(capture=false){
 const a=assembler(entry),e=(...v)=>a.emit(...v),reject=op=>a.reject(op,'normal');
 // Native contact has D=player, M=X=16. Preserve all caller registers/flags.
 e(0x08,0xC2,0x30,0x48,0xDA,0x5A);
 e(0xA5,0x30,0xC9,1,0);reject(0xD0); // player role: goalkeeper
 e(0xAF,...long(0x70),0xC9,8,0);reject(0xD0); // match mode
 for(const addr of [0xBA,0xBC,0xC0]){e(0xAF,...long(addr));reject(0xD0);}
 e(0xAF,...long(0xC8),0xAA,0xE0,0,5);reject(0x90);
 e(0xE0,0,0x1B);reject(0xB0);
 e(0x8A,0x29,0xFF,0);reject(0xD0); // valid player object boundary
 e(0x7B,0xCF,...long(0xC8));reject(0xF0); // exclude keeper's own release
 e(0xBF,...long(0x9A),0xC5,0x9A);reject(0xD0); // previous toucher's team
 // C4 is offender, C6 supplies the opposing team to the native penalty loader.
 // Team+D4 is first outfield object (not goalkeeper). No scratch WRAM allocated.
 e(0x7B,0x8F,...long(0xC4),0xA5,0x88,0xAA,0xBF,...long(0xD4),0x8F,...long(0xC6));
 e(0xA9,...word(BACKPASS_EXPERIMENT_EVENT),0x8F,...long(0xBA));
 if(!capture)e(0x7A,0xFA,0x68,0x28,0x5C,...long(0x84B9EB)); // abort contact via native RTS
 a.label('normal');
 e(0x7A,0xFA,0x68,0x28);
 if(capture)e(0x9C,0xCA,0x17,0x9C,0xAE,0,0x5C,...long(0x85F8CB));
 else e(0x22,...long(0x85F91D),0x5C,...long(0x84BA05));
 const contact=a.finish();
 if(contact.length>0x200)throw Error('Contact hook exceeds slot');
 return contact;
 }
 const contact=makeContact(),capture=makeContact(true);
 const b=assembler(dispatch),f=(...v)=>b.emit(...v);
 // Preserve the original restart setup before examining our private event.
 f(0x22,...long(0x80D38E),0xAF,...long(0xBC),0xC9,...word(BACKPASS_EXPERIMENT_EVENT));
 b.reject(0xD0,'normal');
 f(0xA9,3,0,0x8F,...long(0xBA),0x8F,...long(0xBC),0xA9,0,0,0x8F,...long(0x12DE));
 // Same team-possession updates as native A4:E04C/E052, with explicit addresses.
 f(0xAF,...long(0xC4),0xAA,0xBF,...long(0x88),0xAA,0xBF,...long(0xA4),0x09,0x80,0,0x9F,...long(0xA4));
 f(0xAF,...long(0xC4),0xAA,0xBF,...long(0x9A),0xAA,0xBF,...long(0xA4),0x29,0x7F,0xFF,0x9F,...long(0xA4));
 // Native code chooses kicker, updates statistics, spots ball, sets C0/C2=6.
 // A4:DD11 normally resumes after DD45 and sets E6=0100 at DD27.
 // Reproduce that postlude so the native transition relocates ball and players.
 f(0x22,...long(0xA4DE9F),0xA9,0,1,0x8F,...long(0xE6),0x6B);
 b.label('normal');f(0x5C,...long(0xA4DC03));
 const restart=b.finish();
 const slot=new Uint8Array(0x600).fill(255);slot.set(contact);slot.set(capture,0x200);slot.set(restart,0x400);
 return {entry,captureEntry,dispatch,contact,capture,restart,writes:[[BACKPASS_EXPERIMENT_SLOT,slot],[offset(0x84BA01),Uint8Array.from([0x5C,...long(entry)])],[offset(0x85F8C5),Uint8Array.from([0x5C,...long(captureEntry),0xEA,0xEA])],[offset(0xA4DBFF),Uint8Array.from([0x5C,...long(dispatch)])]]};
}

const signatures=[
 [0x85F8C5,[0x9C,0xCA,0x17,0x9C,0xAE,0,0x8E,0,0,0x8E,0xF4,0x12]],
 [0x84BA01,[0x22,0x1D,0xF9,0x85,0x22,0xE0,0xEB,0x83]],
 [0xA4DBFF,[0x22,0x8E,0xD3,0x80,0xA5,0xBC,0x0A,0xAA,0x7C,0x08,0xDC]],
 [0xA4DE9F,[0xA5,0x70,0xC9,0x19,0,0xF0,4,0x22,0xE6,0xD8,0x86,0xA5,0xC6]],
 [0xA4DEEE,[0x8D,0xF0,0x11,0xAD,0xD8,0x12,0x8D,0xF2,0x11,0xA9,6,0,0x4C,0xA6,0xDC]],
];
export function buildExperimentalBackpassPenalty(base){
 if(base.length!==0x200000)throw Error('Experimento exige ROM Plus limpa de 2 MiB sem header');
 for(const [addr,expected] of signatures)if(expected.some((v,i)=>base[offset(addr)+i]!==v))throw Error('Rotina nativa divergente em '+addr.toString(16));
 const rom=new Uint8Array(0x400000).fill(255);rom.set(base);
 for(const [at,bytes] of experimentalBackpassHooks().writes)rom.set(bytes,at);
 rom[0x7FD7]=0x0C;
 rom.set([255,255,0,0],0x7FDC);
 const sum=rom.reduce((n,v)=>(n+v)&65535,0);rom.set([...word(sum^65535),...word(sum)],0x7FDC);
 return rom;
}
