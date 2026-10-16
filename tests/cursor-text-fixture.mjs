import {CURSOR_HELP_FIELDS} from '../src/core/cursor-text-fields.mjs';
import {encodeCursorText} from '../src/core/plus-cursor-text.mjs';
import {CURSOR_LABEL_GFX as GFX} from '../src/core/cursor-label-layout.mjs';
import {konamiLzCompress} from '../src/core/konami-lz.mjs';
export function seedCursorTextFixture(base){
 if(base.length>=GFX.pc+GFX.capacity){
  base.set(konamiLzCompress(Uint8Array.from(GFX.rawHex.match(/../g),s=>parseInt(s,16))),GFX.pc);
  base.set([0xde,0xfa,0xac],GFX.pointerPc);base.fill(255,GFX.relocatedPc,GFX.relocatedPc+GFX.relocatedCapacity);base.set([0x68,0x7c,0x7b,0x76,0],0x3cafa);
 }
 for(const field of CURSOR_HELP_FIELDS){const n=field[3].native,bytes=encodeCursorText(field,field[1]);base[n.pointerPc]=n.pointerWord&255;base[n.pointerPc+1]=n.pointerWord>>>8;base.set(bytes,n.pc);if(n.terminator!==null)base[n.pc+bytes.length]=n.terminator;}
 return base;
}
