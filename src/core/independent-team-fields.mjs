import{decodeFixedPlayerName,encodeFixedPlayerName,normalizePlayerName}from'./plus-player-name.mjs';
import{decodePlusTacticalRecord,encodePlusTacticalRecord}from'./plus-tactics-record.mjs';
export const INDEPENDENT_SKILLS=Object.freeze(['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy']);
const integer=(n,min,max,label)=>{if(!Number.isInteger(n)||n<min||n>max)throw Error(label+' inválido.');return n;};
function playerBytes(team,slot){integer(slot,0,19,'Jogador');if(!team?.data?.attributes)throw Error('Equipe independente ausente.');return team.data.attributes.slice(slot*7,slot*7+7);}
export function readIndependentPlayer(team,slot){const b=playerBytes(team,slot),skills={};INDEPENDENT_SKILLS.forEach((key,i)=>skills[key]=((b[i>>1]>>(i%2?0:4))&15)+1);return{name:decodeFixedPlayerName(Uint8Array.from(team.data.names.slice(slot*8,slot*8+8))).trim(),number:b[5]+1,position:b[4]>>4,hair:b[6]&15,palette:b[6]>>4&1,skills};}
export function editIndependentPlayer(team,slot,edit){
 const out=structuredClone(team),b=playerBytes(team,slot);
 if(edit.name!==undefined){const bytes=encodeFixedPlayerName(normalizePlayerName(edit.name));out.data.names.splice(slot*8,8,...bytes);}
 if(edit.number!==undefined){integer(edit.number,1,20,'Camisa');const duplicate=out.data.attributes.findIndex((v,i)=>i%7===5&&i!==slot*7+5&&v===edit.number-1);if(duplicate>=0)out.data.attributes[duplicate]=b[5];b[5]=edit.number-1;}
 if(edit.position!==undefined){b[4]=integer(edit.position,0,6,'Posição')<<4|b[4]&15;if(edit.position===1)b[6]&=240;}
 if((b[4]>>4)===1&&edit.hair!==undefined&&edit.hair!==0)throw Error('O goleiro usa cabelo incorporado; edite sua cor.');
 if(edit.hair!==undefined)b[6]=b[6]&240|integer(edit.hair,0,15,'Cabelo');
 if(edit.palette!==undefined)b[6]=b[6]&239|integer(edit.palette,0,1,'Paleta')<<4;
 for(const[key,value]of Object.entries(edit.skills??{})){const i=INDEPENDENT_SKILLS.indexOf(key);if(i<0)throw Error('Skill desconhecido.');const raw=integer(value,1,10,'Skill')-1;b[i>>1]=i%2?b[i>>1]&240|raw:b[i>>1]&15|raw<<4;}
 out.data.attributes.splice(slot*7,7,...b);return out;
}
export function readIndependentFormation(team){return decodePlusTacticalRecord(Uint8Array.from(team.data.tactics));}
export function editIndependentFormation(team,edit){const out=structuredClone(team);out.data.tactics=Array.from(encodePlusTacticalRecord(Uint8Array.from(team.data.tactics),edit));return out;}
export function independentPaletteColors(record){if(!Array.isArray(record)||record.length<4)throw Error('Paleta ausente.');return Array.from({length:(record.length-2)/2},(_,i)=>record[2+i*2]|record[3+i*2]<<8);}
export function editIndependentPalette(team,key,index,color){
 integer(color,0,32767,'Cor');const out=structuredClone(team),record=out.data.palettes[key];if(!Array.isArray(record)||!Number.isInteger(record[0]))throw Error('Paleta inválida.');integer(index,0,(record.length-2)/2-1,'Índice');record[2+index*2]=color&255;record[3+index*2]=color>>8;return out;
}
export function independentFlagPixels(team,part='selectionFlags'){
 if(!['selectionFlags','fieldFlags'].includes(part))throw Error('Bandeira inválida.');const pixels=Array(24*16).fill(0);
 team.data[part].forEach((half,h)=>{const raw=half.bytes;const byte=at=>half.planar?raw[(at>>4)*16+(at%16>>1)+(at%2)*8]:raw[at];for(let t=0;t<3;t++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let plane=0;plane<4;plane++)pixels[(h*8+y)*24+t*8+x]|=(byte(t*32+(plane>>1)*16+y*2+(plane&1))>>(7-x)&1)<<plane;});return pixels;
}
export function editIndependentFlag(team,pixels,part='selectionFlags'){
 if(!['selectionFlags','fieldFlags'].includes(part)||!Array.isArray(pixels)||pixels.length!==384||pixels.some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Desenho de bandeira inválido.');const out=structuredClone(team);
 out.data[part]=[0,1].map(h=>{const bytes=Array(96).fill(0);for(let t=0;t<3;t++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let plane=0;plane<4;plane++)bytes[t*32+(plane>>1)*16+y*2+(plane&1)]|=((pixels[(h*8+y)*24+t*8+x]>>plane)&1)<<(7-x);return{bytes,planar:false};});return out;
}
export function independentPatternPixels(team){const out=[];for(let frame=0;frame<8;frame++)for(let y=0;y<8;y++)for(let x=0;x<8;x++){let v=0;for(let p=0;p<4;p++)v|=(team.data.pattern[frame*32+(p>>1)*16+y*2+(p&1)]>>(7-x)&1)<<p;out.push(v);}return out;}
export function editIndependentPattern(team,pixels){if(!Array.isArray(pixels)||pixels.length!==512||pixels.some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Desenho de camisa inválido.');const out=structuredClone(team);out.data.pattern=Array(256).fill(0);for(let f=0;f<8;f++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let p=0;p<4;p++)out.data.pattern[f*32+(p>>1)*16+y*2+(p&1)]|=(pixels[f*64+y*8+x]>>p&1)<<(7-x);return out;}
