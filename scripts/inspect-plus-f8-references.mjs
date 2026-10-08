import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function hex(n,width=6){return `0x${Number(n).toString(16).toUpperCase().padStart(width,'0')}`;}
function byteHex(n){return `0x${Number(n).toString(16).toUpperCase().padStart(2,'0')}`;}
function pcToLoromCpu(pc){
  const bank=0x80+Math.floor(pc/0x8000);
  const addr=0x8000+(pc%0x8000);
  return (bank<<16)|addr;
}
function bytesHex(bytes){return [...bytes].map(byteHex);}

const [romPath]=process.argv.slice(2);
if(!romPath){
  console.error('Usage: node scripts/inspect-plus-f8-references.mjs <clean-plus.sfc>');
  process.exit(2);
}

const rom=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:rom.length,sha256:sha256(rom)});

// The upstream USA disassembly marks SNES $80:F828..$80:FF8F as free bytes.
// Deluxe Plus repurposes part of this area; our isolated problematic data lies
// at PC $78BF..$78EF = SNES $80:F8BF..$80:F8EF.
const targetPcStart=0x78B8;
const targetPcEnd=0x78F0;
const targetCpuStart=pcToLoromCpu(targetPcStart);
const targetCpuEnd=pcToLoromCpu(targetPcEnd-1)+1;

const absOpcodes=new Map([
  [0x0C,'TSB abs'],[0x0D,'ORA abs'],[0x0E,'ASL abs'],[0x1C,'TRB abs'],[0x1D,'ORA abs,X'],[0x1E,'ASL abs,X'],
  [0x2C,'BIT abs'],[0x2D,'AND abs'],[0x2E,'ROL abs'],[0x3D,'AND abs,X'],[0x3E,'ROL abs,X'],
  [0x4C,'JMP abs'],[0x4D,'EOR abs'],[0x4E,'LSR abs'],[0x5D,'EOR abs,X'],[0x5E,'LSR abs,X'],
  [0x6C,'JMP (abs)'],[0x6D,'ADC abs'],[0x6E,'ROR abs'],[0x7C,'JMP (abs,X)'],[0x7D,'ADC abs,X'],[0x7E,'ROR abs,X'],
  [0x8C,'STY abs'],[0x8D,'STA abs'],[0x8E,'STX abs'],[0x9C,'STZ abs'],[0x9D,'STA abs,X'],[0x9E,'STZ abs,X'],
  [0xAC,'LDY abs'],[0xAD,'LDA abs'],[0xAE,'LDX abs'],[0xBC,'LDY abs,X'],[0xBD,'LDA abs,X'],[0xBE,'LDX abs,Y'],
  [0xCC,'CPY abs'],[0xCD,'CMP abs'],[0xCE,'DEC abs'],[0xDC,'JML [abs]'],[0xDD,'CMP abs,X'],[0xDE,'DEC abs,X'],
  [0xEC,'CPX abs'],[0xED,'SBC abs'],[0xEE,'INC abs'],[0xFC,'JSR (abs,X)'],[0xFD,'SBC abs,X'],[0xFE,'INC abs,X'],
  [0x8F,'STA long'],[0x9F,'STA long,X'],[0xAF,'LDA long'],[0xBF,'LDA long,X'],[0xCF,'CMP long'],[0xDF,'CMP long,X'],[0xEF,'SBC long'],[0xFF,'SBC long,X'],
  [0x0F,'ORA long'],[0x1F,'ORA long,X'],[0x2F,'AND long'],[0x3F,'AND long,X'],[0x4F,'EOR long'],[0x5F,'EOR long,X'],[0x6F,'ADC long'],[0x7F,'ADC long,X']
]);
const longOps=new Set([0x0F,0x1F,0x2F,0x3F,0x4F,0x5F,0x6F,0x7F,0x8F,0x9F,0xAF,0xBF,0xCF,0xDF,0xEF,0xFF]);

const references=[];
for(let pc=0;pc<rom.length-2;pc++){
  const op=rom[pc];
  if(!absOpcodes.has(op)) continue;
  if(longOps.has(op)){
    if(pc+3>=rom.length) continue;
    const cpu=rom[pc+1]|(rom[pc+2]<<8)|(rom[pc+3]<<16);
    const bank=(cpu>>>16)&0xFF;
    if(bank!==0x80&&bank!==0x00) continue;
    const normalized=(cpu&0xFFFF)|(0x80<<16);
    if(normalized>=targetCpuStart&&normalized<targetCpuEnd){
      references.push({
        kind:'24-bit-instruction',pc,pcHex:hex(pc),cpuHex:hex(pcToLoromCpu(pc),6),opcode:byteHex(op),mnemonic:absOpcodes.get(op),targetCpuHex:hex(cpu,6),targetPcHex:hex((cpu&0x7FFF)),contextHex:bytesHex(rom.slice(Math.max(0,pc-8),Math.min(rom.length,pc+12)))
      });
    }
  }else{
    const addr=rom[pc+1]|(rom[pc+2]<<8);
    if(addr>=0xF8B8&&addr<0xF8F0){
      references.push({
        kind:'16-bit-instruction',pc,pcHex:hex(pc),cpuHex:hex(pcToLoromCpu(pc),6),opcode:byteHex(op),mnemonic:absOpcodes.get(op),targetWordHex:hex(addr,4),contextHex:bytesHex(rom.slice(Math.max(0,pc-8),Math.min(rom.length,pc+11)))
      });
    }
  }
}

// Also report raw pointer-shaped occurrences. These are not assumed to be code;
// they help identify tables feeding an indirect consumer.
const raw16=[];
const raw24=[];
for(let pc=0;pc<rom.length-2;pc++){
  const word=rom[pc]|(rom[pc+1]<<8);
  if(word>=0xF8B8&&word<0xF8F0){
    if(!references.some(r=>r.pc===pc-1&&r.kind==='16-bit-instruction')){
      raw16.push({pc,pcHex:hex(pc),cpuHex:hex(pcToLoromCpu(pc),6),valueHex:hex(word,4),contextHex:bytesHex(rom.slice(Math.max(0,pc-6),Math.min(rom.length,pc+8)))});
    }
  }
  const long=word|(rom[pc+2]<<16);
  if(((long>>>16)===0x80||(long>>>16)===0x00)&&(word>=0xF8B8&&word<0xF8F0)){
    raw24.push({pc,pcHex:hex(pc),cpuHex:hex(pcToLoromCpu(pc),6),valueHex:hex(long,6),contextHex:bytesHex(rom.slice(Math.max(0,pc-6),Math.min(rom.length,pc+9)))});
  }
}

const result={
  mode:'inspect-plus-f8-references',
  upstreamDisassemblyFact:{freeCpuRange:'$80:F828-$80:FF8F',note:'USA disassembly marks this range as free bytes; Deluxe Plus repurposes it.'},
  target:{pcStartHex:hex(targetPcStart),pcEndExclusiveHex:hex(targetPcEnd),cpuStartHex:hex(targetCpuStart,6),cpuEndExclusiveHex:hex(targetCpuEnd,6)},
  bytes:bytesHex(rom.slice(targetPcStart,targetPcEnd)),
  instructionReferences:references,
  raw16Count:raw16.length,
  raw16:raw16.slice(0,80),
  raw24Count:raw24.length,
  raw24:raw24.slice(0,80)
};
console.log(JSON.stringify(result,null,2));
