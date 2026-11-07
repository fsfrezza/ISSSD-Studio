import {SOUND_SLOTS} from './sound-slots.mjs';
import {terminatedBrr,soundBytes,plusSoundsWriter} from './plus-sounds.mjs';
export {SOUND_SLOTS};
function slotFor(id){const s=SOUND_SLOTS.find(s=>s.id===id);if(!s)throw Error('Som desconhecido: '+id);return s;}
export function originalSound(base,id){const s=slotFor(id);return terminatedBrr(base.slice(s.pc,s.pc+s.capacity));}
export function soundEntry(base,id,bytes){
 const original=originalSound(base,id),next=terminatedBrr(bytes,original.length);
 if(next.length!==bytes.length)throw Error('Arquivo BRR contém dados após o bloco final');
 return {source:'custom',brrBase64:btoa(Array.from(next,b=>String.fromCharCode(b)).join(''))};
}
export function selectedSound(base,id,values){const entry=values?.[id];return entry?soundBytes(entry,slotFor(id)):originalSound(base,id);}
export function applyDeluxeSounds(out,base,values){
 if(values===undefined)return out;
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Sons: seção inválida');
 for(const [id,entry]of Object.entries(values)){
  if(!entry||Object.keys(entry).some(k=>!['source','brrBase64'].includes(k))||!['custom','galvao','fb96'].includes(entry.source))throw Error('Sons: registro inválido');
  const next=soundBytes(entry,slotFor(id));
  if(next.length>originalSound(base,id).length)throw Error('Som '+id+': excede o espaço da amostra original');
 }
 return plusSoundsWriter(out,{soundsV1:{schema:'isssd-sounds-v1',values}},base);
}
// One pass through BRR blocks for an approximate audition. The game's pitch,
// interpolation, envelopes, echo and loop playback are not emulated here.
export function decodeBrrPreview(bytes){
 const stream=terminatedBrr(bytes),out=new Float32Array(stream.length/9*16);let p1=0,p2=0,cursor=0;
 for(let at=0;at<stream.length;at+=9){
  const shift=stream[at]>>4,filter=(stream[at]>>2)&3;
  for(let n=0;n<16;n++){
   const packed=stream[at+1+(n>>1)],nibble=n&1?packed&15:packed>>4;
   let s=((nibble>=8?nibble-16:nibble)<<shift)>>1;
   const half=p2>>1;
   if(filter===1)s+=(p1>>1)+((-p1)>>5);
   if(filter===2)s+=p1-half+(half>>4)+((p1*-3)>>6);
   if(filter===3)s+=p1-half+((p1*-13)>>7)+((half*3)>>4);
   s=Math.max(-32768,Math.min(32767,s));s=(s<<17)>>16;
   p2=p1;p1=s;out[cursor++]=s/32768;
  }
 }
 return out;
}

function presetSoundChoices(base,reference,source,ids=SOUND_SLOTS.map(s=>s.id)){
 const schema=source==='galvao'?'isssd-galvao-reference-v1':'isssd-brr-references-v1';
 if(reference?.schema!==schema||(source==='fb96'&&reference.source!=='FB96')||!reference.samples||typeof reference.samples!=='object')throw Error('Referência '+source+' inválida');
 const values={};
 for(const id of ids){slotFor(id);const data=reference.samples[id];if(typeof data!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw Error('Referência de áudio ausente ou inválida: '+id);
  values[id]={...soundEntry(base,id,Uint8Array.from(atob(data),c=>c.charCodeAt(0))),source};
 }
 // All entries are validated before callers change the project.
 return values;
}

export function galvaoSoundChoices(base,reference,ids){return presetSoundChoices(base,reference,'galvao',ids);}
export function fb96SoundChoices(base,reference,ids){return presetSoundChoices(base,reference,'fb96',ids);}
