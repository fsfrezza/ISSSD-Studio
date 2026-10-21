// Experimental, opt-in, one-pose proof. Never installed by the production pipeline.
import {customHairPixels} from './player-appearance.mjs';
import {encodeHairTile} from './plus-custom-hair.mjs';
export const BODY_PROOF_POSE=Object.freeze({cpu:0x968000,pc:0xB0000,record:0xA3D7,width:16,height:48,headX:4,headY:0,headHeight:7});
export const BODY_PROOF_SLOT=0x3F0000;
export const BODY_PROOF_VARIANTS=Object.freeze({14:0x3F1000,15:0x3F1200});
const cpu=pc=>((0x80+(pc>>>15))<<16)|0x8000|(pc&32767),word=v=>[v&255,v>>>8&255],long=v=>[...word(v),v>>>16&255];
export function readProofBody(rom){
 if(![0xD4,0x42,0,0x80,0x96,2,0x68,0x4E,1].every((v,i)=>rom[0x123D7+i]===v))throw Error('Corpo de prova: descritor de pose divergente.');
 const p=BODY_PROOF_POSE.pc;if(rom.length<0x200000||rom[p]!==192||rom[p+1]||rom[p+194]!==192||rom[p+195])throw Error('Corpo de prova: estrutura Plus divergente.');
 const raw=new Uint8Array(384);raw.set(rom.slice(p+2,p+194));raw.set(rom.slice(p+196,p+388),192);const pixels=new Uint8Array(16*48);
 for(let t=0;t<12;t++)for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  let v=0;for(let z=0;z<4;z++)v|=(raw[t*32+(z>>1)*16+y*2+(z&1)]>>(7-x)&1)<<z;
  const half=t>=6?1:0,j=(t%6)>>1;pixels[(j*16+half*8+y)*16+(t%2)*8+x]=v;
 }return pixels;
}
export function encodeProofBody(pixels){
 if(pixels.length!==768||Array.from(pixels).some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Corpo de prova: use 16 x 48 pixels com índices 0–15.');
 const block=new Uint8Array(388);block.set([192,0]);block.set([192,0],194);
 for(let t=0;t<12;t++){
  const half=t>=6?1:0,j=(t%6)>>1,a=new Uint8Array(64);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++)a[y*8+x]=pixels[(j*16+half*8+y)*16+t%2*8+x];
  block.set(encodeHairTile(a),(half?196:2)+(t%6)*32);
 }return block;
}
export function alignProofHead(source,base){
 if(source.length!==64||Array.from(source).some(v=>!Number.isInteger(v)||v<0||v>15)||Array.from(source.slice(48)).some(Boolean)||Array.from(source).some((v,i)=>v&&(i&7)===7))throw Error('Sobreposição desta prova excede a área da cabeça.');
 // Native Up_Running1 overlay starts at body (5,1), inside proof rectangle (4,0).
 const out=new Uint8Array(64),body=base?readProofBody(base):null;
 if(body)for(let y=0;y<7;y++)for(let x=0;x<8;x++)out[y*8+x]=body[y*16+x+4];
 for(let y=0;y<6;y++)for(let x=0;x<7;x++)if(source[y*8+x])out[(y+1)*8+x+1]=source[y*8+x];
 return out;
}
export function composeProofBody(base,head){
 if(head.length!==64||Array.from(head).some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Cabeça de prova inválida.');
 if(Array.from(head.slice(56)).some(Boolean))throw Error('A última linha pertence à nuca do corpo; mantenha-a transparente.');
 const pixels=readProofBody(base);
 // Replace the entire rectangle, including transparent pixels: old baked-in
 // hair must disappear, instead of showing through holes in an overlay.
 for(let y=0;y<7;y++)for(let x=0;x<8;x++)pixels[y*16+x+4]=head[y*8+x];
 return pixels;
}
class Code{
 constructor(){this.b=[];this.labels={};this.refs=[];}
 put(...b){this.b.push(...b);return this;}
 label(n){this.labels[n]=this.b.length;return this;}
 branch(op,n){this.refs.push([this.b.length+1,n]);return this.put(op,0);}
 finish(){for(const [at,n]of this.refs){const d=this.labels[n]-at-1;if(!Number.isInteger(d)||d< -128||d>127)throw Error('Body proof branch out of range: '+n);this.b[at]=d&255;}return Uint8Array.from(this.b);}
}
function bodyPointerHelper(bank=false){
 const c=new Code();
 c.put(0x08,0xD8,0xDA,0x5A,0xE0,...word(0xA3D7)).branch(0xD0,'fallback'); // PHP PHX PHY CPX
 c.put(0x7B,0x29,255,0).branch(0xD0,'fallback'); // only main, page-aligned player objects
 c.put(0x7B,0xC9,...word(0x0500)).branch(0x90,'fallback');
 c.put(0xC9,...word(0x1B00)).branch(0xB0,'fallback');
 c.put(0xA5,0x68,0x29,255,0,0xC9,11,0).branch(0xB0,'fallback').put(0xAA);
 c.put(0x7B,0xC9,...word(0x1000)).branch(0xB0,'team2');
 const roster=(lineup,attrs)=>{
  c.put(0xBF,...long(lineup),0x29,31,0,0xC9,20,0).branch(0xB0,'fallback');
  // index*10, keeping scratch out of the player's live direct page.
  c.put(0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0xAA,0xBF,...long(attrs),0x29,15,0);
 };
 roster(0x7E3F90,0x7E3DFC);c.branch(0x80,'select');
 c.label('team2');roster(0x7E3FA4,0x7E3EC4);
 c.label('select').put(0xC9,14,0).branch(0xF0,'bald').put(0xC9,15,0).branch(0xF0,'tuft');
 c.label('fallback').put(0x7A,0xFA,0x28,0xBF,...long(bank?0x820004:0x820002),0x6B);
 for(const [name,h]of [['bald',14],['tuft',15]]){const address=cpu(BODY_PROOF_VARIANTS[h]);c.label(name).put(0x7A,0xFA,0x28,0xA9,...word(bank?address>>>16:address&65535),0x6B);}
 return c.finish();
}
function skipCustomOverlayHelper(){
 const c=new Code();c.put(0x08,0xBD,6,0,0x29,15,0,0xC9,14,0).branch(0x90,'native');
 c.put(0x28,0xA9,0,0,0x6B).label('native').put(0x28,0xBD,6,0,0x29,15,0,0x6B);return c.finish();
}
export function proofBodyWrites(base,{heads={}}={}){
 readProofBody(base);
 const data=[];for(const h of [14,15])data.push({pc:BODY_PROOF_VARIANTS[h],data:encodeProofBody(composeProofBody(base,heads[h]??alignProofHead(customHairPixels(base,h,0),base)))});
 for(const [pc,bytes]of [[BODY_PROOF_SLOT,bodyPointerHelper()],[BODY_PROOF_SLOT+0x200,bodyPointerHelper(true)],[BODY_PROOF_SLOT+0x400,skipCustomOverlayHelper()]])data.push({pc,data:bytes});
 const hooks=[{pc:0x266FB,original:[0xBF,2,0,0x82],target:BODY_PROOF_SLOT},{pc:0x26706,original:[0xBF,4,0,0x82],target:BODY_PROOF_SLOT+0x200},... [0x1C930,0x1CAFE].map(pc=>({pc,original:[0xBD,6,0,0x29,15,0],target:BODY_PROOF_SLOT+0x400}))];
 for(const h of hooks){if(!h.original.every((v,i)=>base[h.pc+i]===v))throw Error('Corpo de prova: leitor nativo divergente em '+h.pc.toString(16));data.push({pc:h.pc,data:Uint8Array.from([0x22,...long(cpu(h.target)),...Array(h.original.length-4).fill(0xEA)])});}
 return data;
}
export function installBodyCompositionProof(rom,base,options={}){
 if(rom.length!==0x400000)throw Error('Corpo de prova exige 4 MB.');const writes=proofBodyWrites(base,options);
 // Validate ALL destinations and displaced instructions before any mutation.
 for(const w of writes){const same=w.data.every((v,i)=>rom[w.pc+i]===v);if(w.pc>=BODY_PROOF_SLOT){if(!same&&!rom.slice(w.pc,w.pc+w.data.length).every(v=>v===255))throw Error('Corpo de prova: espaço expandido ocupado.');}else if(!same&&!rom.slice(w.pc,w.pc+w.data.length).every((v,i)=>v===base[w.pc+i]))throw Error('Corpo de prova: hook já alterado.');}
 for(const w of writes)rom.set(w.data,w.pc);return rom;
}
