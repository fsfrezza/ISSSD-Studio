import {CUSTOM_HAIR_MANUAL_FRAMES} from './player-hair-manual.mjs';
// Deluxe Plus: 13 optional head overlays, 24 native 8x8 tiles per style.
// Code zero selects the regenerated bald body; 14 restores the original hair.
export const NATIVE_HAIR_COUNT=16;
export const NATIVE_HAIR_FRAMES=24;
export const NATIVE_SKIN_PRESETS=Object.freeze([
 {id:'clara',label:'Clara',pointer:0x8342},
 {id:'palida',label:'Pálida',pointer:0x834E},
 {id:'morena',label:'Morena',pointer:0x835A},
 {id:'escura',label:'Escura',pointer:0x8366},
]);
function appearanceHeader(rom){return rom.length%0x8000===0x200?0x200:0;}
function appearancePc(cpu){return ((cpu>>>16)&127)*0x8000+(cpu&0x7FFF);}
function appearanceWord(rom,pc){const at=appearanceHeader(rom)+pc;if(at<0||at+2>rom.length)throw Error('Aparência: endereço fora da ROM.');return rom[at]|rom[at+1]<<8;}
function appearanceLong(rom,pc){return appearanceWord(rom,pc)|(rom[appearanceHeader(rom)+pc+2]<<16);}
export function validatePlayerAppearance(value){
 if(!value||!Number.isInteger(value.hair)||value.hair<0||value.hair>=NATIVE_HAIR_COUNT)throw Error('Escolha um cabelo de 0 a 15.');
 if(value.palette!==0&&value.palette!==1)throw Error('Escolha a paleta 0 ou 1.');
 return {hair:value.hair,palette:value.palette};
}
export function appearanceBgrHex(v){return '#'+[0,5,10].map(s=>Math.round((v>>s&31)*255/31).toString(16).padStart(2,'0')).join('');}
function appearancePaletteRecord(rom,pointer,count){
 const pc=appearancePc(0x890000|pointer),size=appearanceWord(rom,pc)+1;
 if(size!==count*2)throw Error('Aparência: bloco de paleta nativa divergente.');
 return Array.from({length:count},(_,i)=>appearanceWord(rom,pc+2+i*2));
}
function appearanceTable(rom,instruction){
 const at=appearanceHeader(rom)+instruction;
 if(rom[at]!==0xBF)throw Error('Aparência: leitor de paleta Plus divergente.');
 const cpu=appearanceLong(rom,instruction+1);
 if(cpu>>>16!==0x82)throw Error('Aparência: tabela de paletas fora do banco verificado.');
 return appearancePc(cpu);
}
export function readNativeAppearancePalettes(rom,team,{goalkeeper=false,kit=0}={}){
 if(!Number.isInteger(team)||team<0||team>=56||![0,1].includes(kit))throw Error('Aparência: equipe ou conjunto inválido.');
 const primary=appearanceTable(rom,goalkeeper?0x5D06E:0x5CFD0),count=goalkeeper?11:16;
 const pointer=appearanceWord(rom,primary+(team+(goalkeeper?0:kit*56))*2);
 const first=appearancePaletteRecord(rom,pointer,count),second=first.slice();
 let skinPointer=0,hairPointer=0;
 if(!goalkeeper){
  skinPointer=appearanceWord(rom,appearanceTable(rom,0x5CFEA)+team*2);
  hairPointer=appearanceWord(rom,appearanceTable(rom,0x5CFFB)+team*2);
  if(skinPointer){const skin=appearancePaletteRecord(rom,skinPointer,5);second.splice(2,5,...skin);}
  if(hairPointer){const hair=appearancePaletteRecord(rom,hairPointer,1);second[1]=hair[0];}
 }
 return {palettes:[first,second],colors:[first,second].map(p=>p.map(appearanceBgrHex)),skinPointer,hairPointer,goalkeeper,identical:first.every((v,i)=>v===second[i]),presets:NATIVE_SKIN_PRESETS.map(p=>({...p,colors:appearancePaletteRecord(rom,p.pointer,5).map(appearanceBgrHex)}))};
}
export function decodeNativeHairTile(rom,hair,frame=0){
 validatePlayerAppearance({hair,palette:0});
 if(!Number.isInteger(frame)||frame<0||frame>=NATIVE_HAIR_FRAMES)throw Error('Aparência: quadro de cabelo inválido.');
 if(hair===0)return null;
 if(hair>=14)return customHairPixels(rom,hair,frame);
 const source=appearanceLong(rom,0xED6D+(hair-1)*4);
 if(source>>>16!==0x97)throw Error('Aparência: gráficos de cabelo fora do banco nativo.');
 const pc=appearanceHeader(rom)+appearancePc(source)+frame*32;
 if(pc<0||pc+32>rom.length)throw Error('Aparência: gráfico fora da ROM.');
 const pixels=new Uint8Array(64);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let plane=0;plane<4;plane++)pixels[y*8+x]|=((rom[pc+(plane>>1)*16+y*2+(plane&1)]>>(7-x))&1)<<plane;
 return pixels;
}
export function setProjectPlayerAppearance(state,team,identity,value,original={}){
 const nextValue=validatePlayerAppearance(value);
 if(state?.schema!=='isssd-teams-v1'||Number(state.version)!==3)throw Error('Aparência: projeto de equipes indisponível.');
 const next=JSON.parse(JSON.stringify(state)),player=next.teams?.[String(team)]?.players?.find(p=>p.playerId===identity?.playerId&&Number(p.baseSlot)===Number(identity?.baseSlot));
 if(!player)throw Error('Aparência: identidade do jogador não encontrada.');
 player.custom||={};player.custom.appearance||={};
 for(const key of ['hair','palette']){if(nextValue[key]===original[key])delete player.custom.appearance[key];else player.custom.appearance[key]=nextValue[key];}
 if(!Object.keys(player.custom.appearance).length)delete player.custom.appearance;
 if(!Object.keys(player.custom).length)delete player.custom;
 return next;
}

// Resolve both values before writing either side. A failed transfer never changes state.
export function transferProjectPlayerAppearance(state,source,target,mode,originalFor){
 if(!['copy','swap'].includes(mode))throw Error('Aparência: operação inválida.');
 if(typeof originalFor!=='function')throw Error('Aparência: leitor original indisponível.');
 const read=ref=>{
  const team=Number(ref?.team),id=ref?.identity;
  if(!Number.isInteger(team)||team<0||team>=56)throw Error('Aparência: equipe inválida.');
  const player=state?.teams?.[String(team)]?.players?.find(p=>p.playerId===id?.playerId&&Number(p.baseSlot)===Number(id?.baseSlot));
  if(!player)throw Error('Aparência: identidade do jogador não encontrada.');
  const original=originalFor(team,Number(player.baseSlot));
  return {team,identity:{playerId:player.playerId,baseSlot:player.baseSlot},original,value:validatePlayerAppearance({...original,...player.custom?.appearance})};
 };
 const a=read(source),b=read(target);
 if(a.team===b.team&&a.identity.playerId===b.identity.playerId&&Number(a.identity.baseSlot)===Number(b.identity.baseSlot))throw Error('Escolha dois jogadores diferentes.');
 let next=setProjectPlayerAppearance(state,b.team,b.identity,a.value,b.original);
 if(mode==='swap')next=setProjectPlayerAppearance(next,a.team,a.identity,b.value,a.original);
 return next;
}

// Hair overlays contain no replacement skin in the bald-base model.
export function customHairPixels(rom,hair,frame=0){
 if(hair!==14&&hair!==15)throw Error('Cabelo novo inválido.');
 if(!Number.isInteger(frame)||frame<0||frame>=24)throw Error('Quadro inválido.');
 const frames=CUSTOM_HAIR_MANUAL_FRAMES[hair];
 if(!frames||frames.length!==24||frames.some(f=>f.length!==64||f.some(v=>!Number.isInteger(v)||v<0||v>15)))throw Error('Quadros manuais inválidos.');
 return Uint8Array.from(frames[frame]);
}
export function hairStyleLabel(hair){return hair===14?'14 · Cabelo original':hair===15?'Cascão · Ronaldo':hair===0?'0 · Careca (base)':'Tipo '+hair;}

export const BALD_APPEARANCE_MODEL='bald-base-v1';
export function originalHairInBaldModel(hair){return hair===0?14:hair;}
export function migrateBaldAppearanceTeams(state){
 if(!state||state.appearanceModel===BALD_APPEARANCE_MODEL)return state;
 const out=JSON.parse(JSON.stringify(state));out.appearanceModel=BALD_APPEARANCE_MODEL;
 for(const team of Object.values(out.teams||{}))for(const p of team.players||[]){
  for(const a of [p.custom?.appearance,p.appearance])if(a&&Object.hasOwn(a,'hair'))a.hair=a.hair===0?14:a.hair===14?0:a.hair;
 }
 const drawings=out.spriteEdits?.hair;if(drawings){
  for(const [key,pixels]of Object.entries(drawings)){
   if(key.startsWith('14:')){(out.legacyBaldHeadDrawings||={})[key]=pixels;delete drawings[key];}
   if(key.startsWith('15:'))drawings[key]=pixels.map(v=>v===1?1:0);
  }
 }
 return out;
}
