import {GRAPHICAL_LABEL_ASSETS} from '../src/core/graphical-label-layout.mjs';
import {konamiLzCompress} from '../src/core/konami-lz.mjs';
export function seedGraphicalLabelFixture(base){
 for(const a of GRAPHICAL_LABEL_ASSETS){
  base.fill(255,a.slot,a.slot+a.capacity);
  const raw=new Uint8Array(a.raw);if(a.id==='formationRoleMap')raw.set([0xb8,0x1c,0xb7,0x1c,0x6b,0x0c,0x32,0x0c,0x6c,0x0c,0x6a,0x0c]);
  const packed=konamiLzCompress(raw);if(a.planar)packed[1]|=128;base.set(packed,a.pc);
  for(const pc of a.pointers)base.set([a.cpu&255,a.cpu>>8&255,a.cpu>>16],pc);
 }
 base.set([0x6c,0x7f,0x70,0x7b,0,0,0],0x3DFB7);return base;
}
