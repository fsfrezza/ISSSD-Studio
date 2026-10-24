import{stripRetiredTeamExpansion}from'./retired-team-expansion.mjs';
import{konamiLzDecompress}from'./konami-lz.mjs';
import{nativeUniform}from'./team-uniforms.mjs';
import{readNativeAppearancePalettes}from'./player-appearance.mjs';
import{resolvePlusPlayerNameOffset}from'./plus-player-name.mjs';
import{resolvePlusTacticalRecord}from'./plus-tactics-address.mjs';
import{GOALKEEPER_PALETTE_SLOT,GOALKEEPER_SKIN_FLAGS}from'./plus-goalkeeper-palettes.mjs';
export const INDEPENDENT_TEAMS_SCHEMA='isssd-independent-teams-v1';
export const GG_TEAM_IDS=Object.freeze([54,55,56,57,58,59]);
export const GG_DEFAULT_SOURCES=Object.freeze([30,31,8,0,2,4]);
export const GG_DEFAULT_IDENTITIES=Object.freeze([
 {name:'ADIPOSOS',short:'ADI',primary:'#FF8000',secondary:'#101010'},
 {name:'BUGIGANGAS',short:'BUG',primary:'#001840',secondary:'#D82020'},
 {name:'ENCEFALICOS',short:'ENC',primary:'#101010',secondary:'#FFFFFF'},
 {name:'MACUCOS',short:'MAC',primary:'#FFFFFF',secondary:'#008040'},
 {name:'TELURICOS',short:'TEL',primary:'#0060D0',secondary:'#101010'},
 {name:'VAPOROSOS',short:'VAP',primary:'#FFE000',secondary:'#D82020'}
].map(Object.freeze));
const bgr=(hex,factor=1)=>{const channels=[1,3,5].map(p=>Math.max(0,Math.min(31,Math.round(parseInt(hex.slice(p,p+2),16)*factor/255*31))));return channels[0]|channels[1]<<5|channels[2]<<10;};
// Clothing starts at color 7. Never recolor the shared skin/hair indices 0–6.
export function independentKitColors(primary,secondary){
 if(!/^#[0-9a-f]{6}$/i.test(primary)||!/^#[0-9a-f]{6}$/i.test(secondary))throw Error('Cores da equipe inválidas.');
 return[...([.5,.75,1].map(f=>bgr(primary,f))),...([.5,.75,1].map(f=>bgr(secondary,f))),bgr(primary,.65),bgr(primary),bgr(secondary)];
}
export function applyIndependentKitColors(data,primary,secondary){
 const out=structuredClone(data);
 for(const[kit,a,b]of[['home',primary,secondary],['away',secondary,primary]]){
  const record=out.palettes[kit];if(!Array.isArray(record)||record.length<34)throw Error('Paleta completa do uniforme ausente.');
  independentKitColors(a,b).forEach((color,i)=>{record[2+(i+7)*2]=color&255;record[3+(i+7)*2]=color>>8;});
 }
 if(out.photo?.palettes?.[0]){
  const record=out.photo.palettes[0],colors=independentKitColors(primary,secondary);
  colors.slice(0,8).forEach((color,i)=>{record[2+i*2]=color&255;record[3+i*2]=color>>8;});
 }
 for(let kit=0;kit<2;kit++)for(const[index,hex,first]of[[2,kit?secondary:primary,1],[3,kit?primary:secondary,0],[4,kit?secondary:primary,1]]){
  const record=out.palettes.closeup?.[index]?.[kit];if(!record)continue;const n=(record.length-2)/2;
  for(let i=first;i<n;i++){const color=bgr(hex,Math.max(.15,1-(i-first)*.8/Math.max(1,n-first-1)));record[2+i*2]=color&255;record[3+i*2]=color>>8;}
 }
 return out;
}
const word=(b,p)=>b[p]|b[p+1]<<8,pc=c=>((c>>16&127)*32768)+(c&32767);
export function nativeFieldFlagPointer(rom,index){
 let at=0x127E00;while(rom[at]===0xE0&&rom[at+3]===0xD0&&rom[at+4]===4&&rom[at+5]===0xA9&&rom[at+8]===0x60){if(word(rom,at+1)===index)return word(rom,at+6);at+=9;}
 if(rom[at]!==0xBF||word(rom,at+1)!==0xFF20||rom[at+3]!==0x81)throw Error('Bandeiras: resolvedor Plus divergente.');return word(rom,0xFF20+index);
}
export function captureSelectionFlags(rom,team){
 const pointer=word(rom,0x17C34+team*2),out=[];
 for(let half=0;half<2;half++){
  let found=false;
  for(let at=0x17DFA;at<0x18000&&word(rom,at)!==65535;at+=6)if(word(rom,at)===pointer+half*96){const source=rom[at+3]|rom[at+4]<<8|rom[at+5]<<16,start=pc(source),decoded=konamiLzDecompress(rom,start);if(decoded.data.length!==96)throw Error('Bandeira de seleção inválida.');out.push({bytes:Array.from(decoded.data),planar:!!(rom[start+1]&128)});found=true;break;}
  if(!found)throw Error('Quadro de bandeira de seleção ausente.');
 }
 return out;
}
function paletteRecord(rom,pointer){if(pointer===0)return null;const at=0x48000+(pointer&32767),length=word(rom,at)+3;if(pointer<0x8000||length<4||length>258||at+length>rom.length)throw Error('Paleta nativa inválida.');return Array.from(rom.slice(at,at+length));}
export function captureIndependentTeam(rom,team){
 if(!(rom instanceof Uint8Array)||rom.length!==0x400000||!Number.isInteger(team)||team<0||team>=56)throw Error('Equipe fonte ou ROM preparada inválida.');
 const attributes=Array.from(rom.slice(0x150000+team*140,0x150000+(team+1)*140));
 const names=Array.from(rom.slice(resolvePlusPlayerNameOffset(rom,team,0),resolvePlusPlayerNameOffset(rom,team,0)+160));
 const r=resolvePlusTacticalRecord(rom,team);if(!r)throw Error('Formação da fonte ausente.');
 const uniforms=[0,1].map(kit=>nativeUniform(rom,team,kit)),appearance=readNativeAppearancePalettes(rom,team);
 const patternPointer=uniforms[0].layout,patternPc=0xC0000+(patternPointer&32767),pattern=patternPointer===0xF014?Array.from({length:8},()=>Array.from(rom.slice(patternPc,patternPc+32))).flat():Array.from(rom.slice(patternPc,patternPc+256));
 const palettes={home:paletteRecord(rom,word(rom,0x10274+team*2)),away:paletteRecord(rom,word(rom,0x10274+(team+57)*2)),skinAlt:paletteRecord(rom,word(rom,0x1043C+team*2)),hairAlt:paletteRecord(rom,word(rom,0x103CA+team*2)),keeper:paletteRecord(rom,word(rom,0x10358+team*2)),fieldFlag:paletteRecord(rom,word(rom,0xFE06+team*2))};
 for(const[table,base]of Object.entries({crowd:0x127AB0,flag:0x127C70,banner:0x127B90,bleacher:0x1278F0}))palettes[table]=Array.from({length:table==='bleacher'?4:2},(_,i)=>paletteRecord(rom,word(rom,base+team*(table==='bleacher'?8:4)+i*2)));
 palettes.closeup=Array.from({length:7},(_,t)=>Array.from({length:2},(_,kit)=>paletteRecord(rom,word(rom,0x479E0+t*224+team*4+kit*2))));
 const fieldFlags=[0,2].map(i=>{const pointer=nativeFieldFlagPointer(rom,team*4+i),at=0xD0000+(pointer&32767),d=konamiLzDecompress(rom,at);if(d.data.length!==96)throw Error('Bandeira: quadro nativo inesperado.');return{bytes:Array.from(d.data),planar:!!(rom[at+1]&128)};});
 const keeperPalettes=Array.from({length:20},(_,i)=>Array.from({length:11},(_,c)=>word(rom,GOALKEEPER_PALETTE_SLOT+(team*20+i)*22+c*2)));
 const keeperSkin=Array.from({length:20},(_,i)=>word(rom,GOALKEEPER_SKIN_FLAGS+(team*20+i)*2));
 return{photo:{bodyType:rom[0xFD5E+team],overlayType:rom[0xFBD1+team],extraType:rom[0xFC09+team],accessory:word(rom,0x17970+team*2),formationFlags:rom[0xFE78+team],faceType:rom[0xFB99+team],script1:word(rom,0x17608+team*2),script2:word(rom,0x17600+team*2),formation:word(rom,0xFE78+team*2),palettes:[...([0xFA49,0xFAB9,0xFD96].map(at=>paletteRecord(rom,word(rom,at+team*2)))),...[0,1].map(i=>paletteRecord(rom,word(rom,0x17945+rom[0xFB29+team*2+i])))]},selectionFlags:captureSelectionFlags(rom,team),attributes,names,tactics:Array.from(r.raw),palettes,pattern,patternPointer,fieldFlags,keeperPalettes,keeperSkin,appearance:appearance.palettes};
}
function bytes(value,size,label){if(!Array.isArray(value)||value.length!==size||value.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Dados independentes inválidos: '+label);}
export function validateIndependentTeams(value){
 if(value==null)return null;
 if(value.schema!==INDEPENDENT_TEAMS_SCHEMA||value.version!==1||value.group!=='GG'||!value.teams||Array.isArray(value.teams)||Object.keys(value.teams).length!==6)throw Error('Grupo independente inválido.');
 const out=stripRetiredTeamExpansion(value);
 for(const id of GG_TEAM_IDS){const t=out.teams[id];if(!t||t.teamId!==id||!Number.isInteger(t.sourceTeam)||t.sourceTeam<0||t.sourceTeam>=60||!t.data||typeof t.name!=='string'||!t.name.trim()||!/^[A-Z0-9 .-]{1,12}$/.test(t.big)||!/^[A-Z0-9 .-]{1,6}$/.test(t.short))throw Error('Identidade independente inválida: '+id);
  if(t.colors&&(!/^#[0-9a-f]{6}$/i.test(t.colors.primary)||!/^#[0-9a-f]{6}$/i.test(t.colors.secondary)))throw Error('Cores predominantes inválidas.');
  const d=t.data;if(d.palettes?.home){d.palettes.skinAlt??=[9,0,...d.palettes.home.slice(6,16)];d.palettes.hairAlt??=[1,0,...d.palettes.home.slice(4,6)];}
  for(const[k,n]of Object.entries({attributes:140,names:160,tactics:31,pattern:256}))bytes(d[k],n,k);
  for(const part of ['fieldFlags','selectionFlags']){if(!Array.isArray(d[part])||d[part].length!==2)throw Error('Bandeiras independentes inválidas.');for(const f of d[part]){bytes(f.bytes,96,'bandeira');if(typeof f.planar!=='boolean')throw Error('Plano de bandeira inválido.');}}
  if(!Array.isArray(d.keeperPalettes)||d.keeperPalettes.length!==20||d.keeperPalettes.some(p=>!Array.isArray(p)||p.length!==11||p.some(c=>!Number.isInteger(c)||c<0||c>32767)))throw Error('Goleiros independentes inválidos.');bytes(d.keeperSkin,20,'goleiros');
  function pal(p){if(p===null)return;if(!Array.isArray(p))throw Error('Paletas independentes inválidas.');if(p.every(Number.isInteger)){bytes(p,p.length,'paleta');if(p.length<4||(p.length&1)||word(p,0)+3!==p.length)throw Error('Tamanho de paleta independente inválido.');}else p.forEach(pal);}
  if(!d.photo||['bodyType','faceType','script1','script2','formation'].some(k=>!Number.isInteger(d.photo[k])||d.photo[k]<0||d.photo[k]>(k.endsWith('Type')?255:65535))||!Array.isArray(d.photo.palettes)||d.photo.palettes.length!==5)throw Error('Foto de equipe ausente.');pal(d.photo.palettes);
  for(const[k,max]of [['overlayType',255],['extraType',255],['accessory',65535],['formationFlags',255]])if(d.photo[k]!==undefined&&(!Number.isInteger(d.photo[k])||d.photo[k]<0||d.photo[k]>max))throw Error('Composição da foto inválida: '+k);
  for(const k of['home','away','skinAlt','hairAlt','keeper','fieldFlag','crowd','flag','banner','bleacher','closeup']){if(!(k in d.palettes))throw Error('Domínio de paleta ausente: '+k);pal(d.palettes[k]);}
 }
 return out;
}
export function createIndependentTeams(rom,sources=GG_DEFAULT_SOURCES,current=null){
 if(!Array.isArray(sources)||sources.length!==6)throw Error('Escolha seis equipes fonte.');const existing=validateIndependentTeams(current),teams={};
 GG_TEAM_IDS.forEach((teamId,i)=>{const sourceTeam=Number(sources[i]);if(!Number.isInteger(sourceTeam)||sourceTeam<0||sourceTeam>=56&&!existing?.teams[sourceTeam])throw Error('Equipe fonte inválida.');const data=existing?.teams[sourceTeam]?.data??captureIndependentTeam(rom,sourceTeam);const identity=GG_DEFAULT_IDENTITIES[i];teams[teamId]={teamId,sourceTeam,name:identity.name,big:identity.name,short:identity.short,colors:{primary:identity.primary,secondary:identity.secondary},data:applyIndependentKitColors(data,identity.primary,identity.secondary)};});
 return validateIndependentTeams({schema:INDEPENDENT_TEAMS_SCHEMA,version:1,group:'GG',teams});
}

// Old project saves can retain sixty UI labels while omitting the actual team
// records. Such labels must never be treated as proof that ROM support exists.
export function independentTeamLabelsNeedRecovery(project){
 const sem=project?.state?.semantic??project?.semantic??{};
 return !sem.independentTeamsV1&&project?.base?.profile==='iss-deluxe-plus'&&Array.isArray(project?.state?.ui?.teamNames)&&project.state.ui.teamNames.length>56;
}
