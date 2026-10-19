import {TRAINING_HUD_FIELDS} from './training-hud-fields.mjs';
export const TRAINING_HUD_SLOT=0xF9B3;
export const TRAINING_HUD_CAPACITY=150;
export const TRAINING_HUD_REGIONS=[[TRAINING_HUD_SLOT,TRAINING_HUD_SLOT+TRAINING_HUD_CAPACITY],...TRAINING_HUD_FIELDS.flatMap(f=>f[6].map(pc=>[pc,pc+3]))];
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const word=n=>[n&255,n>>8&255];
// The native F shares the upper tile of E; consecutive tile IDs are not letters.
const large={A:[0x21,0x22],B:[0x23,0x24],C:[0x25,0x26],D:[0x27,0x28],E:[0x29,0x2A],F:[0x29,0x2B],H:[0x2E,0x2F],I:[0x30,0x31],L:[0x36,0x37],M:[0x38,0x39],N:[0x3A,0x3B],O:[0x3C,0x3D],P:[0x3E,0x3F],R:[0x3E,0x42],S:[0x43,0x44],T:[0x45,0x31],U:[0x46,0x3D],' ':[0,0]};
const names={A:[0x35,0x36],E:[0x3D,0x3E],G:[0x40,0x41],I:[0x44,0x45],N:[0x4E,0x4F],O:[0x50,0x51],R:[0x52,0x56],T:[0x59,0x45]};
export function encodeTrainingHud(field,value,original=false){
 const [,en,,,position,font]=field,text=normalize(value);
 if(!text||text.length>20)throw Error('Treino: texto vazio ou maior que 20 células.');
 const left=original?position:font==='small'?position:position+Math.floor((en.length-text.length)/2),rows=font==='small'?1:2;
 const out=[];
 for(let y=0;y<rows;y++){
  if(y)out.push(0xFE);out.push(...word(left+y*32));
  for(const c of text){
   if(font==='small'){if(!/[ A-Z]/.test(c))throw Error('Treino: caractere não suportado '+c);out.push(c===' '?0:c.charCodeAt(0)-64);}
   else{const pair=(font==='name'?names:large)[c];if(!pair)throw Error('Treino: caractere não mapeado nesta fonte: '+c);out.push(pair[y]);}
  }
 }
 out.push(0xFF);return Uint8Array.from(out);
}
export function plusTrainingHudWriter(rom,state={},base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('partida'))return rom;
 const values=state.additionalScreenTextsV1?.values?.['training-hud'];if(!values)return rom;
 const writes=[];let cursor=TRAINING_HUD_SLOT;
 for(const field of TRAINING_HUD_FIELDS){
  const [id,en,,pc,,,refs]=field;if(!Object.hasOwn(values,id)||normalize(values[id])===en)continue;
  const expected=encodeTrainingHud(field,en,true),next=encodeTrainingHud(field,values[id]);
  if(expected.some((v,i)=>base[pc+i]!==v))throw Error('Treino · '+en+': descritor original divergente.');
  if(cursor+next.length>TRAINING_HUD_SLOT+TRAINING_HUD_CAPACITY)throw Error('Treino: avisos excedem a reserva nativa; reduza os textos.');
  for(const ref of refs){if(base[ref]!==0xA2||base[ref+1]!==word(pc)[0]||base[ref+2]!==word(pc)[1])throw Error('Treino · '+en+': referência nativa divergente.');writes.push([ref+1,Uint8Array.from(word(cursor))]);}
  writes.push([cursor,next]);cursor+=next.length;
 }
 if(!writes.length)return rom;
 if(base.slice(TRAINING_HUD_SLOT,TRAINING_HUD_SLOT+TRAINING_HUD_CAPACITY).some(v=>v!==255)||rom.slice(TRAINING_HUD_SLOT,TRAINING_HUD_SLOT+TRAINING_HUD_CAPACITY).some(v=>v!==255))throw Error('Treino: reserva de avisos ocupada.');
 for(const [pc,bytes]of writes)rom.set(bytes,pc);return rom;
}
