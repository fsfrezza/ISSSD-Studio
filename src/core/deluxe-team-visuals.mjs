import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {DELUXE_COMPACT_FONT as FONT} from './deluxe-compact-font.mjs';
import {DELUXE_PROJECT_TO_PLUS} from './deluxe-team-identity.mjs';
export const TEAM_VISUAL_SCHEMA='isssd-deluxe-team-visuals-v1';
const word=(b,p)=>b[p]|b[p+1]<<8,long=(b,p)=>word(b,p)|b[p+2]<<16;
const w=n=>[n&255,n>>8&255],l=n=>[...w(n),n>>16&255],cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),pc=c=>((c>>16&127)*32768)+(c&32767);
const sizes={selectionFlags:192,fieldFlags:192,home:34,away:34,keeper:24,skin:12,hair:4,flag:10,pattern:256,appearance:20};
export function validateTeamVisuals(value){
 if(value===undefined)return null;
 if(!value||value.schema!==TEAM_VISUAL_SCHEMA||value.version!==1||!/^[a-f0-9]{64}$/.test(value.referenceSha256)||!value.teams||Array.isArray(value.teams)||Object.keys(value.teams).length!==60)throw Error('Identidade visual: catálogo de referência inválido.');
 for(let id=0;id<60;id++)for(const[k,size]of Object.entries(sizes)){const a=value.teams[id]?.[k];if(a===null&&['skin','hair'].includes(k))continue;if(!Array.isArray(a)||a.length!==size||a.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Identidade visual inválida: equipe '+id+' / '+k);}
 return value;
}
function normalizedStream(rom,at,size){const decoded=konamiLzDecompress(rom,at).data;if(decoded.length!==size)throw Error('Recurso visual de referência com tamanho inesperado.');if(!(rom[at+1]&128))return Array.from(decoded);const out=new Uint8Array(size);for(let g=0;g<size;g+=16)for(let i=0;i<8;i++){out[g+i*2]=decoded[g+i];out[g+i*2+1]=decoded[g+8+i];}return Array.from(out);}
export function extractGGTeamVisuals(reference,plusBase,referenceSha256){
 if(reference.length!==0x400000||plusBase.length!==0x200000)throw Error('Identidade visual: ROMs de referência incompatíveis.');
 const raw=reference.slice(0x2ef000,0x2f0000),end=raw.indexOf(255),allocation=JSON.parse(new TextDecoder().decode(raw.slice(0,end)));
 if(allocation.schema!=='isssd-independent-allocation-v1'||allocation.teams!==60)throw Error('Alocação GG não reconhecida.');
 const dir=old=>{const locations=[];for(let at=0;at<plusBase.length-4;at++)if(plusBase[at]===0xbf&&long(plusBase,at+1)===old&&reference[at]===0xbf)locations.push(pc(long(reference,at+1)));const unique=[...new Set(locations)];if(unique.length!==1)throw Error('Diretório visual divergente: '+old.toString(16));return unique[0];};
 const palette=(pointer,size)=>{if(pointer===0&&[12,4].includes(size))return null;const at=pointer>=0x6000&&pointer<0x8000?0x2e0000+pointer:0x48000+(pointer&32767);if(word(reference,at)+3!==size)throw Error('Registro de paleta divergente: '+pointer.toString(16)+' size '+size);return Array.from(reference.slice(at,at+size));};
 const tables={home:dir(0x828274),keeper:dir(0x828358),skin:dir(0x82843c),hair:dir(0x8283ca),flag:dir(0x81fe06)},patterns=dir(0x81fcec),field=pc(long(reference,0x127e01)),teams={};
 for(let id=0;id<60;id++){
  const pattern=word(reference,patterns+id*2),at=id>=54?allocation.group[id-54].pattern:0xc0000+(pattern&32767),data=Array.from(reference.slice(at,at+(pattern===0xf014&&id<54?32:256)));
  teams[id]={appearance:Array.from(reference.slice(0x150000+id*140,0x150000+(id+1)*140)).filter((_,i)=>i%7===6).map(v=>v&31),selectionFlags:Array.from(reference.slice(0x2e9800+id*192,0x2e9800+(id+1)*192)),fieldFlags:[0,1].flatMap(half=>normalizedStream(reference,0x2f0000+(word(reference,field+id*4+half*2)&32767),96)),home:palette(word(reference,tables.home+id*2),34),away:palette(word(reference,tables.home+(60+id)*2),34),keeper:palette(word(reference,tables.keeper+id*2),24),skin:palette(word(reference,tables.skin+id*2),12),hair:palette(word(reference,tables.hair+id*2),4),flag:palette(word(reference,tables.flag+id*2),10),pattern:data.length===32?Array.from({length:8},()=>data).flat():data};
 }
 return validateTeamVisuals({schema:TEAM_VISUAL_SCHEMA,version:1,referenceSha256,teams});
}
class Code{
 constructor(){this.b=[];this.labels={};this.refs=[];}
 put(...bytes){this.b.push(...bytes);return this;}
 label(name){this.labels[name]=this.b.length;return this;}
 branch(op,name){this.put(op,0);this.refs.push([this.b.length-1,name]);return this;}
 finish(){for(const[at,name]of this.refs){const d=this.labels[name]-at-1;if(d< -128||d>127)throw Error('Salto visual fora do alcance');this.b[at]=d&255;}return Uint8Array.from(this.b);}
}
export function renderDeluxeTeamLabel(name){
 let text=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 .-]/g,'').trim();
 const tight=t=>[...t].reduce((n,c)=>n+(c===' '?2:FONT[c][0].length),0);
 if(tight(text)>32&&text.includes(' ')){const words=text.split(/\s+/);text=words.slice(0,-1).map(w=>w[0]+'.').join('')+' '+words.at(-1);}
 while(tight(text)>32)text=text.slice(0,-2)+'.';
 const gap=tight(text)+text.length-1<=32?1:0,width=tight(text)+Math.max(0,text.length-1)*gap,raw=new Uint8Array(64);let x=Math.floor((32-width)/2);
 for(const c of text){if(c===' '){x+=2+gap;continue;}const glyph=FONT[c];for(let y=0;y<7;y++)for(let dx=0;dx<glyph[y].length;dx++)if(glyph[y][dx]==='1'){const col=x+dx;raw[Math.floor(col/8)*16+y*2]|=1<<(7-col%8);}x+=glyph[0].length+gap;}
 return raw;
}
export function applyDeluxeTeamVisuals(input,base,structure,value){
 const model=validateTeamVisuals(value);if(!model)return input;if(!structure)throw Error('Identidade visual exige a estrutura de equipes do projeto.');
 const out=input.length===0x400000?input.slice():new Uint8Array(0x400000).fill(255);if(input.length!==out.length)out.set(input);out[0x7fd7]=12;
 const n=structure.teams.length,total=n+7,sources=[...structure.teams.map(t=>t.sourceTeam),36,37,38,39,40,41,42],entries=structure.teams.map((t,i)=>model.teams[t.plusId??DELUXE_PROJECT_TO_PLUS[i]]);
 let codeNext=0x238000,paletteNext=0x22e000,flagNext=0x220000;
 const reserve=(at,bytes)=>{if(at<0||at+bytes.length>out.length||out.slice(at,at+bytes.length).some(v=>v!==255))throw Error('Identidade visual: reserva ocupada em '+at.toString(16));out.set(bytes,at);return at;};
 const allocate=bytes=>{const at=codeNext;codeNext=(at+bytes.length+1)&~1;if(codeNext>0x240000)throw Error('Código visual excedeu reserva');reserve(at,bytes);return at;};
 const hook=(at,expected,bytes)=>{if(expected.some((v,i)=>base[at+i]!==v))throw Error('Identidade visual: rotina divergente em '+at.toString(16));out.set(bytes,at);};
 // Prepared Deluxe directories already have the final project-slot order.
 const table=old=>{if(old===0x81e6c1)return pc(long(out,0x37701));const hits=[];for(let at=0;at<base.length-4;at++)if(base[at]===0xbf&&long(base,at+1)===old&&out[at]===0xbf)hits.push(pc(long(out,at+1)));const unique=[...new Set(hits)];if(unique.length!==1)throw Error('Diretório Deluxe divergente: '+old.toString(16));return unique[0];};
 const palette=record=>{const at=paletteNext;paletteNext=(at+record.length+1)&~1;if(paletteNext>0x230000)throw Error('Paletas excederam reserva');reserve(at,record);return at-0x228000;};
 // One immutable 32x8 label per team; no WRAM preload can overwrite flags or stadium tiles.
 const rawNames=new Uint8Array(total*64),namePointers=table(0x81e6c1),nameBanks=out.slice(0x37770,0x37770+total);
 for(let id=0;id<total;id++){
  const raw=id<n?renderDeluxeTeamLabel(structure.teams[id].name):konamiLzDecompress(base,0xd0000+(word(base,0xe6c1+Math.min(41,sources[id])*2)&32767)).data;
  rawNames.set(raw,id*64);const packed=konamiLzCompress(raw),dest=0x210000+id*80;if(packed.length>80)throw Error('Nome gráfico excede reserva');reserve(dest,packed);out.set(w(cpu(dest)),namePointers+id*2);nameBanks[id]=0x42;
 }
 reserve(0x214000,rawNames);out.set(nameBanks,0x37770);out[0xe6ba]=0x42;out[0xe6bf]=0x42;
 const labelDMA=allocate(Uint8Array.from([0x08,0x48,0xa5,0,0x48,0xa9,0xc2,0,0x85,0,0xa3,3,0x18,0x69,0,0xc0,0xa2,64,0,0x22,0x37,0x8e,0x80,0x68,0x85,0,0x68,0x28,0x6b]));
 hook(0x2af59,[0xa2,64,0,0x22,0x37,0x8e,0x80],[0x22,...l(cpu(labelDMA)),0xea,0xea,0xea]);
 const preMatch=allocate(Uint8Array.from([0x29,255,0,0x0a,0x0a,0x0a,0x0a,0x0a,0x18,0x69,0,0xc0,0x48,0xa9,0xc2,0,0x85,0,0xbf,0xf7,0xf7,0x82,0xa8,0xa2,64,0,0x68,0x22,0x37,0x8e,0x80,0x6b]));
 hook(0x2a8e0,[0x29,255,0,0x0a],[0x5c,...l(cpu(preMatch))]);
 // Native score scripts decompress two names through the relocated directory/bank fields.
 // Selection flags use direct ROM DMA: the upper WRAM is reused on menu transitions.
 const flagRaw=new Uint8Array(total*192),selection=table(0x82f829),field=table(0x81e730);
 for(let id=0;id<total;id++){
  let flagData;if(id<n)flagData=entries[id].selectionFlags;else{const source=Math.min(sources[id],41),p=word(base,0xe730+source*4);flagData=[...normalizedStream(base,0x138000+(p&32767),96),...normalizedStream(base,0x138000+(word(base,0xe732+source*4)&32767),96)];}
  flagRaw.set(flagData,id*192);out.set(w(0x8000+id*192),selection+id*2);
  const fieldData=id<n?entries[id].fieldFlags:flagData;
  for(let half=0;half<2;half++){const packed=konamiLzCompress(Uint8Array.from(fieldData.slice(half*96,(half+1)*96)));if(flagNext+packed.length>0x228000)throw Error('Bandeiras excederam reserva');reserve(flagNext,packed);out.set(w(cpu(flagNext)),field+id*4+half*2);flagNext=(flagNext+packed.length+1)&~1;}
 }
 reserve(0x218000,flagRaw);
 const flagsDMA=count=>allocate(Uint8Array.from([0x08,0x48,0xa5,0,0x48,0xa9,0xc3,0,0x85,0,0xa3,3,0xa2,...w(count),0x22,0x37,0x8e,0x80,0x68,0x85,0,0x68,0x28,0x6b]));
 // All LDX #96/#192 + JSL DMA calls immediately following this flag directory are guarded.
 for(const at of [0x2aefe,0x2af19,0x2bed2,0x2beed,0x2bf34]){
  const count=word(base,at+1);if(base[at]!==0xa2||![96,192].includes(count)||long(base,at+4)!==0x808e37)throw Error('DMA de bandeira divergente em '+at.toString(16));out.set([0x22,...l(cpu(flagsDMA(count))),0xea,0xea,0xea],at);
 }
 for(const desc of [0x177a4,0xe715,0xeb80])for(const offset of(desc===0xeb80?[6,11]:[6,11,16,21]))out[desc+offset]=0x44;
 const bankFix=allocate(Uint8Array.from([0xc9,0x42,0xf0,4,0xc9,0x44,0xd0,4,0x09,0x80,0x80,2,0x29,0xbf,0x85,0x0c,0x6b])),planeFix=allocate(Uint8Array.from([0xc9,0x42,0xf0,4,0xc9,0x44,0xd0,4,0xa9,0,0x80,2,0x29,0x40,0x04,0x05,0x6b]));
 hook(0x3775,[0x29,0xbf,0x85,0x0c],[0x22,...l(cpu(bankFix))]);hook(0x3783,[0x29,0x40,0x04,0x05],[0x22,...l(cpu(planeFix))]);
 // Private native palette records preserve skin/hair and the nine kit colors together.
 const homes=table(0x82827a),palSpecs={keeper:0x828326,skin:0x8283d2,hair:0x82837c,flag:0x81e7d8};
 for(let id=0;id<n;id++){out.set(w(palette(entries[id].home)),homes+id*2);out.set(w(palette(entries[id].away)),homes+(total+id)*2);}
 for(const[key,old]of Object.entries(palSpecs)){const dest=table(old);for(let id=0;id<n;id++)out.set(w(entries[id][key]===null?0:palette(entries[id][key])),dest+id*2);}
 const palCode=new Code();palCode.put(0xc0,0,0x60).branch(0x90,'native').put(0xc0,0,0x80).branch(0xb0,'native');
 palCode.put(0x5a,0x29,0xfe,0,0xaa,0xbf,...l(0x819176),0xa8,0xfa,0x8a,0x09,0,0x80,0xaa,0xbf,0,0,0xc5,0xe8,0xe8,0x54,0x7e,0xc5,0x7a,0xfa,0xab,0x6b).label('native').put(0x29,0xfe,0,0xaa,0x5c,0xf3,0xa4,0x80);
 const palHelper=allocate(palCode.finish());hook(0x24ef,[0x29,0xfe,0,0xaa],[0x5c,...l(cpu(palHelper))]);
 const stream=new Code();stream.put(0x08,0x48,0xc0,0,0x80).branch(0xb0,'done').put(0xb9,1,0,0xc9,0,0x60).branch(0x90,'done').put(0xc9,0,0x80).branch(0xb0,'done').put(0x09,0,0x80,0x99,1,0,0xb9,3,0,0x29,0,255,0x09,0xc5,0,0x99,3,0).label('done').put(0x68,0x28,0xa9,0xa0,0,0x85,8,0x5c,0x7b,0xa9,0x80);
 hook(0x2976,[0xa9,0xa0,0,0x85,8],[0x5c,...l(cpu(allocate(stream.finish()))),0xea]);
 for(const[at,count,expected]of[[0x123c40,16,[0x8b,0xa9,15,0,0x54,0x7e,0x89,0xab]],[0x123cf1,32,[0x8b,0xa9,31,0,0x54,0x7e,0x89,0xab]],[0x1252d0,16,[0xa9,15,0,0x8b,0x54,0x7e,0x89,0xab]]]){
  const c=new Code();c.put(0x08,0x8b,0x8a,0xc9,0,0x60).branch(0x90,'native').put(0xc9,0,0x80).branch(0xb0,'native').put(0x09,0,0x80,0xaa,0xa9,...w(count-1),0x54,0x7e,0xc5).branch(0x80,'done').label('native').put(0xa9,...w(count-1),0x54,0x7e,0x89).label('done').put(0xab,0x28,0x6b);hook(at,expected,[0x22,...l(cpu(allocate(c.finish()))),0xea,0xea,0xea,0xea]);
 }
 for(let id=0;id<n;id++)for(let slot=0;slot<20;slot++){const at=0x17bd20+(id*20+slot)*7+6;out[at]=(out[at]&224)|entries[id].appearance[slot];}
 const patterns=table(0x81ce8a);for(let id=0;id<n;id++){reserve(0x230000+id*256,entries[id].pattern);out.set(w(0x8000+id*256),patterns+id*2);}
 const patternBank=new Code();patternBank.put(0x08,0xc9,0x14,0xf0).branch(0xf0,'native').put(0xe0,...w(n*2)).branch(0xb0,'native').put(0xa5,0x57,0x29,255,0,0xc9,...w(n*2)).branch(0xb0,'native').put(0x28,0xa9,0x80,0xc6,0x6b).label('native').put(0x28,0xa9,0x80,0x98,0x6b);
 hook(0x26816,[0xa9,0,0x98,0x09,0x80,0],[0x22,...l(cpu(allocate(patternBank.finish()))),0xea,0xea]);
 return out;
}
