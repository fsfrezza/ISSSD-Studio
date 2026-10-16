import {CURSOR_HELP_FIELDS} from '../src/core/cursor-text-fields.mjs';
import {encodeCursorText} from '../src/core/plus-cursor-text.mjs';
export function seedCursorTextFixture(base){
 for(const field of CURSOR_HELP_FIELDS){const n=field[3].native,bytes=encodeCursorText(field,field[1]);base[n.pointerPc]=n.pointerWord&255;base[n.pointerPc+1]=n.pointerWord>>>8;base.set(bytes,n.pc);if(n.terminator!==null)base[n.pc+bytes.length]=n.terminator;}
 return base;
}
