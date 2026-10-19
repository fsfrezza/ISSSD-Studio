import {SOUND_SLOTS} from './sound-slots.mjs';
export const SOUND_SCHEMA='isssd-sounds-v1';
export const SOUND_REGIONS=SOUND_SLOTS.map(s=>[s.pc,s.pc+s.capacity]);
export function terminatedBrr(bytes,capacity=bytes?.length){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>capacity)throw Error('Som BRR: tamanho inválido ou capacidade excedida.');
 for(let i=0;i+9<=bytes.length;i+=9){
  if(bytes[i]>>4>12)throw Error('Som BRR: cabeçalho inválido.');
  if(bytes[i]&1)return bytes.slice(0,i+9);
 }
 throw Error('Som BRR: bloco final ausente ou truncado.');
}
export function soundBytes(entry,slot){
 if(!entry||!['galvao','fb96','original','custom'].includes(entry.source)||typeof entry.brrBase64!=='string'||!entry.brrBase64.length||entry.brrBase64.length>Math.ceil(slot.capacity/3)*4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(entry.brrBase64))throw Error('Som BRR: registro inválido para '+slot.id);
 return terminatedBrr(Uint8Array.from(atob(entry.brrBase64),c=>c.charCodeAt(0)),slot.capacity);
}
export function planPlusSounds(state={}){
 const data=state.soundsV1;if(data===undefined)return [];
 if(data.schema!==SOUND_SCHEMA||!data.values||typeof data.values!=='object'||Array.isArray(data.values))throw Error('Projeto: seção de sons inválida.');
 return Object.entries(data.values).map(([id,entry])=>{const slot=SOUND_SLOTS.find(s=>s.id===id);if(!slot)throw Error('Som desconhecido: '+id);return {pc:slot.pc,bytes:soundBytes(entry,slot)};});
}
export function plusSoundsWriter(rom,state={},base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('sons'))return rom;
 const writes=planPlusSounds(state);
 if(writes.length&&(!(base instanceof Uint8Array)||base.length<0x200000||rom.length<0x200000))throw Error('Sons: ROM Plus incompleta.');
 // Only terminated samples are copied: some legacy allocations also contain
 // unrelated data after the BRR end block. Never copy an entire audio bank.
 for(const {pc,bytes}of writes)rom.set(bytes,pc);
 return rom;
}
