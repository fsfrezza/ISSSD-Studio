import {PLUS_TACTICAL_POINTER_TABLE_PC,plusLoRomPc} from '../src/core/plus-tactics-address.mjs';
import {PLUS_TACTICAL_EXPECTED_LOADERS} from '../src/core/plus-tactics-infrastructure.mjs';

export function setPlusTacticalPointer(rom,entry,ptr){
  const off=PLUS_TACTICAL_POINTER_TABLE_PC+entry*2;
  rom[off]=ptr&255;rom[off+1]=(ptr>>>8)&255;
}

export function makePlusTacticalFixture({shared30And31=true}={}){
  const rom=new Uint8Array(0x200000);
  for(let i=0;i<57;i++){
    const ptr=0x9000+i*0x20;
    setPlusTacticalPointer(rom,i,ptr);
    const pc=plusLoRomPc(0x8B,ptr);
    rom[pc]=i%16;
    for(let p=0;p<10;p++){
      rom[pc+1+p*2]=0;
      rom[pc+2+p*2]=0;
      rom[pc+21+p]=p<4?1:(p<8?2:3);
    }
  }
  if(shared30And31)setPlusTacticalPointer(rom,31,0x9000+30*0x20);
  for(const e of PLUS_TACTICAL_EXPECTED_LOADERS){
    rom.set(new Uint8Array([0xBF,0xD0,0xFD,0x8B,0x85,e.pointerDp,0xA9,0x8B,0x00,0x85,e.bankDp]),e.pc);
  }
  return rom;
}
