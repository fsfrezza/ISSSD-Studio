export const SHIRT_NUMBER_COLOR_ID='independent-shirt-number-color';
export const NUMBER_TABLE=0x24e000,NUMBER_HELPER=0x24e200,NUMBER_HOOK=0x121225;
export function validateShirtNumberColors(colors,count){
 if(colors===undefined)return;
 if(!colors||typeof colors!=='object'||Array.isArray(colors))throw Error('Cores dos números inválidas');
 for(const [key,row] of Object.entries(colors)){
  if(!/^(0|[1-9]\d*)$/.test(key)||Number(key)>=count||!row||typeof row!=='object'||Array.isArray(row))throw Error('Equipe inválida nas cores dos números');
  for(const [kit,color] of Object.entries(row))if(!['home','away'].includes(kit)||!Number.isInteger(color)||color<0||color>0x7fff)throw Error('Cor do número inválida');
 }
}
export function shirtNumberHelper(count){
 const code=[0x22,0x2a,0x92,0xa4,0x08,0x48,0xda,0x5a];
 for(const [team,kit,dest] of [[0x0da0,0x0da4,0x2d98],[0x0ea0,0x0ea4,0x2db8]]){
  const side=[0xaf,team&255,team>>8,0x7e,0xc9,count*2,0,0xb0,0,0x89,1,0,0xd0,0,0x0a,0xaa,0xaf,kit&255,kit>>8,0x7e,0x89,8,0,0xf0,2,0xe8,0xe8,0xbf,0,0xe0,0xc9,0xc9,0,0x80,0xb0,0,0x8f,dest&255,dest>>8,0x7e];
  for(const offset of [8,13,35])side[offset]=side.length-offset-1;
  code.push(...side);
 }
 return Uint8Array.of(...code,0x7a,0xfa,0x68,0x28,0x6b);
}
export function applyShirtNumberColors(input,base,colors,count){
 validateShirtNumberColors(colors,count);
 if(!Object.values(colors??{}).some(row=>Object.keys(row).length))return input;
 const expected=[0x22,0x2a,0x92,0xa4];
 if(expected.some((v,i)=>base[NUMBER_HOOK+i]!==v||input[NUMBER_HOOK+i]!==v))throw Error('Cores dos números: conflito na rotina de paleta');
 const out=new Uint8Array(Math.max(input.length,0x400000)).fill(255);out.set(input);
 const table=new Uint8Array(count*4).fill(255);
 for(const [team,row] of Object.entries(colors))for(const [kit,color] of Object.entries(row)){const at=Number(team)*4+(kit==='away'?2:0);table[at]=color&255;table[at+1]=color>>8;}
 for(const [at,data] of [[NUMBER_TABLE,table],[NUMBER_HELPER,shirtNumberHelper(count)]]){
  if(out.slice(at,at+data.length).some(v=>v!==255))throw Error('Cores dos números: reserva ocupada');
  out.set(data,at);
 }
 out.set([0x22,0,0xe2,0xc9],NUMBER_HOOK);out[0x7fd7]=12;return out;
}
