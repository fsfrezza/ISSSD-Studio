import {applyAppearanceChoice} from './player-color-catalog.mjs';
import{stableFieldFlag}from'./field-flag-colors.mjs';
import{independentFlagPixels}from'./independent-team-fields.mjs';
import{validateTeamFlags,flagPixelsToStreams}from'./team-flags.mjs';
import{validateIndependentTeams,GG_TEAM_IDS,nativeFieldFlagPointer,captureSelectionFlags}from'./independent-teams.mjs';
import{konamiLzCompress,konamiLzDecompress}from'./konami-lz.mjs';
import{transformLabelPlanes}from'./plus-graphical-labels.mjs';
import{renderBigTeamNames,renderSmallTeamName,normalizeTeamName,TEAM_NAME_REGIONS}from'./plus-team-names.mjs';
import{convertedTeamNameOam,TEAM_NAME_CACHE_SLOT,TEAM_NAME_HOOK_SLOT,TEAM_NAME_CACHE_PLANE}from'./plus-team-name-hooks.mjs';
import{PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC}from'./plus-tactics-address.mjs';
import{plusGroupTitlesWriter}from'./plus-group-titles.mjs';
import{planPlusGroupIdentity,readPlusGroupIdentity}from'./plus-group-identity.mjs';
import{TEAM_NAME_LANGUAGE_PRESETS}from'./team-name-presets.mjs';
import{GOALKEEPER_PALETTE_SLOT,GOALKEEPER_SKIN_FLAGS}from'./plus-goalkeeper-palettes.mjs';
import{CLOSEUP_PALETTE_SLOT,CLOSEUP_STYLE_SLOT,CLOSEUP_HELPER_SLOT,closeupPalette}from'./plus-player-closeup.mjs';
export const INDEPENDENT_TABLES_SLOT=0x2D8000,INDEPENDENT_PALETTES_SLOT=0x2E0000,INDEPENDENT_PATTERNS_SLOT=0x2E8000,INDEPENDENT_FLAGS_SLOT=0x2F0000,INDEPENDENT_KEEPERS_SLOT=0x2F8000;
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),pc=c=>((c>>16&127)*32768)+(c&32767),word=v=>[v&255,v>>8&255],long=v=>[...word(v),v>>16&255],readWord=(b,p)=>b[p]|b[p+1]<<8;
class Code{constructor(){this.b=[];this.labels={};this.refs=[];}put(...b){this.b.push(...b);return this;}label(n){this.labels[n]=this.b.length;return this;}branch(op,n){if(op!==0x80)this.put(({0xD0:0xF0,0xF0:0xD0,0x90:0xB0,0xB0:0x90})[op],3);this.put(0x82);this.refs.push([this.b.length,n]);return this.put(0,0);}finish(){for(const[at,n]of this.refs){const d=this.labels[n]-at-2;this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}
export function independentPaletteCopyHelper(){
 const c=new Code();c.put(0xC0,0,0x60).branch(0x90,'native');c.put(0xC0,0,0x80).branch(0xB0,'native');
 // The original dispatcher entered via JML with PHB/PHX/PHY already saved.
 c.put(0x5A,0x29,0xFE,0,0xAA,0xBF,...long(0x819176),0xA8,0xFA,0x8A,0x09,0,0x80,0xAA,0xBF,...long(cpu(INDEPENDENT_PALETTES_SLOT)&0xFF0000),0xE8,0xE8,0x54,0x7E,cpu(INDEPENDENT_PALETTES_SLOT)>>16,0x7A,0xFA,0xAB,0x6B);
 c.label('native').put(0x29,0xFE,0,0xAA,0x5C,0xF3,0xA4,0x80);return c.finish();
}
// Native uniform menus also perform fixed-size copies outside the palette dispatcher.
export function independentUniformCopyHelper(count){
 const c=new Code();c.put(0x08,0x8B,0x8A,0xC9,0,0x60).branch(0x90,'native');c.put(0xC9,0,0x80).branch(0xB0,'native');
 c.put(0x09,0,0x80,0xAA,0xA9,...word(count-1),0x54,0x7E,0xDC).branch(0x80,'done');
 c.label('native').put(0xA9,...word(count-1),0x54,0x7E,0x89);c.label('done').put(0xAB,0x28,0x6B);return c.finish();
}
// A number/blank detail still belongs to bank $98. Only a team's custom
// overlay (X = doubled team ID) is stored in the expanded pattern bank.
export function independentUniformBankHelper(){
 const c=new Code();c.put(0x08,0xC9,0x14,0xF0).branch(0xF0,'native');c.put(0xE0,108,0).branch(0x90,'native');c.put(0xE0,120,0).branch(0xB0,'native');
 c.put(0xA5,0x57,0x29,255,0,0xC9,108,0).branch(0x90,'native');c.put(0xC9,120,0).branch(0xB0,'native');
 c.put(0x28,0xA9,0x80,0xDD,0x6B);c.label('native').put(0x28,0xA9,0x80,0x98,0x6B);return c.finish();
}
// The three tactical pointer readers already use a per-team bank selector.
// The two following MVNs must use that same bank, rather than literal $8B.
export function independentTacticalCopyHelper(){
 // CODE_8585F7 overwrites $04 with formationIndex*10 before the role MVN.
 // $00 still holds the doubled team ID set by the enclosing loader. Resolve
 // its bank afresh for both copies instead of trusting the reused scratch word.
 const c=new Code();c.put(0x08,0x8B,0x48,0xDA,0xA5,0,0x29,0xFE,0,0xAA,0xBF,...long(cpu(PLUS_TACTICAL_BANK_SELECTOR_TABLE_PC)),0x29,255,0,0xFA);
 for(const bank of [0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xDD])c.put(0xC9,bank,0).branch(0xF0,'bank'+bank);
 c.put(0x68,0x54,0x7E,0x8B).branch(0x80,'done');
 for(const bank of [0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xDD])c.label('bank'+bank).put(0x68,0x54,0x7E,bank).branch(0x80,'done');
 c.label('done').put(0xAB,0x28,0x6B);return c.finish();
}
export function independentTeamNameHelper(pointers,cache,plane,slotOffset,slotSize){
 const c=new Code();c.put(0x08,0x8B,0xDA,0x5A,0xE0,108,0).branch(0x90,'native');
 for(let i=0;i<6;i++)c.put(0xE0,...word((54+i)*2)).branch(0xF0,'team'+i);
 c.branch(0x80,'native');
 for(let i=0;i<6;i++){
  c.label('team'+i).put(0x8A,0xCF,0xA0,0x0D,0x7E).branch(0xF0,'first'+i);
  c.branch(0x80,'second'+i);
  for(const[side,offset]of[['first',slotOffset],['second',slotOffset+slotSize]]){
   c.label(side+i);
   for(let p=0;p<4;p++){
    const source=cpu(cache+p*plane+pointers[i]);
    c.put(0xA2,...word(source),0xAF,0xF8,0x5F,0x7E,0x18,0x69,...word(offset+p*0x2000),0xA8,0xA9,...word(slotSize-1),0x54,0x7E,source>>16);
   }
   c.put(0xA9,...word(offset)).branch(0x80,'finish');
  }
 }
 c.label('native').put(0xBF,...long(cpu(pointers.table)));
 c.label('finish').put(0x18,0x6F,0xF8,0x5F,0x7E,0x7A,0xFA,0xAB,0x28,0x09,0,0,0x6B);
 return c.finish();
}
// Handicap uses its own two uploads, not the scoreboard or group-list path.
export function independentPreMatchNameHelper(cache){
 return Uint8Array.from([0x29,255,0,0x0A,0x0A,0x0A,0x0A,0x0A,0x18,0x69,...word(cpu(cache)),0x48,0xA9,cpu(cache)>>16,0,0x85,0,0xBF,0xF7,0xF7,0x82,0xA8,0xA2,64,0,0x68,0x22,0x37,0x8E,0x80,0x6B]);
}
export function independentShortNameHelper(cache){
 const c=new Code();c.put(0x08,0xE0,0xD0,0x17).branch(0xF0,'score');
 c.put(0x28,0xA0,0,0,0xAD,0,1,0x5C,0x2D,0xB5,0x80);
 c.label('score').put(0x28,0x08,0x8B,0x48,0xDA,0x5A,0xA5,0,0x48,0xA9,cpu(cache)>>16,0,0x85,0);
 for(const[offset,destination]of[[0x17D4,0x5F50],[0x17D9,0x5FD0]])c.put(0xAF,...long(0x7E0000+offset),0x18,0x69,...word(cpu(cache)),0xA2,64,0,0xA0,...word(destination),0x22,0x37,0x8E,0x80);
 c.put(0x68,0x85,0,0x7A,0xFA,0x68,0xAB,0x28,0x6B);return c.finish();
}
// Only these directories are indexed by team. F600/F608 are indexed by
// face type and must retain the native type directory, not a team directory.
export const INDEPENDENT_PHOTO_DIRECTORIES=Object.freeze([
 ['bodyType',0xFD5E,1,0],['faceType',0xFB99,1,0],
 ['overlayType',0xFBD1,1,0],['extraType',0xFC09,1,255],
 ['accessory',0x17970,2,65535],['formationFlags',0xFE78,1,0],
].map(v=>Object.freeze(v)));
export function independentPhotoDirectory(rom,teams,key,address,stride,fallback){
 const values=Array.from({length:60},(_,id)=>teams[id]?(teams[id].photo[key]??fallback):stride===1?rom[address+id]:readWord(rom,address+id*2));
 return Uint8Array.from(stride===1?values:values.flatMap(word));
}
function pointerReads(base,address){const a=long(address),found=[];for(let i=0;i<base.length-4;i++)if(base[i]===0xBF&&a.every((v,j)=>base[i+1+j]===v))found.push(i);return found;}
function patchPattern(rom,from,to){for(let i=0;i<=rom.length-from.length;i++)if(from.every((v,j)=>rom[i+j]===v)){rom.set(to,i);i+=from.length-1;}}
export function plusIndependentTeamsWriter(input,state,base,selectedAreas=null){
 const model=validateIndependentTeams(state.independentTeamsV1);if(!model||selectedAreas&&!selectedAreas.includes('jogadores'))return input;
 if(input.length!==0x400000||base[0x4F2D]!==0xE0||readWord(base,0x4F2E)!==112)throw Error('Expansão de equipes exige a Plus verificada de 4 MiB.');
 // Work on a detached copy: all allocations and native checks finish atomically.
 const rom=input.slice();for(const[start,end]of[[0x2D8000,0x300000]])if(rom.slice(start,end).some(v=>v!==255))throw Error('Reserva das equipes independentes ocupada.');
 let tableNext=INDEPENDENT_TABLES_SLOT,paletteNext=INDEPENDENT_PALETTES_SLOT+0x6000,flagNext=INDEPENDENT_FLAGS_SLOT;
 const table=data=>{if(tableNext+data.length>INDEPENDENT_PALETTES_SLOT)throw Error('Tabelas independentes excederam o banco.');const at=tableNext;rom.set(data,at);tableNext=(at+data.length+1)&~1;return at;};
 const pal=data=>{if(data===null)return 0;const at=paletteNext;if(at+data.length>INDEPENDENT_PATTERNS_SLOT)throw Error('Paletas independentes excederam o banco.');rom.set(data,at);paletteNext=(at+data.length+1)&~1;return at-INDEPENDENT_PALETTES_SLOT;};
 const flag=data=>{if(flagNext+data.length>INDEPENDENT_KEEPERS_SLOT)throw Error('Bandeiras excederam o banco.');const at=flagNext;rom.set(data,at);flagNext=(at+data.length+1)&~1;return cpu(at)&65535;};
 const hook=(at,bytes)=>rom.set(bytes,at),redirectLong=(original,destination,sites=pointerReads(base,original))=>{for(const at of sites){if(base[at]!==0xBF)throw Error('Leitor nativo divergente.');rom.set(long(cpu(destination)),at+1);}return sites;};
 const longLoad=(at,register,destination)=>{const original=rom.slice(at,at+3);if(register!=='y'||original[0]!==0xBC)throw Error('Leitor absoluto de paleta divergente em '+at.toString(16));
  // LDY abs,X followed by JSL native palette-copy: replace both calls with one wrapper.
  if(rom[at+3]!==0x22)throw Error('Chamada de paleta adjacente divergente.');const target=Array.from(rom.slice(at+4,at+7));const wrapper=table(Uint8Array.from([0x48,0xBF,...long(cpu(destination)),0xA8,0x68,0x22,...target,0x6B]));hook(at,Uint8Array.from([0x22,...long(cpu(wrapper)),0xEA,0xEA,0xEA]));
 };
 const flagEdits=validateTeamFlags(state.teamFlagsV1).teams;
 const data=Object.fromEntries(GG_TEAM_IDS.map(id=>[id,model.teams[id].data]));
 const stableFlags=Object.fromEntries([...GG_TEAM_IDS.map(id=>{const d=data[id],colors=Array.from({length:4},(_,i)=>readWord(d.palettes.fieldFlag,2+i*2));return[id,stableFieldFlag(independentFlagPixels(model.teams[id],'fieldFlags'),colors)];}),...Object.entries(flagEdits).map(([id,v])=>[id,stableFieldFlag(v.fieldPixels,v.colors)])]);
 // The native player bank has room for four added normal records, previously unused.
 for(const id of GG_TEAM_IDS){const d=data[id];const count=Array.from({length:11},(_,i)=>d.attributes[i*7+6]&15).filter(h=>h>0&&h<14).length;if(count>3)throw Error('Equipe GG '+id+': até três titulares podem usar os cabelos nativos 1–13.');const attrs=Uint8Array.from(d.attributes);for(let i=0;i<20;i++)if(attrs[i*7+4]>>4===1)attrs[i*7+6]&=240;rom.set(attrs,0x150000+id*140);}
 // All sixty name records are copied to a private bank with a complete pointer table.
 const nameData=new Uint8Array(60*160);for(let id=0;id<60;id++){if(data[id])nameData.set(data[id].names,id*160);else{const p=readWord(rom,0x38138+id*2);nameData.set(rom.slice(0x170000+p,0x170000+p+160),id*160);}}
 const names=table(nameData),namePointers=table(Uint8Array.from(Array.from({length:60},(_,i)=>word((cpu(names)&65535)+i*160)).flat()));redirectLong(0x878138,namePointers);
 for(const at of[0x4F48,0x4F6B]){if(base[at]!==0x54||base[at+1]!==0x7E||base[at+2]!==0xAF)throw Error('Cópia nativa de nomes divergente.');rom[at+2]=cpu(names)>>16;}
 // These comparisons dispatched IDs >= 56 to linked all-star rosters.
 for(const at of[0x4F2E,0x4F50,0x123FCC,0x123FFA]){if(readWord(base,at)!==112)throw Error('Limite de equipes divergente em '+at.toString(16));rom.set(word(120),at);}
 if(readWord(base,0x267A4)!==112)throw Error('Equipe de demonstração de uniforme divergente.');rom.set(word(120),0x267A4);
 for(const at of[0x123FF1,0x123FFF])if(readWord(base,at)===112)rom.set(word(120),at);
 // Native palette copies accept low, virtual addresses only in the expanded domain.
 if(Array.from(base.slice(0x24EF,0x24F3)).join(',')!=='41,254,0,170')throw Error('Despachante de paletas divergente.');
 const paletteHelper=table(independentPaletteCopyHelper());hook(0x24EF,Uint8Array.from([0x5C,...long(cpu(paletteHelper))]));
 // A low-bank marker distinguishes expanded flag streams from the native
 // descriptor's bank-bit-6 transform flag. Ordinary descriptors retain their encoding.
 for(const[at,expected,body]of[
  [0x3775,[0x29,0xBF,0x85,0x0C],[0xC9,0x5E,0xD0,4,0x09,0x80,0x80,2,0x29,0xBF,0x85,0x0C,0x6B]],
  [0x3783,[0x29,0x40,0x04,0x05],[0xC9,0x5E,0xD0,4,0xA9,0,0x80,2,0x29,0x40,0x04,0x05,0x6B]]
 ]){if(expected.some((v,i)=>base[at+i]!==v))throw Error('Leitor de streams divergente.');const helper=table(Uint8Array.from(body));hook(at,Uint8Array.from([0x22,...long(cpu(helper))]));}

 const colorPlans=state.__playerColorPlans||{};
 for(const[id,plan]of Object.entries(colorPlans))for(const[slot,index]of Object.entries(plan.assignments)){const at=0x150000+Number(id)*140+(Number(slot)-1)*7+6;rom[at]=(rom[at]&239)|(index<<4);}
 const words=bytes=>Array.from({length:bytes.length/2},(_,i)=>readWord(bytes,i*2));
 const paletteTables={};
 for(const[k,old]of Object.entries({home:0x10274,skinAlt:0x1043C,hairAlt:0x103CA,keeper:0x10358,fieldFlag:0xFE06})){
  const values=Array.from({length:k==='home'?120:60},(_,index)=>{const kit=k==='home'&&index>=60?1:0,id=index%60;if(data[id]){let record=k==='fieldFlag'?[7,0,...stableFlags[id].colors.flatMap(word)]:data[id].palettes[k==='home'?(kit?'away':'home'):k];if(colorPlans[id]&&['home','skinAlt','hairAlt'].includes(k)){const plan=colorPlans[id],choice=plan.combinations[k==='home'?0:Math.min(1,plan.combinations.length-1)];record=k==='home'?[31,0,...applyAppearanceChoice(words(record.slice(2)),choice).flatMap(word)]:k==='skinAlt'?[9,0,...choice.skin.flatMap(word)]:[1,0,...word(choice.hairColor)];}if(k==='home'){const copy=record.slice();copy[32]=0x20;copy[33]=1;return pal(copy);}return pal(record);}if(colorPlans[id]&&['home','skinAlt','hairAlt'].includes(k)){
   const plan=colorPlans[id],choice=plan.combinations[k==='home'?0:Math.min(1,plan.combinations.length-1)];
   if(k==='home'){const ptr=readWord(rom,old+(id+(kit?57:0))*2),at=0x48000+(ptr&32767),record=Array.from(rom.slice(at,at+34));return pal([31,0,...applyAppearanceChoice(words(record.slice(2)),choice).flatMap(word)]);}
   if(k==='skinAlt')return pal([9,0,...choice.skin.flatMap(word)]);
   return pal([1,0,...word(choice.hairColor)]);
  }if(k==='fieldFlag'&&flagEdits[id])return pal([7,0,...stableFlags[id].colors.flatMap(word)]);return readWord(rom,old+(id+(k==='home'&&kit?57:0))*2);});
  paletteTables[k]=table(Uint8Array.from(values.flatMap(word)));redirectLong(cpu(old),paletteTables[k]);
 }
 // The native alternate-kit offset is 57, including the challenge palette.
 for(const at of[0x5CFCD,0x5D025]){if(readWord(base,at)!==114)throw Error('Deslocamento de uniforme divergente.');rom.set(word(120),at);}
 redirectLong(0x8282E6,paletteTables.home+120);
 // Color-editor and kit-preview copies bypass CODE_80A4EF entirely.
 for(const[at,count,loadFirst]of[[0x123C40,16,false],[0x123CF1,32,false],[0x1252D0,16,true]]){
  const expected=[...(loadFirst?[0xA9,...word(count-1),0x8B]:[0x8B,0xA9,...word(count-1)]),0x54,0x7E,0x89,0xAB];if(expected.some((v,i)=>base[at+i]!==v))throw Error('Cópia direta de uniforme divergente.');
  const helper=table(independentUniformCopyHelper(count));hook(at,Uint8Array.from([0x22,...long(cpu(helper)),0xEA,0xEA,0xEA,0xEA]));
 }
 // Normalize expanded source addresses in RAM palette scripts before the
 // native four-byte copy record is consumed; ROM scripts remain untouched.
 const stream=new Code();stream.put(0x08,0x48,0xC0,0,0x80).branch(0xB0,'done');
 stream.put(0xB9,1,0,0xC9,0,0x60).branch(0x90,'done').put(0xC9,0,0x80).branch(0xB0,'done');
 stream.put(0x09,0,0x80,0x99,1,0,0xB9,3,0,0x29,0,255,0x09,0xDC,0,0x99,3,0);
 stream.label('done').put(0x68,0x28,0xA9,0xA0,0,0x85,8,0x5C,0x7B,0xA9,0x80);
 if(Array.from(base.slice(0x2976,0x297B)).join(',')!=='169,160,0,133,8')throw Error('Stream de paletas divergente.');const streamHelper=table(stream.finish());hook(0x2976,Uint8Array.from([0x5C,...long(cpu(streamHelper)),0xEA]));
 // Team-photo graphics use their own palette and pose directories.
 for(const[key,address,stride,fallback]of INDEPENDENT_PHOTO_DIRECTORIES){
  const target=table(independentPhotoDirectory(rom,data,key,address,stride,fallback));redirectLong(cpu(address),target);
 }
 for(const[index,address]of[[0,0xFA49],[1,0xFAB9],[2,0xFD96]]){const entries=Array.from({length:60},(_,id)=>data[id]?pal(data[id].photo.palettes[index]):readWord(rom,address+id*2)),target=table(Uint8Array.from(entries.flatMap(word)));redirectLong(cpu(address),target);}
 // Two skin palette selectors keep their native palette lookup indices. Each
 // GG team gets two extra private pointers in the same relocated directory.
 const photoSkins=Array.from({length:13},(_,i)=>readWord(rom,0x17945+i*2)),skinSelectors=Array.from(rom.slice(0xFB29,0xFB29+108));
 for(const id of GG_TEAM_IDS)for(let i=0;i<2;i++){skinSelectors[id*2+i]=photoSkins.length*2;photoSkins.push(pal(data[id].photo.palettes[3+i]));}
 const skinDirectory=table(Uint8Array.from(photoSkins.flatMap(word))),skinIndices=table(Uint8Array.from(skinSelectors));redirectLong(0x82F945,skinDirectory);redirectLong(0x81FB29,skinIndices);redirectLong(0x81FB2A,skinIndices+1);
 // Each cloned detail pattern has its own bank and address.
 const layouts=Array.from({length:60},(_,id)=>{if(!data[id])return readWord(rom,0xFCEC+id*2);const at=INDEPENDENT_PATTERNS_SLOT+(id-54)*256;rom.set(data[id].pattern,at);return cpu(at)&65535;});const layoutTable=table(Uint8Array.from(layouts.flatMap(word)));redirectLong(0x81FCEC,layoutTable);
 const bankHelper=table(independentUniformBankHelper());
 if(rom[0x26816]!==0xA9)throw Error('Banco do desenho de uniforme divergente.');hook(0x26816,Uint8Array.from([0x22,...long(cpu(bankHelper)),0xEA,0xEA]));
 // Cinematic color tables: each copy points to separately allocated records.
 for(let t=0;t<7;t++){const old=0x479E0+t*224,values=Array.from({length:120},(_,i)=>{const id=i>>1,kit=i&1;return data[id]?pal(data[id].palettes.closeup[t][kit]):readWord(rom,old+i*2);});const target=table(Uint8Array.from(values.flatMap(word)));longLoad([0x59107,0x59118,0x5912A,0x5913B,0x59150,0x59161,0x59183][t],'y',target);}
 for(const[k,old,width,reads]of[['crowd',0x127AB0,4,[0x124008,0x124013]],['banner',0x127B90,4,[0x12401E,0x124029]],['bleacher',0x1278F0,8,[0x124037,0x124042,0x12404D,0x124058]],['flag',0x127C70,4,[0x123FD7,0x123FE2]]]){
  const vals=[];for(let id=0;id<60;id++)for(let i=0;i<width/2;i++)vals.push(data[id]?pal(data[id].palettes[k][i]):readWord(rom,old+id*width+i*2));const target=table(Uint8Array.from(vals.flatMap(word)));
  for(let j=0;j<reads.length;j++){const at=reads[j];if(rom[at]!==0xBD)throw Error('Leitor de bandeira/paleta divergente em '+at.toString(16));
   // LDA abs,X; TAY; LDA #dest; JSL copy => replace LDA/TAY with long wrapper.
   if(rom[at+3]!==0xA8)throw Error('Transferência de paleta divergente.');const helper=table(Uint8Array.from([0xBF,...long(cpu(target)+j*2),0xA8,0x6B]));hook(at,Uint8Array.from([0x22,...long(cpu(helper))]));
  }
 }
 // Field flags are complete private compressed copies, including the first 54 originals.
 const flagPointers=[];for(let id=0;id<60;id++)for(let half=0;half<2;half++){let d;if(stableFlags[id])d=flagPixelsToStreams(stableFlags[id].pixels)[half];else{const p=nativeFieldFlagPointer(base,id*4+half*2),at=0xD0000+(p&32767);d={bytes:konamiLzDecompress(rom,at).data,planar:!!(rom[at+1]&128)};}let packed=konamiLzCompress(d.bytes);if(d.planar)packed[1]|=128;flagPointers.push(flag(packed));}
 const flagTable=table(Uint8Array.from(flagPointers.flatMap(word)));redirectLong(0x81FF20,flagTable);hook(0x127E00,Uint8Array.from([0xBF,...long(cpu(flagTable)),0x60]));for(const descriptor of[0xE715,0x177A4])for(const o of[6,11,16,21])rom[descriptor+o]=0x5E;
 // Short labels use complete 64-byte strips. A private immutable cache serves
 // both bulk selection lists and the two scoreboard uploads.
 const shortRaw=new Uint8Array(60*64);
 for(let id=0;id<60;id++){
  let raw;if(data[id])raw=renderSmallTeamName(model.teams[id].short).raw;
  else{const at=0x17CA6+id*6,p=rom[at+3]|rom[at+4]<<8|rom[at+5]<<16,start=pc(p),d=konamiLzDecompress(rom,start);raw=rom[start+1]&128?transformLabelPlanes(d.data):d.data;}
  shortRaw.set(raw.slice(0,64),id*64);
 }
 const selectionRaw=shortRaw.slice();for(const id of GG_TEAM_IDS)selectionRaw.set(renderSmallTeamName(model.teams[id].name).raw,id*64);
 const selectionCache=table(selectionRaw),shortCache=table(shortRaw),shortPointers=table(Uint8Array.from(Array.from({length:60},(_,id)=>word(id*64)).flat()));redirectLong(0x81FEB0,shortPointers);
 if(Array.from(base.slice(0x3527,0x352D)).join(',')!=='160,0,0,173,0,1')throw Error('Carregador de nomes curtos divergente.');
 const flagCache=INDEPENDENT_PATTERNS_SLOT+0x1800,flagRaw=new Uint8Array(60*192);
 for(let id=0;id<60;id++){const halves=data[id]?.selectionFlags??(flagEdits[id]?flagPixelsToStreams(flagEdits[id].selectionPixels):captureSelectionFlags(rom,id));for(let half=0;half<2;half++){const f=halves[half],bytes=Uint8Array.from(f.bytes);flagRaw.set(f.planar?transformLabelPlanes(bytes):bytes,id*192+half*96);}}
 rom.set(flagRaw,flagCache);const flagSources=Array.from({length:60},(_,id)=>(cpu(flagCache)&65535)+id*192),selectionFlags=table(Uint8Array.from(flagSources.flatMap(word)));redirectLong(0x82FC34,selectionFlags);
 // Read GG labels and flags directly from immutable ROM for each DMA. Native
 // selection transitions reuse the upper 7F RAM as decompression workspace.
 for(const[entry,bytes]of[
  [0x2FDE0,[0x08,0x48,0xA9,cpu(flagCache)>>16,0,0x85,0,0x68,0x28,0xA2,96,0,0x6B]],
  [0x2FE00,[0x08,0xC9,0x80,0x0D,0x90,13,0x18,0x69,...word(cpu(selectionCache)),0x48,0xA9,cpu(selectionCache)>>16,0,0x85,0,0x68,0x80,8,0x48,0xA9,0x7F,0,0x85,0,0x68,0xEA,0x28,0xA2,64,0,0x6B]]
 ]){const helper=table(Uint8Array.from(bytes));hook(entry,Uint8Array.from([0x22,...long(cpu(helper)),0x60]));}
 const shortHelper=table(independentShortNameHelper(shortCache));hook(0x3527,Uint8Array.from([0x5C,...long(cpu(shortHelper)),0xEA,0xEA]));
 if([0x29,255,0,0x0A].some((v,i)=>base[0x2A8E0+i]!==v))throw Error('Nomes pré-jogo: carregador divergente.');const preMatchNames=table(independentPreMatchNameHelper(selectionCache));hook(0x2A8E0,Uint8Array.from([0x5C,...long(cpu(preMatchNames))]));
 // Independent goalkeeper palettes have room for all 1200 player records.
 const keeperBytes=new Uint8Array(60*20*22),skinBytes=new Uint8Array(60*20*2);
 keeperBytes.set(rom.slice(GOALKEEPER_PALETTE_SLOT,GOALKEEPER_PALETTE_SLOT+54*20*22));skinBytes.set(rom.slice(GOALKEEPER_SKIN_FLAGS,GOALKEEPER_SKIN_FLAGS+54*20*2));
 for(const id of GG_TEAM_IDS)for(let i=0;i<20;i++){keeperBytes.set(data[id].keeperPalettes[i].flatMap(word),(id*20+i)*22);skinBytes.set(word(data[id].keeperSkin[i]),(id*20+i)*2);}
 rom.set(keeperBytes,INDEPENDENT_KEEPERS_SLOT);rom.set(skinBytes,0x2FE800);
 for(const[start,end]of[[0x2A7000,0x2A7C00]]){const code=rom.slice(start,end);patchPattern(code,[0xC9,112,0],[0xC9,120,0]);patchPattern(code,[0x54,0x7E,0xD4],[0x54,0x7E,0xDF]);patchPattern(code,[0xF4,0xD4,0],[0xF4,0xDF,0]);patchPattern(code,[0xBF,...long(cpu(GOALKEEPER_SKIN_FLAGS))],[0xBF,...long(cpu(0x2FE800))]);rom.set(code,start);}
 // Per-roster cinematic skin/hair follows each clone's own attributes and colors.
 for(const id of GG_TEAM_IDS)for(let i=0;i<20;i++){const a=data[id].attributes.slice(i*7,i*7+7),hair=a[6]&15,keeper=a[4]>>4===1;let colors=data[id].palettes.home.slice(2).reduce((v,_,k,arr)=>{if(!(k&1))v.push(arr[k]|arr[k+1]<<8);return v;},[]);if(a[6]&16){const skin=data[id].palettes.skinAlt,h=data[id].palettes.hairAlt;if(skin)colors.splice(2,5,...Array.from({length:5},(_,c)=>readWord(skin,2+c*2)));if(h)colors[1]=readWord(h,2);}if(colorPlans[id]&&!keeper)colors=applyAppearanceChoice(colors,colorPlans[id].combinations[colorPlans[id].assignments[i+1]]);if(keeper){const k=data[id].keeperPalettes[i];colors=[0,k[0],k[1],k[1],k[2],k[3],k[4]];}rom.set(closeupPalette(colors).flatMap(word),CLOSEUP_PALETTE_SLOT+(id*20+i)*32);rom.set(word((keeper||hair===0||hair>=14?0x8000:0)|(keeper?14:hair)),CLOSEUP_STYLE_SLOT+(id*20+i)*2);}
 const cinema=rom.slice(CLOSEUP_HELPER_SLOT,CLOSEUP_HELPER_SLOT+0x800);patchPattern(cinema,[0xC9,56,0],[0xC9,60,0]);rom.set(cinema,CLOSEUP_HELPER_SLOT);
 // Native tactical pointer lookup + selector bank use genuinely private records.
 const tacticsPointers=[];for(let id=0;id<60;id++){if(!data[id])tacticsPointers.push(readWord(rom,0x5FDD0+id*2));else{const at=INDEPENDENT_PATTERNS_SLOT+0x1000+(id-54)*32;rom.set(data[id].tactics,at);tacticsPointers.push(cpu(at)&65535);rom.set([cpu(at)>>16,0],0x200100+id*2);}}
 const tacticalTable=table(Uint8Array.from(tacticsPointers.flatMap(word)));redirectLong(0x8BFDD0,tacticalTable,[0x2AA88,0x2B160,0x31934]);
 const tacticalCopy=table(independentTacticalCopyHelper());for(const at of [0x2AAAC,0x2AAC2]){if([0x8B,0x54,0x7E,0x8B,0xAB].some((v,i)=>base[at+i]!==v))throw Error('Cópia tática nativa divergente.');hook(at,Uint8Array.from([0x22,...long(cpu(tacticalCopy)),0xEA]));}
 // Six fully occupied slots; no empty code is presented as a selectable team.
 if(state.plusGroups?.secret?.length===6){for(const{pc,bytes}of planPlusGroupIdentity(base,state))rom.set(bytes,pc);}else rom.set(GG_TEAM_IDS.map(id=>id*2),0xE828);
 if(Array.from(base.slice(0x2AC99,0x2AC9D)).join(',')!=='175,114,212,126')throw Error('Contagem de grupos divergente.');
 hook(0x2AC99,Uint8Array.of(0xA9,10,0,0xEA));
 hook(0x2FDD0,Uint8Array.of(0xAC,0x42,0x15,0x1A,0x1A,0x1A,0x60));
 hook(0x2FE70,Uint8Array.of(0xA5,0x42,0xC5,0xF4,0x60));
 hook(0x2FE92,Uint8Array.of(0x3A,0x85,0x42,0x60));for(const at of[0x2FC58,0x2FC5C]){if(rom[at]!==0xA9||readWord(rom,at+1)!==9)throw Error('Contagem de páginas divergente.');rom[at+1]=10;}
 hook(0x2FE30,Uint8Array.of(0xA9,5,0,0x60));hook(0x2FE50,Uint8Array.of(0xC9,6,0,0x60));
 for(const[at,expected,value]of[[0x2FDE9,108,65535],[0x2FDEE,112,120],[0x2FE0B,55,65535],[0x2FE12,56,60]]){if(readWord(rom,at)!==expected)throw Error('Tratamento de nome especial divergente '+at.toString(16));rom.set(word(value),at);}
 // New tall-name OAM uses a complete 60-entry directory and the existing safe cache.
 const names60=TEAM_NAME_LANGUAGE_PRESETS.map((p,id)=>normalizeTeamName(state.teamNamesV1?.values?.[id]?.big??state.teamNamesV1?.values?.[id]?.full??p.big??p.english));for(const id of GG_TEAM_IDS)names60[id]=model.teams[id].big;
 const big=renderBigTeamNames(names60,konamiLzDecompress(base,0xEE13C).data,1024);
 // Keep only the 54 ordinary names resident. Two bounded slots hold the selected
 // GG opponents on demand, preserving the menu/stadium WRAM gaps and state words.
 const total=big.count,first54=readWord(big.pointers,108)/2,slotSize=40;
 if(first54*2+slotSize*2>TEAM_NAME_CACHE_PLANE)throw Error('Nomes normais não deixam espaço para dois adversários GG.');
 const residentCount=first54+12,residentRaw=new Uint8Array(63+residentCount*4);residentRaw.set(big.raw.slice(0,63));residentRaw[1]=residentCount&255;residentRaw[2]=residentCount>>8;residentRaw.fill(2,57,63);
 for(let p=0;p<4;p++)residentRaw.set(big.raw.slice(63+p*total,63+p*total+first54),63+p*residentCount);
 residentRaw.fill(128,63+residentCount+first54,63+residentCount*2);
 // Native asset descriptors reserve source-bank bit 6 as a transform flag;
 // keep these assets in their verified native banks instead of encoding DB.
 for(const[at,raw]of[[0xEE13C,big.font],[0x13E4B6,residentRaw]]){const packed=konamiLzCompress(raw),capacity=konamiLzDecompress(base,at).compressedSize;if(packed.length>capacity)throw Error('Nomes GG excedem o bloco nativo em '+at.toString(16));rom.fill(255,at,at+capacity);rom.set(packed,at);}
 rom.set(convertedTeamNameOam(residentRaw,60),TEAM_NAME_CACHE_SLOT);
 const fullCache=convertedTeamNameOam(big.raw,60,total*2),ggCache=new Uint8Array(slotSize*6*4);
 for(let i=0;i<6;i++){const offset=readWord(big.pointers,(54+i)*2),length=big.raw[57+i]*2;if(length>slotSize)throw Error('Nome GG excede o slot temporário.');for(let p=0;p<4;p++)ggCache.set(fullCache.slice(p*total*2+offset,p*total*2+offset+length),p*slotSize*6+i*slotSize);}
 const cache=table(ggCache),bigPointers=table(big.pointers),pointers=Array.from({length:6},(_,i)=>i*slotSize);pointers.table=bigPointers;
 const nameHelper=table(independentTeamNameHelper(pointers,cache,slotSize*6,first54*2,slotSize));
 rom.set([0x5C,...long(cpu(nameHelper))],TEAM_NAME_HOOK_SLOT+0x100);
 const groups=state.plusGroups??readPlusGroupIdentity(base),labels=groups.labels??['AMERICA 1','AMERICA 2','AMERICA 3','EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA','AFRICA','GG'];
 plusGroupTitlesWriter(rom,{plusGroups:{...groups,labels:[...labels]}},base);
 // Late allocation log is used by the isolation regression and never by a parent lookup.
 const ownership={schema:'isssd-independent-allocation-v1',teams:60,group:GG_TEAM_IDS.map(id=>({teamId:id,attributes:0x150000+id*140,names:names+id*160,pattern:INDEPENDENT_PATTERNS_SLOT+(id-54)*256,tactics:INDEPENDENT_PATTERNS_SLOT+0x1000+(id-54)*32,keeper:INDEPENDENT_KEEPERS_SLOT+id*440,uniformHome:INDEPENDENT_PALETTES_SLOT+readWord(rom,paletteTables.home+id*2),uniformAway:INDEPENDENT_PALETTES_SLOT+readWord(rom,paletteTables.home+(60+id)*2)})),tablesEnd:tableNext,palettesEnd:paletteNext,flagsEnd:flagNext};
 const ranges=[...TEAM_NAME_REGIONS.map(r=>[...r]),[0xE7F2,0xE82E],[0x3FAC8,0x3FB7C],[0xF6C78,0xF6F2B],[0x2D8000,0x300000]];
 let active=null;for(let i=0;i<rom.length;i++)if(rom[i]!==input[i]){if(active&&i-active[1]<=32)active[1]=i+1;else{active=[i,i+1];ranges.push(active);}}
 ranges.sort((a,b)=>a[0]-b[0]);ownership.ranges=[];for(const r of ranges){const prior=ownership.ranges.at(-1);if(prior&&r[0]<=prior[1])prior[1]=Math.max(prior[1],r[1]);else ownership.ranges.push(r);}
 const bytes=new TextEncoder().encode(JSON.stringify(ownership));if(bytes.length>4096)throw Error('Índice de alocação excedido.');rom.set(bytes,INDEPENDENT_PATTERNS_SLOT+0x7000);
 return rom;
}

export function independentTeamOwnedRanges(rom){
 const start=INDEPENDENT_PATTERNS_SLOT+0x7000;if(rom.length<start+4096||rom[start]!==123)return[];
 const bytes=rom.slice(start,start+4096),end=bytes.indexOf(255);let value;try{value=JSON.parse(new TextDecoder().decode(end<0?bytes:bytes.slice(0,end)));}catch{return[];}
 if(value.schema!=='isssd-independent-allocation-v1'||value.teams!==60||!Array.isArray(value.ranges)||value.ranges.some(r=>!Array.isArray(r)||r.length!==2||r.some(v=>!Number.isInteger(v))||r[0]<0||r[1]>rom.length||r[0]>=r[1]))return[];
 return value.ranges;
}
