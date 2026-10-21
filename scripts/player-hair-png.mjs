import {deflateSync,inflateSync} from 'node:zlib';
// Stable editing colors identify ROM palette indices, not fixed in-game RGB.
export const HAIR_EDIT_COLORS=['000000','202020','704020','b87850','e8ad78','ffd0a0','705038','2030a0','3050d0','f0e040','b0b0b0','ffffff','ff00ff','00ffff','00ff00','ff8000'];
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([n,t,data,sum]);}
export function encodeHairSheet(frames){
 if(frames.length!==24||frames.some(f=>f.length!==64))throw Error('São necessários 24 quadros 8x8.');
 const raw=Buffer.alloc(24*(64+1));for(let y=0;y<24;y++)for(let x=0;x<64;x++)raw[y*65+1+x]=frames[(y>>3)*8+(x>>3)][(y&7)*8+(x&7)];
 const header=Buffer.alloc(13);header.writeUInt32BE(64);header.writeUInt32BE(24,4);header[8]=8;header[9]=3;
 return Buffer.concat([signature,chunk('IHDR',header),chunk('PLTE',Buffer.from(HAIR_EDIT_COLORS.join(''),'hex')),chunk('tRNS',Buffer.from([0,...Array(15).fill(255)])),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export function decodeHairSheet(input){
 const b=Buffer.from(input);if(!b.subarray(0,8).equals(signature))throw Error('Arquivo não é PNG.');let at=8,header,palette,alpha,parts=[];let ended=false;
 while(at+12<=b.length){const size=b.readUInt32BE(at),type=b.toString('ascii',at+4,at+8);if(at+12+size>b.length)throw Error('PNG truncado.');const data=b.subarray(at+8,at+8+size);if(crc(b.subarray(at+4,at+8+size))!==b.readUInt32BE(at+8+size))throw Error('CRC inválido no PNG.');if(type==='IHDR')header=data;else if(type==='PLTE')palette=data;else if(type==='tRNS')alpha=data;else if(type==='IDAT')parts.push(data);else if(type==='IEND'){ended=true;break;}at+=12+size;}
 if(!ended||header?.length!==13||header.readUInt32BE(0)!==64||header.readUInt32BE(4)!==24)throw Error('Mantenha o PNG em 64 x 24 pixels (24 quadros 8x8).');
 const depth=header[8],type=header[9],channels=type===6?4:type===2?3:type===3?1:0;
 if(header[10]||header[11]||header[12]||!channels||(type===3?![1,2,4,8].includes(depth):depth!==8))throw Error('Use PNG RGB/RGBA de 8 bits ou indexado, sem entrelaçamento.');
 const stride=Math.ceil(64*channels*depth/8),bpp=Math.max(1,Math.ceil(channels*depth/8)),raw=inflateSync(Buffer.concat(parts),{maxOutputLength:24*(stride+1)});if(raw.length!==24*(stride+1))throw Error('Tamanho de dados PNG inválido.');const rows=[];
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<24;y++){const filter=raw[y*(stride+1)],row=Buffer.from(raw.subarray(y*(stride+1)+1,(y+1)*(stride+1)));if(filter>4)throw Error('Filtro PNG inválido.');for(let x=0;x<stride;x++){const a=x>=bpp?row[x-bpp]:0,z=y?rows[y-1][x]:0,c=y&&x>=bpp?rows[y-1][x-bpp]:0;row[x]=(row[x]+(filter===1?a:filter===2?z:filter===3?Math.floor((a+z)/2):filter===4?paeth(a,z,c):0))&255;}rows.push(row);}
 const frames=Array.from({length:24},()=>Array(64).fill(0));
 for(let y=0;y<24;y++)for(let x=0;x<64;x++){let rgb,a=255;if(type===3){const bit=x*depth,index=(rows[y][bit>>3]>>(8-depth-(bit&7)))&((1<<depth)-1);if(!palette||index*3+3>palette.length)throw Error('Índice PNG fora da paleta.');rgb=palette.subarray(index*3,index*3+3);a=alpha?.[index]??255;}else{rgb=rows[y].subarray(x*channels,x*channels+3);if(type===6)a=rows[y][x*channels+3];else if(alpha){a=[0,1,2].every(i=>alpha.readUInt16BE(i*2)===rgb[i])?0:255;}}
  let index=0;if(a!==0){if(a!==255)throw Error('Não use semitransparência nem suavização.');index=HAIR_EDIT_COLORS.indexOf(rgb.toString('hex'));if(index<=0)throw Error('Cor não permitida em '+x+','+y+'. Use as cores da paleta fornecida; preto transparente não pode ser opaco.');}frames[(y>>3)*8+(x>>3)][(y&7)*8+(x&7)]=index;
 }
 return frames;
}
