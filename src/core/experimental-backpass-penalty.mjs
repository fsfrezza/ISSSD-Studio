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

// Native standing-with-ball timer starts at 48; punish after 30 visible frames.
export const BACKPASS_HANDS_DELAY_FRAMES=30;
export const BACKPASS_PENALTY_TRANSITION_FRAMES=48;
export function experimentalBackpassHooks(){
 const entry=cpu(BACKPASS_EXPERIMENT_SLOT),dispatch=entry+0x200,transition=entry+0x400,manualEntry=entry+0x600;
 const a=assembler(entry),e=(...v)=>a.emit(...v),reject=op=>a.reject(op,'normal');
 // Reproduce EB81's displaced TDC / STA $00A6 before preserving its result.
 e(0x7B,0x8F,...long(0xA6),0x08,0xC2,0x30,0x48,0xDA,0x5A);
 e(0xA5,0x30,0xC9,1,0);reject(0xD0);
 e(0xA5,0x32,0xC9,8,6);reject(0xD0); // native upright hands-holding action
 e(0xAF,...long(0x70),0xC9,8,0);reject(0xD0);
 // Keep the infracting keeper holding the ball during the whistle/fade.
 e(0xAF,...long(0xC2),0xC9,6,0);a.reject(0xD0,'eligibility');
 e(0x7B,0xCF,...long(0xC4));a.reject(0xF0,'holding');
 a.label('eligibility');
 for(const addr of [0xBA,0xBC,0xC0]){e(0xAF,...long(addr));reject(0xD0);}
 e(0xAF,...long(0x11FA),0x29,0x40,0);reject(0xF0); // native hands-possession flag
 e(0xAF,...long(0x12F4),0xC9,0x0E,0);reject(0xD0); // capture, not foot control
 e(0x7B,0xCF,...long(0xC8));reject(0xD0); // this keeper owns the ball
 // Native 85:F8D6 retained the preceding toucher in 12A0 before replacing C8.
 e(0xAF,...long(0x12A0),0xAA,0xE0,0,5);reject(0x90);
 e(0xE0,0,0x1B);reject(0xB0);
 e(0x8A,0x29,0xFF,0);reject(0xD0);
 e(0x7B,0xCF,...long(0x12A0));reject(0xF0);
 e(0xBF,...long(0x9A),0xC5,0x9A);reject(0xD0);
 // BB95 retained incoming ball action in player+78. Native BA4A uses bit 8
 // of DATA_81DB1E to distinguish a restricted teammate kick from legal headers.
 e(0xA5,0x78,0xC9,0x21,0);reject(0xB0);
 e(0xAA,0xBF,...long(0x81DB1E),0x29,8,0);reject(0xF0);
 // Hold the normal standing animation, skipping kick/throw/turn input for this
 // short interval. The native EB92 decrements the timer once per gameplay tick.
 e(0xA5,0x70,0xC9,...word(49-BACKPASS_HANDS_DELAY_FRAMES));a.reject(0xB0,'wait');
 e(0x7B,0x8F,...long(0xC4),0xA5,0x88,0xAA,0xBF,...long(0xD4),0x8F,...long(0xC6));
 e(0xA9,...word(BACKPASS_EXPERIMENT_EVENT),0x8F,...long(0xBA));
 a.label('wait');e(0x7A,0xFA,0x68,0x28,0x5C,...long(0x84EB92));
 a.label('holding');e(0x7A,0xFA,0x68,0x28,0x5C,...long(0x84EB76));
 a.label('normal');e(0x7A,0xFA,0x68,0x28,0x5C,...long(0x84EB85));
 const hands=a.finish();if(hands.length>0x200)throw Error('Hands hook exceeds slot');
 const b=assembler(dispatch),f=(...v)=>b.emit(...v);
 f(0x22,...long(0x80D38E),0xAF,...long(0xBC),0xC9,...word(BACKPASS_EXPERIMENT_EVENT));
 b.reject(0xD0,'normal');
 f(0xA9,3,0,0x8F,...long(0xBA),0x8F,...long(0xBC),0xA9,0,0,0x8F,...long(0x12DE));
 f(0xAF,...long(0xC4),0xAA,0xBF,...long(0x88),0xAA,0xBF,...long(0xA4),0x09,0x80,0,0x9F,...long(0xA4));
 f(0xAF,...long(0xC4),0xAA,0xBF,...long(0x9A),0xAA,0xBF,...long(0xA4),0x29,0x7F,0xFF,0x9F,...long(0xA4));
 // Preserve the native penalty loader and its outer DD27 transition postlude.
 f(0x22,...long(0xA4DE9F),0xA9,...word(BACKPASS_PENALTY_TRANSITION_FRAMES),0x8F,...long(0xE6),0x6B);
 b.label('normal');f(0x5C,...long(0xA4DC03));
 const restart=b.finish();
 const c=assembler(transition),g=(...v)=>c.emit(...v);
 // DAC0 is reached only after the field fade. Keep the display blank during
 // penalty screen preparation. NMI must stay enabled: gameplay itself runs
 // inside the NMI handler. Native 808217 restores brightness at destination.
 g(0x08,0xAF,...long(0xC2),0xC9,6,0);c.reject(0xD0,'original');
 g(0xA9,0x80,0,0x8F,...long(0x1EA0),0xE2,0x20,0xA9,0x80,0x8F,...long(0x2100),0xC2,0x20);
 c.label('original');g(0x28,0xA9,0xFF,0xFF,0x8F,...long(0x1E6C),0x5C,...long(0xA4DAC6));
 const blank=c.finish();
 // Manual diving catch uses player+78 as a distance before contact. Record
 // the incoming action only after 85:EE94 has confirmed capture, before the
 // native call replaces 12F4. BB95 already does this for ordinary catches.
 const manual=Uint8Array.from([0x08,0x48,0xAF,...long(0x12F4),0x85,0x78,0x68,0x28,0xA2,0x0E,0,0x22,...long(0x85F8B9),0x5C,...long(0x85EE9B)]);
 const slot=new Uint8Array(0x800).fill(255);slot.set(hands);slot.set(restart,0x200);slot.set(blank,0x400);slot.set(manual,0x600);
 return {entry,dispatch,transition,manualEntry,hands,restart,blank,manual,writes:[
  [BACKPASS_EXPERIMENT_SLOT,slot],
  [offset(0x84EB81),Uint8Array.from([0x5C,...long(entry)])],
  [offset(0xA4DBFF),Uint8Array.from([0x5C,...long(dispatch)])],
  [offset(0x85EE94),Uint8Array.from([0x5C,...long(manualEntry),0xEA,0xEA,0xEA])],
  [offset(0xA4DAC0),Uint8Array.from([0x5C,...long(transition),0xEA,0xEA])],
 ]};
}

const signatures=[
 [0x85EE94,[0xA2,0x0E,0,0x22,0xB9,0xF8,0x85]],
 [0x84EB81,[0x7B,0x8D,0xA6,0,0x20,0x60,0xE9]],
 [0xA4DAC0,[0xA9,0xFF,0xFF,0x8D,0x6C,0x1E,0x8D,0x6E,0x1E]],
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
