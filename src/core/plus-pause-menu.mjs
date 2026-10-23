import{nativeMenuGlyphReader}from'./native-menu-glyphs.mjs';
export const PAUSE_LABEL_SLOT=0x3E8A00,PAUSE_LABEL_HELPER=0x3E8800,PAUSE_TABLE_SLOT=0x3EF000,PAUSE_TABLE_HELPER=0x3E8900;
export const PAUSE_MENU_REGIONS=[[0x1226BD,0x1226BF],[0x1226C6,0x1226C8],[0x1226EB,0x1226EF],[0x12278B,0x122791],[PAUSE_LABEL_HELPER,PAUSE_LABEL_SLOT+0x100],[PAUSE_TABLE_SLOT,PAUSE_TABLE_SLOT+32]];
const cpu=p=>0x800000|(p>>15)<<16|0x8000|(p&32767),long=v=>[v&255,v>>8&255,v>>16&255];
export function pauseUploadHelper(){return Uint8Array.from([
 0x22,0x37,0x8E,0x80, // displaced native cursor upload, retain its post-call ABI
 0x08,0x8B,0x48,0xDA,0x5A,0xA5,0,0x48,
 0xA9,...[cpu(PAUSE_LABEL_SLOT)>>16,0],0x85,0,
 0xA9,cpu(PAUSE_LABEL_SLOT)&255,cpu(PAUSE_LABEL_SLOT)>>8&255,0xA2,0xE0,0,0xA0,0,0x5E,0x22,0x37,0x8E,0x80,
 0x68,0x85,0,0x7A,0xFA,0x68,0xAB,0x28,0x6B]);}
export function pauseTableHelper(){return Uint8Array.from([0xDA,0xBB,0xC0,0,0xF0,0x90,11,0xC0,0x20,0xF0,0xB0,6,0xBF,...long(cpu(PAUSE_TABLE_SLOT)-0xF000),0x80,4,0xBF,0,0,0x81,0xFA,0xC9,255,255,0x6B]);}
export function renderPauseResume(base,text){
 const value=String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();if(!/^[A-Z ]{1,7}$/.test(value))throw Error('Pausa: use de uma a sete letras.');
 const read=nativeMenuGlyphReader(base),raw=new Uint8Array(224);
 for(let i=0;i<7;i++){const pixels=read(value[i]??' ');for(let y=0;y<16;y++)for(let x=0;x<8;x++){const at=((y>>3)*7+i)*16+(y&7)*2,v=pixels[y*8+x];raw[at]|=(v&1)<<(7-x);raw[at+1]|=(v>>1&1)<<(7-x);}}
 return raw;
}
export function plusPauseMenuWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('partida'))return rom;
 const value=state.additionalScreenTextsV1?.values?.['pause-menu']?.resume;if(value===undefined||String(value).toUpperCase()==='RESUME')return rom;
 const checks=[[0x1226BC,[0xA2,0x47,0xE9]],[0x1226C5,[0xA2,0x55,0xE9]],[0x1226EB,[0x22,0x37,0x8E,0x80]],[0x12278B,[0xB9,0,0,0xC9,255,255]]];
 for(const[pc,bytes]of checks)if(bytes.some((v,i)=>base[pc+i]!==v||rom[pc+i]!==v))throw Error('Pausa: leitor nativo divergente.');
 const raw=renderPauseResume(base,value),table=new Uint8Array(32);for(let row=0;row<2;row++){for(let x=0;x<7;x++){const v=0x1C0+row*7+x,at=row*16+x*2;table[at]=v&255;table[at+1]=v>>8;}table.set([255,255],row*16+14);}
 const writes=[[PAUSE_LABEL_SLOT,raw],[PAUSE_TABLE_SLOT,table],[PAUSE_LABEL_HELPER,pauseUploadHelper()],[PAUSE_TABLE_HELPER,pauseTableHelper()]];
 for(const[pc,data]of writes)if(rom.length<pc+data.length||rom.slice(pc,pc+data.length).some(v=>v!==255))throw Error('Pausa: reserva ocupada.');
 writes.push([0x1226BD,Uint8Array.of(0,0xF0)],[0x1226C6,Uint8Array.of(0x10,0xF0)],[0x1226EB,Uint8Array.from([0x22,...long(cpu(PAUSE_LABEL_HELPER))])],[0x12278B,Uint8Array.from([0x22,...long(cpu(PAUSE_TABLE_HELPER)),0xEA,0xEA])]);
 for(const[pc,data]of writes)rom.set(data,pc);return rom;
}
