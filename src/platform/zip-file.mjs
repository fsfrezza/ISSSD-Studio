import fs from 'node:fs';
import {deflateRawSync} from 'node:zlib';
const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
// Deterministic ZIP32, compressed entries written individually to disk.
export class ZipFile{
 constructor(filename){this.fd=fs.openSync(filename,'wx');this.offset=0;this.central=[];this.closed=false;}
 write(b){let n=0;while(n<b.length)n+=fs.writeSync(this.fd,b,n,b.length-n);this.offset+=b.length;}
 add(name,data){
  if(this.closed||this.central.length>=65535)throw new Error('ZIP fechado ou limite de entradas excedido');
  const bytes=Buffer.from(data),file=Buffer.from(name,'utf8'),packed=deflateRawSync(bytes),crc=crc32(bytes),offset=this.offset;
  if(offset+packed.length+file.length+30>0xFFFFFFFF)throw new Error('ZIP excede limite de 4 GiB');
  const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(packed.length,18);h.writeUInt32LE(bytes.length,22);h.writeUInt16LE(file.length,26);
  this.write(h);this.write(file);this.write(packed);this.central.push({file,crc,packed:packed.length,size:bytes.length,offset});
 }
 finish(){
  if(this.offset+this.central.reduce((n,e)=>n+46+e.file.length,22)>0xFFFFFFFF)throw new Error('ZIP excede limite de 4 GiB');
  const start=this.offset;
  for(const e of this.central){const h=Buffer.alloc(46);h.writeUInt32LE(0x02014b50);h.writeUInt16LE(20,4);h.writeUInt16LE(20,6);h.writeUInt16LE(0x800,8);h.writeUInt16LE(8,10);h.writeUInt16LE(33,14);h.writeUInt32LE(e.crc,16);h.writeUInt32LE(e.packed,20);h.writeUInt32LE(e.size,24);h.writeUInt16LE(e.file.length,28);h.writeUInt32LE(e.offset,42);this.write(h);this.write(e.file);}
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(this.central.length,8);end.writeUInt16LE(this.central.length,10);end.writeUInt32LE(this.offset-start,12);end.writeUInt32LE(start,16);this.write(end);this.close();
 }
 close(){if(!this.closed){fs.closeSync(this.fd);this.closed=true;}}
}
