export const GAME_AUDIO_RATE=10300;
function predict(p1,p2,filter){const half=p2>>1;if(filter===1)return (p1>>1)+((-p1)>>5);if(filter===2)return p1-half+(half>>4)+((p1*-3)>>6);if(filter===3)return p1-half+((p1*-13)>>7)+((half*3)>>4);return 0;}
function sample(nibble,shift,filter,p1,p2){let s=((nibble<<shift)>>1)+predict(p1,p2,filter);s=Math.max(-32768,Math.min(32767,s));return (s<<17)>>16;}
export function prepareAudio(channels,sourceRate){
 if(!Array.isArray(channels)||!channels.length||!Number.isFinite(sourceRate)||sourceRate<=0)throw Error('Áudio inválido');
 const count=channels[0].length;if(!count||channels.some(c=>c.length!==count))throw Error('Canais de áudio inválidos');
 const mono=new Float32Array(count);for(const c of channels)for(let i=0;i<count;i++){if(!Number.isFinite(c[i]))throw Error('Amostra de áudio inválida');mono[i]+=c[i]/channels.length;}
 let first=0,last=count-1;while(first<count&&Math.abs(mono[first])<0.006)first++;while(last>first&&Math.abs(mono[last])<0.006)last--;
 if(first===count)throw Error('O arquivo contém apenas silêncio');
 const pad=Math.ceil(sourceRate*0.01);first=Math.max(0,first-pad);last=Math.min(count-1,last+pad);
 let peak=0;for(let i=first;i<=last;i++)peak=Math.max(peak,Math.abs(mono[i]));
 const length=Math.max(1,Math.round((last-first+1)*GAME_AUDIO_RATE/sourceRate)),out=new Float32Array(length),gain=0.9/peak;
 for(let i=0;i<length;i++){const at=first+i*sourceRate/GAME_AUDIO_RATE,a=Math.min(last,Math.floor(at)),b=Math.min(last,a+1),f=at-Math.floor(at);out[i]=(mono[a]*(1-f)+mono[b]*f)*gain;}
 return {samples:out,duration:length/GAME_AUDIO_RATE,originalDuration:count/sourceRate};
}
export function encodeBrr(samples,capacity){
 if(!(samples instanceof Float32Array)||!samples.length||samples.some(s=>!Number.isFinite(s)))throw Error('PCM inválido');
 const blocks=Math.ceil(samples.length/16),size=blocks*9;
 if(size>capacity)throw Error('Áudio longo demais: precisa de '+size+' bytes; limite de '+capacity+'. Encurte o áudio. A fala não será acelerada.');
 const out=new Uint8Array(size);let p1=0,p2=0;
 for(let block=0;block<blocks;block++){
  let best=null;
  for(let filter=0;filter<4;filter++)for(let shift=0;shift<=12;shift++){
   let a=p1,b=p2,error=0;const nibbles=[];
   for(let i=0;i<16;i++){
    const target=Math.round(Math.max(-1,Math.min(1,samples[block*16+i]??0))*32767),estimated=Math.round((target/2-predict(a,b,filter))*2/(1<<shift));
    let chosen=0,decoded=0,score=Infinity;
    for(let d=-1;d<=1;d++){const nibble=Math.max(-8,Math.min(7,estimated+d)),value=sample(nibble,shift,filter,a,b),diff=(target-value)**2;if(diff<score){score=diff;chosen=nibble;decoded=value;}}
    error+=score;nibbles.push(chosen&15);b=a;a=decoded;
   }
   if(!best||error<best.error)best={filter,shift,error,nibbles,p1:a,p2:b};
  }
  const at=block*9;out[at]=(best.shift<<4)|(best.filter<<2)|(block===blocks-1?1:0);
  for(let i=0;i<8;i++)out[at+i+1]=(best.nibbles[i*2]<<4)|best.nibbles[i*2+1];p1=best.p1;p2=best.p2;
 }
 return out;
}
export function pcmToWav(samples,rate=GAME_AUDIO_RATE){
 if(!(samples instanceof Float32Array)||!Number.isInteger(rate)||rate<1000||rate>192000)throw Error('WAV inválido');
 const bytes=new Uint8Array(44+samples.length*2),view=new DataView(bytes.buffer),text=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
 text(0,'RIFF');view.setUint32(4,bytes.length-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return bytes;
}
