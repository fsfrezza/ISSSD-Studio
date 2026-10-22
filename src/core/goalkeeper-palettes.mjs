// Pure project model and verified Plus palette mapping; usable in the browser.
export const GOALKEEPER_PALETTE_SCHEMA='isssd-goalkeeper-palettes-v1';
export const GOALKEEPER_SHIRT_SLOTS=[5,6,7,8];
export function goalkeeperBgrHex(v){return '#'+[0,5,10].map(s=>Math.round((v>>s&31)*255/31).toString(16).padStart(2,'0')).join('');}
export function goalkeeperHexBgr(hex){if(!/^#[0-9a-f]{6}$/i.test(hex))throw Error('Cor inválida.');return [1,3,5].reduce((v,s,i)=>v|(Math.round(parseInt(hex.slice(s,s+2),16)*31/255)<<(i*5)),0);}
export function validateGoalkeeperPalettes(value){
 if(value==null)return{schema:GOALKEEPER_PALETTE_SCHEMA,version:1,players:{}};
 if(value.schema!==GOALKEEPER_PALETTE_SCHEMA||value.version!==1||!value.players||typeof value.players!=='object'||Array.isArray(value.players))throw Error('Paletas de goleiros: formato inválido.');
 const out={schema:GOALKEEPER_PALETTE_SCHEMA,version:1,players:{}};
 for(const[key,entry]of Object.entries(value.players)){const m=key.match(/^(\d+):(\d+)$/),team=Number(m?.[1]),baseSlot=Number(m?.[2]);if(!m||team<0||team>=56||baseSlot<1||baseSlot>20||String(team)+':'+baseSlot!==key||!Array.isArray(entry?.colors)||entry.colors.length!==11||entry.colors.some(v=>!Number.isInteger(v)||v<0||v>32767))throw Error('Paleta de goleiro inválida: '+key);out.players[key]={colors:entry.colors.slice()};}
 return out;
}
export function nativeGoalkeeperPalette(rom,team){
 if(!Number.isInteger(team)||team<0||team>=56)throw Error('Equipe inválida.');
 if(rom[0x5D06E]!==0xBF)throw Error('Leitor de paleta de goleiro divergente.');const cpu=rom[0x5D06F]|rom[0x5D070]<<8|rom[0x5D071]<<16;if(cpu!==0x828358)throw Error('Tabela de goleiros não verificada.');
 const pointer=rom[0x10358+team*2]|rom[0x10359+team*2]<<8,pc=0x48000+(pointer&32767);if((rom[pc]|rom[pc+1]<<8)!==21)throw Error('Paleta de goleiro Plus deve ter 11 cores.');
 return Array.from({length:11},(_,i)=>rom[pc+2+i*2]|rom[pc+3+i*2]<<8);
}
export function defaultGoalkeeperPalette(rom,team){const colors=nativeGoalkeeperPalette(rom,team);if(team===30)colors.splice(5,4,0x0880,0x0CE0,0x1140,0x15A0);return colors;}
export function projectGoalkeeperPalette(rom,state,team,baseSlot){const data=validateGoalkeeperPalettes(state);return data.players[team+':'+baseSlot]?.colors.slice()||defaultGoalkeeperPalette(rom,team);}
export function goalkeeperShirtRamp(hex){const v=goalkeeperHexBgr(hex),channels=[0,5,10].map(s=>v>>s&31);return[0.35,0.55,0.8,1].map(k=>channels.reduce((c,n,i)=>c|(Math.round(n*k)<<(i*5)),0));}

// Photo reference colors, with the native embedded goalkeeper hair (no overlay).
export function brazilGoalkeeperReference(rom,baseSlot){
 if(![1,12].includes(baseSlot))throw Error('Referência disponível para Taffarel e Gilmar.');
 const colors=defaultGoalkeeperPalette(rom,30),skin=baseSlot===1?['#B5945A','#795039','#AD7952','#DEAD7B','#FFE7BD']:['#211C19','#63412D','#94613F','#C68C5A','#EFBD84'];
 colors.splice(0,5,...skin.map(goalkeeperHexBgr));colors.splice(9,2,goalkeeperHexBgr('#101821'),goalkeeperHexBgr('#294239'));
 return{colors,hair:0};
}
