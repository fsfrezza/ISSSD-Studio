import{validateGoalkeeperPalettes,defaultGoalkeeperPalette}from'./goalkeeper-palettes.mjs';
export const GOALKEEPER_PALETTE_SLOT=0x2A0000,GOALKEEPER_PALETTE_END=0x2A7C00;
const cpu=p=>((128+(p>>>15))<<16)|32768|(p&32767),word=v=>[v&255,v>>>8&255],long=v=>[...word(v),v>>>16&255];
export const GOALKEEPER_PALETTE_HOOKS=[{pc:0x5D076,mode:'side1',helper:0x2A7000},{pc:0x5D090,mode:'side2',helper:0x2A7200},{pc:0xC78FD,mode:'preview',helper:0x2A7400}];
export const GOALKEEPER_SKIN_FLAGS=0x2A6200;
export const GOALKEEPER_SKIN_HOOKS=[{pc:0x5D081,helper:0x2A7600},{pc:0x5D09B,helper:0x2A7800},{pc:0xC790C,helper:0x2A7A00}];
export function goalkeeperPalettesSupported(base){return base[0x5D06E]===0xBF&&base[0x5D06F]===0x58&&base[0x5D070]===0x83&&base[0x5D071]===0x82&&GOALKEEPER_PALETTE_HOOKS.every(h=>[0x22,0xEF,0xD0,0x8B].every((v,i)=>base[h.pc+i]===v));}
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...v){this.b.push(...v);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){if(op!==0x80)this.put(({0xD0:0xF0,0xF0:0xD0,0x90:0xB0,0xB0:0x90})[op],3);this.put(0x82);this.refs.push([this.b.length,n]);return this.put(0,0);}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-2;this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}
export function goalkeeperPaletteHelper(mode){
 if(!['side1','side2','preview'].includes(mode))throw Error('Modo inválido.');const c=new Code();
 // Keep native args and flags. The original caller's PHD in Skills is 16,S below these saves.
 c.put(0x8B,0xDA,0x5A,0x08,0x48,0xD8,0xAA,0xBF,...long(0x819176),0x48,0xA3,8,0x29,255,0,0xC9,112,0).branch(0xB0,'invalid');
 // Native X is teamId*2. X*10 = teamId*20, without touching live WRAM scratch.
 c.put(0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0x48);
 if(mode==='preview')c.put(0xA3,16,0x18,0x69,0x34,0,0xAA,0xBF,...long(0x7E0000));else c.put(0xAF,...long(mode==='side1'?0x7E3F90:0x7E3FA4));
 c.put(0x29,31,0,0xC9,20,0).branch(0xB0,'invalidTeam').put(0x18,0x63,1,0xFA);
 // Each selected player's 11 words occupy 22 bytes. All 1120 palettes fit one LoROM bank.
 c.put(0x0A,0x48,0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0x18,0x63,1,0xFA,0x18,0x69,0,0x80,0xAA,0x7A,0x68,0x28,0xF4,0xD4,0,0xAB,0x28,0xA9,21,0,0x54,0x7E,0xD4,0x7A,0xFA,0xAB,0x6B);
 c.label('invalidTeam').put(0x68);c.label('invalid').put(0x68,0x68,0x28,0x7A,0xFA,0xAB,0x5C,0xEF,0xD0,0x8B);
 const data=c.finish();if(data.length>512)throw Error('Helper excede reserva.');return data;
}
// Run the native skin routine first: it also changes registers, flags and DP
// scratch used by the caller. Then reapply an explicit palette while retaining
// the exact post-native context. Merely skipping the call violates that ABI.
export function goalkeeperSkinHelper(){const c=new Code();
 // Original args X/Y/A, native call, then post-native P/DB/X/Y/A.
 c.put(0xDA,0x5A,0x48,0x22,0x10,0xD1,0x8B,0x08,0x8B,0xDA,0x5A,0x48,0xD8,
  0xA3,13,0x29,255,0,0xC9,112,0).branch(0xB0,'done');
 c.put(0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0x48,0xA3,11,0x29,255,0,0xC9,20,0).branch(0xB0,'drop');
 c.put(0x18,0x63,1,0xFA,0x48,0x0A,0xAA,0xBF,...long(cpu(GOALKEEPER_SKIN_FLAGS))).branch(0xF0,'drop');
 // Original Y is the side offset (0/4); native destinations are 30/34.
 c.put(0xA3,13,0x18,0x69,0x30,0,0xAA,0xBF,...long(0x819176),0x48,0xA3,3,
  0x0A,0x48,0x0A,0x48,0x0A,0x0A,0x18,0x63,1,0xFA,0x18,0x63,1,0xFA,
  0x18,0x69,0,0x80,0xAA,0x7A,0x68,0xF4,0xD4,0,0xAB,0x28,0xA9,21,0,0x54,0x7E,0xD4).branch(0x80,'done');
 c.label('drop').put(0x68);c.label('done');
 // Compact the saved post-native frame over the six bytes of original args.
 // Copy backwards so overlapping source words remain intact; no WRAM scratch.
 for(const offset of[7,5,3,1])c.put(0xA3,offset,0x83,offset+6);
 c.put(0x68,0x68,0x68,0x68,0x7A,0xFA,0xAB,0x28,0x6B);
 const data=c.finish();if(data.length>512)throw Error('Helper de pele excede reserva.');return data;
}
export function plusGoalkeeperPalettesWriter(rom,state,base,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('jogadores'))return rom;
 const palettes=validateGoalkeeperPalettes(state.goalkeeperPalettesV1);
 if(!goalkeeperPalettesSupported(base)){if(Object.keys(palettes.players).length)throw Error('ROM sem mapeamento de goleiros Plus verificado.');return rom;}
 if(rom.length!==0x400000)throw Error('Uniformes individuais de goleiros exigem 4 MB.');
 const writes=[],data=new Uint8Array(56*20*22),flags=new Uint8Array(56*20*2);
 for(let team=0;team<56;team++){const defaults=defaultGoalkeeperPalette(base,team),players=state.teamsV1?.teams?.[team]?.players||[];for(let slot=1;slot<=20;slot++){
  const player=players.find(p=>Number(p.slot)===slot),identity=Number(player?.baseSlot??String(player?.playerId||'').split(':')[1])||slot,key=team+':'+identity,colors=palettes.players[key]?.colors||defaults,at=(team*20+slot-1)*22;if(palettes.players[key])flags.set(word(1),(team*20+slot-1)*2);for(let i=0;i<11;i++)data.set(word(colors[i]),at+i*2);
 }}
 writes.push({pc:GOALKEEPER_PALETTE_SLOT,data},{pc:GOALKEEPER_SKIN_FLAGS,data:flags});for(const h of GOALKEEPER_SKIN_HOOKS){if(![0x22,0x10,0xD1,0x8B].every((v,i)=>rom[h.pc+i]===v))throw Error("Leitor de pele de goleiro divergente em "+h.pc.toString(16));writes.push({pc:h.helper,data:goalkeeperSkinHelper()},{pc:h.pc,data:Uint8Array.from([0x22,...long(cpu(h.helper))])});}for(const h of GOALKEEPER_PALETTE_HOOKS){if(![0x22,0xEF,0xD0,0x8B].every((v,i)=>rom[h.pc+i]===v))throw Error('Leitor de goleiro já alterado.');writes.push({pc:h.helper,data:goalkeeperPaletteHelper(h.mode)},{pc:h.pc,data:Uint8Array.from([0x22,...long(cpu(h.helper))])});}
 for(const w of writes)if(w.pc>=GOALKEEPER_PALETTE_SLOT&&!rom.slice(w.pc,w.pc+w.data.length).every(v=>v===255))throw Error('Espaço dos uniformes de goleiros ocupado.');for(const w of writes)rom.set(w.data,w.pc);return rom;
}
