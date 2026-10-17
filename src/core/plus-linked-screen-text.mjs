import {NATIVE_MENU_FONTS} from './native-menu-text-fields.mjs';
export const LINKED_SCREEN_FIELDS=[
 ['game-modes','friendly',0x3DA0D,16,1,'TallMenuText','OPEN GAME       '],
 ['game-modes','league',0x3DA1D,16,1,'TallMenuText','SHORT LEAGUE    '],
 ['game-modes','tournament',0x3DA2D,16,1,'TallMenuText','SHORT TOURNAMENT'],
 ['game-modes','friendlyDesc',0x3DA3D,17,1,'TallMenuText','Single game only.'],
 ['game-modes','leagueDesc',0x3DA4E,17,2,'TallMenuText','League up to six players.         '],
 ['game-modes','tournamentDesc',0x3DA70,17,2,'TallMenuText','Tournament up to eight players.   '],
];
function encode(text,font){const t=NATIVE_MENU_FONTS[font];return Uint8Array.from(text,c=>{if(t[c]===undefined)throw Error('Caractere indisponível: '+c);return t[c];});}
export function wrapNativeLines(value,width,rows){
 const text=String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\r/g,''),lines=[];
 for(let line of text.split('\n')){while(line.length>width){const at=line.lastIndexOf(' ',width);if(at<1)throw Error('Palavra excede '+width+' células.');lines.push(line.slice(0,at));line=line.slice(at+1);}lines.push(line);}
 if(lines.length>rows)throw Error('Texto excede '+rows+' linhas de '+width+' células.');return Array.from({length:rows},(_,i)=>(lines[i]??'').padEnd(width)).join('');
}
export function plusLinkedScreenTextWriter(rom,state={},base=rom,selectedAreas=null){
 const pre=!selectedAreas||selectedAreas.includes('pre-partida'),strategy=!selectedAreas||selectedAreas.includes('textos-estrategias');
 if(!pre&&!strategy)return rom;
 const writes=[];
 if(pre)for(const [section,id,pc,w,h,font,original] of LINKED_SCREEN_FIELDS){const values=state.screenTextsV1?.values?.[section];if(!Object.hasOwn(values||{},id))continue;
  const expected=encode(original,font);if(expected.some((v,i)=>base[pc+i]!==v))throw Error(id+': texto original divergente.');
  writes.push([pc,encode(wrapNativeLines(values[id],w,h),font)]);
 }
 const additional=state.additionalScreenTextsV1,values=additional?.schema==='isssd-additional-screen-texts-v1'?additional.values||{}:{};
 const numeric=values['strategy-labels']||{};
 const whole=values['strategies-native']?.data_87ca1d;
 const words=whole==null?[]:String(whole).trim().split(/\s+/);
 // ONE and FOUR are separate runtime calls, at +0 and +4. Keep the separator.
 if(strategy)for(const [id,pc,width,word] of [['one',0x3CA1D,3,words[0]],['four',0x3CA21,4,words[1]]]){
  const v=numeric[id]??word;if(v!==undefined)writes.push([pc,encode(wrapNativeLines(v,width,1),'TallMenuText')]);
 }
 for(const [pc,bytes] of writes)rom.set(bytes,pc);return rom;
}
