import assert from 'node:assert/strict';

const MAIN=0x151068;
const SPECIAL=0x78C0;
const FULL=0x78C6;
const REC=7;

function headerSize(bytes){return (bytes.length%0x8000===0x200)?0x200:0}
function bodySize(bytes){return bytes.length-headerSize(bytes)}
function isSupportedRomSize(bytes){const n=bodySize(bytes);return n===0x200000||n===0x400000}

function syncBrazilFinal(bytes){
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(isSupportedRomSize(bytes));
  const hs=headerSize(bytes);
  const p1=hs+MAIN+REC;
  bytes.set(bytes.slice(p1+1,p1+7),hs+SPECIAL);
  for(let i=2;i<=7;i++){
    const src=hs+MAIN+i*REC;
    const dst=hs+FULL+(i-2)*REC;
    bytes.set(bytes.slice(src,src+REC),dst);
  }
}

function validateBrazilFinal(bytes){
  const hs=headerSize(bytes),p1=hs+MAIN+REC;
  for(let b=0;b<6;b++)if(bytes[p1+1+b]!==bytes[hs+SPECIAL+b])return false;
  for(let i=2;i<=7;i++){
    const src=hs+MAIN+i*REC,dst=hs+FULL+(i-2)*REC;
    for(let b=0;b<REC;b++)if(bytes[src+b]!==bytes[dst+b])return false;
  }
  return true;
}

function repairChecksum(bytes){
  const hs=headerSize(bytes),off=hs+0x7FDC;
  bytes.fill(0,off,off+4);
  let sum=0;
  for(let i=0;i<bytes.length;i++)sum=(sum+bytes[i])&0xFFFF;
  const checksum=(sum+0x01FE)&0xFFFF;
  const complement=checksum^0xFFFF;
  bytes[off]=complement&255;
  bytes[off+1]=(complement>>8)&255;
  bytes[off+2]=checksum&255;
  bytes[off+3]=(checksum>>8)&255;
}

for(const size of [0x200000,0x400000]){
  const rom=new Uint8Array(size);
  for(let p=0;p<20;p++){
    const off=MAIN+p*REC;
    for(let b=0;b<REC;b++)rom[off+b]=(p*16+b+1)&255;
  }
  rom.fill(0xEE,SPECIAL,FULL+6*REC);
  assert.equal(validateBrazilFinal(rom),false);
  syncBrazilFinal(rom);
  assert.equal(validateBrazilFinal(rom),true);
  repairChecksum(rom);
  const off=0x7FDC;
  const complement=rom[off]|(rom[off+1]<<8);
  const checksum=rom[off+2]|(rom[off+3]<<8);
  assert.equal((complement^checksum)&0xFFFF,0xFFFF);
}

console.log('OK: mirror especial do Brasil validado em ROMs de 2 MiB e 4 MiB.');
console.log('OK: jogador 1 usa bytes 1..6 em 0x78C0..0x78C5.');
console.log('OK: jogadores 2..7 usam registros completos em 0x78C6..0x78EF.');
console.log('OK: checksum final permanece complementar.');
