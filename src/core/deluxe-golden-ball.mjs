// Native title matcher uses $7ED85A..5F; $7ED862 is the unused word
// between the existing $D860 word and the $D864..8B tables.
// State 0/2/4/6 = next button, 8 = unlocked until title reinitializes.
const word=n=>[n&255,n>>8&255];
const long=n=>[...word(n),n>>16&255];
const state=0x7ed862;
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){this.put(op);this.refs.push([this.b.length,n]);return this.put(0);}finish(){for(const [i,n] of this.refs){const d=this.labels[n]-i-1;if(!Number.isInteger(d)||d< -128||d>127)throw Error('Golden ball: invalid branch');this.b[i]=d&255;}return Uint8Array.from(this.b);}}

export const GOLDEN_BALL_BUTTONS=Uint8Array.from([0x8000,0x0080,0x0020,0x0020].flatMap(word));
export const GOLDEN_BALL_INIT=Uint8Array.of(0x48,0xa9,0,0,0x8f,...long(state),0x68,0x5c,0xfa,0xf4,0x80);
// Called from the existing combined-controller adapter, then tail-call the
// original three-code detector. No modification to its state or flags.
export const GOLDEN_BALL_MATCHER=new Code().put(0x08,0x48,0xda,0xa5,0x2a).branch(0xf0,'done')
 .put(0xaf,...long(state),0xc9,8,0).branch(0xb0,'done').put(0xaa,0xa5,0x2a,0xdf,...long(0x80fb00)).branch(0xd0,'miss')
 .put(0xe8,0xe8,0x8a,0x8f,...long(state)).branch(0x80,'done')
 .label('miss').put(0xc9,0,0x80).branch(0xf0,'restart').put(0xa9,0,0).branch(0x80,'store')
 .label('restart').put(0xa9,2,0).label('store').put(0x8f,...long(state))
 .label('done').put(0xfa,0x68,0x28,0x5c,0x0d,0xf5,0x80).finish();

// Native palette loader at $80:A99E reads the source pointer from the script.
// Substitute only the known $89:95F8 source on the two native ball scripts.
// Keep the original data bank and the native copy length/target unchanged.
export const GOLDEN_BALL_PALETTE_SELECTOR=new Code().put(0xb9,1,0,0xaa,0xe0,0xf8,0x95).branch(0xd0,'done')
 .put(0xc0,0x82,0x8b).branch(0xf0,'check').put(0xc0,0x94,0x90).branch(0xd0,'done')
 .label('check').put(0xaf,...long(state),0xc9,8,0).branch(0xd0,'done').put(0xa2,0x80,0xfa)
 .label('done').put(0x8a,0x6b).finish();

export function goldenBallPalette(base){
 const data=base.slice(0x495f8,0x49614);
 // Preserve header, the two flag colors, and the final blue/red entries.
 // Nine native ball luminance levels become dark bronze through pale gold.
 const shades=[[8,4,1],[12,7,1],[15,9,2],[19,12,2],[23,16,3],[26,20,5],[29,23,8],[31,27,13],[31,30,20]];
 for(let i=0;i<shades.length;i++){const [r,g,b]=shades[i],v=r|(g<<5)|(b<<10);data.set(word(v),2+(i+2)*2);}
 return data;
}

export function applyGoldenBall({base,hook,helper}){
 hook(0x4b5,[0x22,0xfa,0xf4,0x80],[0x22,0x40,0xfb,0x80]);
 helper(0x7b40,GOLDEN_BALL_INIT);
 helper(0x7ac0,GOLDEN_BALL_MATCHER);
 helper(0x7b00,GOLDEN_BALL_BUTTONS);
 hook(0x299e,[0xb9,1,0,0xaa],[0x22,0x60,0xfb,0x80]);
 helper(0x7b60,GOLDEN_BALL_PALETTE_SELECTOR);
 helper(0x4fa80,goldenBallPalette(base));
}
