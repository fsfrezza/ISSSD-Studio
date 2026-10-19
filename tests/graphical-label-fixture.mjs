import {seedNativeMenuFontFixture} from './native-menu-font-fixture.mjs';
import {GRAPHICAL_LABEL_ASSETS} from '../src/core/graphical-label-layout.mjs';
import {konamiLzCompress} from '../src/core/konami-lz.mjs';
export function seedGraphicalLabelFixture(base){
 for(const a of GRAPHICAL_LABEL_ASSETS){
  base.fill(255,a.slot,a.slot+a.capacity);
  const raw=new Uint8Array(a.raw);if(a.id==='formationRoleMap')raw.set([0xb8,0x1c,0xb7,0x1c,0x6b,0x0c,0x32,0x0c,0x6c,0x0c,0x6a,0x0c]);
  const packed=konamiLzCompress(raw);if(a.planar)packed[1]|=128;base.set(packed,a.pc);
  for(const pc of a.pointers)base.set([a.cpu&255,a.cpu>>8&255,a.cpu>>16],pc);
 }
 seedNativeMenuFontFixture(base);base.set([0xBD,0x16,0xC0,0x05,0x06],0x28E80);
 base.fill(255,0x3FB80,0x3FB98);base.set([0x44,0x03,0xC2,0xA9,2,2,0x44,0x17,0xC2,0xAB,2,4],0x3ADC8);base.set([0x15,2],0x3AFCA);base.set([2,1,1,169,170,171,0,172,173,0,0,0,0,0,0,0,10,1,169,170,171],0x3C7FC);base.set([0xA0,0x10,0x19],0x3347A);base.set([0xA0,0x0F,0x17],0x33485);base.set([0,101,119,0,102,119,0,103,119,95,94,119,95,95,119],0x3C875);
 base.set([0x6c,0x7f,0x70,0x7b,0,0,0],0x3DFB7);return base;
}
