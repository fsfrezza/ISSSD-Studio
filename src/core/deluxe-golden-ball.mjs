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
 .put(0xaf,...long(state),0xc9,8,0).branch(0xb0,'done').put(0xaa,0xa5,0x2a,0xdf,...long(0x80fb20)).branch(0xd0,'miss')
 .put(0xe8,0xe8,0x8a,0x8f,...long(state),0xc9,8,0).branch(0xd0,'done')
 .put(0x5a,0x8b,0x22,...long(0x86ddcb),0x22,...long(0x86d4b9),0xab,0x7a).branch(0x80,'done')
 .label('miss').put(0xc9,0,0x80).branch(0xf0,'restart').put(0xa9,0,0).branch(0x80,'store')
 .label('restart').put(0xa9,2,0).label('store').put(0x8f,...long(state))
 .label('done').put(0xfa,0x68,0x28,0x5c,0x0d,0xf5,0x80).finish();

export function goldenBallTiles(base){
 // Existing palette index 1 is gold-yellow; index 2 is dark and 10 is
 // a pale highlight. Dither the intermediate shades without editing CGRAM.
 const data=base.slice(0xd0000,0xd0600);
 for(let t=0;t<data.length;t+=32)for(let y=0;y<8;y++)for(let x=0;x<8;x++){const mask=128>>x;let v=0;for(let p=0;p<4;p++)if(data[t+(p>>1)*16+y*2+(p&1)]&mask)v|=1<<p;const c=v<3||v>=10?v:v<=5?((x+y)%2?1:2):1;for(let p=0;p<4;p++){const i=t+(p>>1)*16+y*2+(p&1);data[i]=(data[i]&~mask)|((c&(1<<p))?mask:0);}}
 return data;
}
// At the native DMA enqueue routine, source address is already recorded in
// $7E0006,X. Redirect ONLY ball tiles to the recolored copy in bank $C9.
export const GOLDEN_BALL_DMA=new Code().put(0xc0,0,0x7a).branch(0xd0,'native').put(0xa5,0,0xc9,0x9a,0).branch(0xd0,'native').put(0xaf,...long(state),0xc9,8,0).branch(0xd0,'native').put(0xbf,6,0,0x7e,0xc9,0,0x80).branch(0x90,'native').put(0xc9,0,0x86).branch(0xb0,'native').put(0xa9,0x80,0xc9,0x6b).label('native').put(0xa5,0,0xeb,0x09,0x80,0,0x6b).finish();

export function applyGoldenBall({base,hook,helper}){
 helper(0x248000,goldenBallTiles(base));
 hook(0xe3e,[0xa5,0,0xeb,0x09,0x80,0],[0x22,0xa0,0xfb,0x80,0xea,0xea]);
 helper(0x7ba0,GOLDEN_BALL_DMA);
}
