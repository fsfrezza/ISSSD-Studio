import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const MAX=10*1024*1024;
// Mesen2 SaveStateManager + Serializer binary format (version 4).
// Field names identify emulator state, not gameplay semantics.
export function parseMesenSaveState(input){
 const bytes=Buffer.from(input);let at=0;
 const take=n=>{if(!Number.isSafeInteger(n)||n<0||at+n>bytes.length)throw Error('Savestate truncado');const v=bytes.subarray(at,at+n);at+=n;return v;};
 const u32=()=>take(4).readUInt32LE();
 if(take(3).toString()!=='MSS')throw Error('Assinatura Mesen inválida');
 const emulatorVersion=u32(),formatVersion=u32(),consoleType=u32();
 if(formatVersion!==4||consoleType!==0)throw Error('Formato não suportado: esperado Mesen2 v4 SNES');
 const frameBufferSize=u32(),width=u32(),height=u32(),scale=u32(),previewSize=u32();
 if(frameBufferSize>MAX||previewSize>MAX)throw Error('Preview excessivo');
 const preview=inflateSync(take(previewSize),{maxOutputLength:MAX});
 if(preview.length!==frameBufferSize)throw Error('Tamanho do preview divergente');
 const nameLength=u32();if(nameLength>4096)throw Error('Nome de ROM excessivo');
 const rom=take(nameLength).toString('utf8'),compressed=take(1)[0];let data;
 if(compressed===1){
  const originalSize=u32(),compressedSize=u32();
  if(originalSize>=MAX||compressedSize>=MAX)throw Error('Estado excessivo');
  data=inflateSync(take(compressedSize),{maxOutputLength:MAX});
  if(data.length!==originalSize)throw Error('Tamanho do estado divergente');
 }else if(compressed===0)data=take(bytes.length-at);else throw Error('Compressão desconhecida');
 if(at!==bytes.length)throw Error('Dados extras após o estado');
 const fields=new Map();let pos=0;
 while(pos<data.length){
  const end=data.indexOf(0,pos);
  if(end<=pos||end+5>data.length)throw Error('Chave de estado truncada');
  const key=data.subarray(pos,end).toString('ascii');
  if(!/^[!-~]+$/.test(key)||fields.has(key))throw Error('Chave de estado inválida ou duplicada');
  const size=data.readUInt32LE(end+1);pos=end+5;
  if(pos+size>data.length)throw Error('Campo de estado truncado');
  fields.set(key,Buffer.from(data.subarray(pos,pos+size)));pos+=size;
 }
 const wram=fields.get('memoryManager.workRam');
 if(wram?.length!==0x20000)throw Error('WRAM SNES ausente ou inválida');
 const scalar=key=>{const v=fields.get(key);return v&&v.length<=6?v.readUIntLE(0,v.length):null;};
 const cpu=Object.fromEntries(['a','x','y','pc','k','d','dbr','sp','ps'].map(k=>[k,scalar('cpu.'+k)]));
 return {emulatorVersion,formatVersion,consoleType,rom,width,height,scale,fields,wram,cpu,frame:scalar('ppu.frameCount'),sha256:createHash('sha256').update(bytes).digest('hex')};
}

export function compareMesenWram(before,after){
 if(before.rom!==after.rom)throw Error('Savestates declaram ROMs diferentes');
 const ranges=[];let count=0;
 for(let i=0;i<0x20000;i++)if(before.wram[i]!==after.wram[i]){
  count++;let last=ranges.at(-1);
  if(!last||last.offset+last.before.length!==i){last={offset:i,snesAddress:0x7E0000+i,before:[],after:[]};ranges.push(last);}
  last.before.push(before.wram[i]);last.after.push(after.wram[i]);
 }
 return {schema:'isssd-backpass-state-diff-v1',rom:before.rom,before:{sha256:before.sha256,frame:before.frame,cpu:before.cpu},after:{sha256:after.sha256,frame:after.frame,cpu:after.cpu},changedBytes:count,ranges,gameplayMappingConfirmed:false,note:'Diferenças de memória são candidatos; não comprovam contato, recuo ou pênalti. O nome da ROM não verifica os bytes da ROM.'};
}
