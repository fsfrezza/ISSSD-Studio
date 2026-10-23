import {MENU_OAM_CACHE_SLOT,MENU_OAM_CACHE_SIZE} from './plus-menu-oam-cache.mjs';
import {SQUAD_OAM_CACHE_SLOT,SQUAD_OAM_CACHE_SIZE,SQUAD_RESTORE_SLOT,SQUAD_RESTORE_SIZE,SQUAD_OAM_POINTERS,STADIUM_OAM_CACHE_SLOT,STADIUM_OAM_PLANE,STADIUM_RESTORE_SLOT,STADIUM_RESTORE_SIZE,TEAM_NAME_CACHE_SLOT,TEAM_NAME_CACHE_SIZE,teamNameHookWrites,TEAM_NAME_HOOK_SLOT,TEAM_NAME_HOOK_SIZE,TEAM_NAME_POINTER_READS} from './plus-team-name-hooks.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {transformLabelPlanes} from './plus-graphical-labels.mjs';
import {COMPACT_MENU_FONT} from './plus-controller-text.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {TEAM_NAME_LANGUAGE_PRESETS as PRESETS} from './team-name-presets.mjs';
export const TEAM_NAME_SCHEMA='isssd-team-names-v1';
export const TEAM_NAME_REGIONS=[[SQUAD_OAM_CACHE_SLOT,SQUAD_OAM_CACHE_SLOT+SQUAD_OAM_CACHE_SIZE],[SQUAD_RESTORE_SLOT,SQUAD_RESTORE_SLOT+SQUAD_RESTORE_SIZE],[0x111F4,0x111F6],[0x111F9,0x111FB],...SQUAD_OAM_POINTERS.map(p=>[p,p+2]),[STADIUM_OAM_CACHE_SLOT,STADIUM_OAM_CACHE_SLOT+4*STADIUM_OAM_PLANE],[STADIUM_RESTORE_SLOT,STADIUM_RESTORE_SLOT+STADIUM_RESTORE_SIZE],[TEAM_NAME_CACHE_SLOT,TEAM_NAME_CACHE_SLOT+TEAM_NAME_CACHE_SIZE],[MENU_OAM_CACHE_SLOT,MENU_OAM_CACHE_SLOT+MENU_OAM_CACHE_SIZE],[TEAM_NAME_HOOK_SLOT,TEAM_NAME_HOOK_SLOT+TEAM_NAME_HOOK_SIZE],[0x2A756,0x2A75D],[0x3B00,0x3B04],[0x3B59,0x3B5D],...TEAM_NAME_POINTER_READS.map(p=>[p,p+4]),[0xDEA6D,0xDF6CE],[0x17CA6,0x17DF6],[0xFEB0,0xFF20],[0xE6B8,0xE6BB],[0xE6BD,0xE6C0],[0x17BC4,0x17C34],[0xEE13C,0xEE706],[0x13E4B6,0x13EBB0],...[0x10A70,0x10E14,0x11719,0x10C21,0x10E49,0x116B5].map(p=>[p,p+3])];
const toPc=c=>((c>>>16)&127)*0x8000+(c&0x7FFF),toCpu=p=>0x800000|((p>>>15)<<16)|0x8000|(p&0x7FFF);
const u16=(b,p)=>b[p]|b[p+1]<<8,u24=(b,p)=>u16(b,p)|b[p+2]<<16;
const word=n=>Uint8Array.of(n&255,n>>>8&255),long=n=>Uint8Array.of(n&255,n>>>8&255,n>>>16&255);
export const normalizeTeamName=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
export function teamNameEntries(state){
 const saved=state?.teamNamesV1;if(!saved)return [];
 if(saved.schema!==TEAM_NAME_SCHEMA||!saved.values||Array.isArray(saved.values))throw Error('Nomes: formato de projeto inválido.');
 return Object.entries(saved.values).map(([id,row])=>{
  const team=Number(id);if(!Number.isInteger(team)||team<0||team>=56)throw Error('Nomes: identidade inválida '+id);
  if(!row||typeof row.full!=='string'||typeof row.short!=='string')throw Error('Nomes: informe nome completo e curto para a equipe '+team);
  for(const name of [row.full,row.short,row.big??row.full])if(!normalizeTeamName(name)||/[^A-Z0-9 .-]/.test(normalizeTeamName(name)))throw Error('Nomes: use letras, números, espaços, ponto e hífen.');
  if(normalizeTeamName(row.full).length>24)throw Error('Nomes: o nome completo excede 24 caracteres.');
  return {team,full:normalizeTeamName(row.full),big:normalizeTeamName(row.big??row.full),short:normalizeTeamName(row.short)};
 }).sort((a,b)=>a.team-b.team);
}
export function renderSmallTeamName(text){
 const chars=[...normalizeTeamName(text)],glyph=c=>c==='.'?['0','0','0','0','0','1','1']:COMPACT_MENU_FONT[c];
 const tight=chars.reduce((w,c)=>w+(c===' '?2:glyph(c)?.[0]?.length??99),0),gap=tight+chars.length-1<=32?1:0,width=tight+Math.max(0,chars.length-1)*gap;
 if(width>32)throw Error('Nome curto “'+text+'” ocupa '+width+' px; limite de 32 px. Use a opção curta ou uma abreviação.');
 const raw=new Uint8Array(64),pixels=Array.from({length:8},()=>new Uint8Array(32));let x=Math.floor((32-width)/2);
 for(let y=0;y<8;y++)for(let px=Math.max(0,x-1);px<Math.min(32,x+width+1);px++)pixels[y][px]=3;
 for(const c of chars){if(c===' '){x+=2+gap;continue;}const g=glyph(c);if(!g)throw Error('Nomes: caractere indisponível '+c);
  for(let y=0;y<7;y++)for(let k=0;k<g[y].length;k++)if(g[y][k]==='1')pixels[y][x+k]=1;x+=g[0].length+gap;
 }
 for(let y=0;y<8;y++)for(let px=0;px<32;px++){const off=Math.floor(px/8)*16+y*2,v=pixels[y][px],bit=7-px%8;raw[off]|=(v&1)<<bit;raw[off+1]|=(v>>1)<<bit;}
 return {raw,width};
}
function tokenize(text,pairs){
 const cost=Array(text.length+1).fill(Infinity),prev=[];cost[0]=0;
 for(let i=0;i<text.length;i++){
  const one=text[i],n=one===' '?0:1;
  if(cost[i]+n<cost[i+1]){cost[i+1]=cost[i]+n;prev[i+1]=[i,one];}
  const pair=text.slice(i,i+2);if(pair.length===2&&pairs.has(pair)&&cost[i]+1<cost[i+2]){cost[i+2]=cost[i]+1;prev[i+2]=[i,pair];}
 }
 const tokens=[];for(let i=text.length;i>0;){const [p,t]=prev[i];tokens.push(t);i=p;}return {count:cost.at(-1),tokens:tokens.reverse()};
}
export function renderBigTeamNames(names,baseFont=new Uint8Array(4096)){
 const glyph=c=>c==='I'?['1','1','1','1','1','1','1']:c==='.'?['000','000','000','000','000','000','010']:PLUS_MAIN_MENU_GLYPHS[c]?.slice(0,7).map(v=>Array.from({length:5},(_,x)=>v&(1<<(6-x))?'1':'0').join(''));
 const sourceGlyph=glyph;
 const scaledGlyph=c=>{const g=sourceGlyph(c);return g?.map(row=>Array.from({length:row.length===5?6:row.length},(_,x)=>row[Math.floor(x*row.length/(row.length===5?6:row.length))]).join(''));};
 // One clear ink column between letters; narrow I keeps paired tokens in eight pixels.
 const glyphWidth=c=>(scaledGlyph(c)?.[0].length??98)+1;
 const advance=s=>[...s].reduce((n,c)=>n+(c===' '?2:glyphWidth(c)),0);
 const chars=[...new Set(names.join('').replace(/ /g,''))].sort(),pairs=new Set();
 const reserved=new Set(Array.from({length:32},(_,i)=>0x60+i));
 if(chars.length*2>128-reserved.size)throw Error('Nomes grandes: conjunto de caracteres excede a fonte.');
 const candidates=[...new Set(names.flatMap(n=>Array.from({length:n.length-1},(_,i)=>n.slice(i,i+2)).filter(p=>!p.includes(' ')&&advance(p)-1<=8)))].sort();
 const total=p=>names.reduce((n,s)=>n+tokenize(s,p).count,0);
 while(chars.length+pairs.size<Math.floor((128-reserved.size)/2)){let best=null,score=total(pairs);for(const p of candidates){if(pairs.has(p))continue;const next=total(new Set([...pairs,p]));if(next<score){score=next;best=p;}}if(best===null)break;pairs.add(best);}
 const tokens=names.map(n=>tokenize(n,pairs)),count=tokens.reduce((n,t)=>n+t.count*2,0);
 if(tokens.some(t=>t.count>12))throw Error('Nome grande exige mais de 12 sprites por linha; abrevie para preservar nomes, bandeiras e VS.');
 if(count>763)throw Error('Nomes grandes exigem '+count+' sprites; limite reservado de 763.');
 const dictionary=[...chars,...pairs],font=new Uint8Array(4096),tiles=new Map(),slots=Array.from({length:128},(_,i)=>i).filter(i=>!reserved.has(i));
 // Small OBJ cells avoid the SNES 34-tile scanline limit when two long names,
 // both flags and VS appear together. The lower P bit is the native size flag.
 for(const tile of reserved)font.set(baseFont.slice(tile*32,(tile+1)*32),tile*32);
 for(const [index,text]of dictionary.entries()){
  if(dictionary.length*2>slots.length)throw Error('Nomes altos: alfabeto excede os tiles disponíveis.');const tile=slots[index*2],bottom=slots[index*2+1];tiles.set(text,[0x80+tile,0x80+bottom]);const pixels=Array.from({length:16},()=>new Uint8Array(8));
  for(let i=0;i<text.length;i++){
   const ch=text[i],g=scaledGlyph(ch);if(!g)throw Error('Nomes grandes: caractere indisponível '+ch);
   const width=g[0].length;
   for(let y=0;y<12;y++)for(let x=0;x<width;x++){let ink=false;for(let sx=Math.floor(x*g[0].length/width);sx<Math.floor((x+1)*g[0].length/width);sx++)ink||=g[Math.floor(y*7/12)][sx]==='1';if(ink)pixels[y+1][advance(text.slice(0,i))+x]=10;}
  }
  const copy=pixels.map(r=>r.slice());for(let y=0;y<16;y++)for(let x=0;x<8;x++)if(copy[y][x])for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<8&&yy>=0&&yy<16&&!pixels[yy][xx])pixels[yy][xx]=9;}
  for(let y=0;y<16;y++)for(let x=0;x<8;x++){const at=(y<8?tile:bottom)*32+(y%8)*2,bit=7-x,v=pixels[y][x];for(let plane=0;plane<4;plane++)font[at+(plane>>1)*16+(plane&1)]|=((v>>plane)&1)<<bit;}
 }
 const lists=tokens.map(t=>{const width=t.tokens.reduce((n,s)=>n+advance(s),0)-1;if(width>80)throw Error('Nome grande excede 80 px. Abrevie o campo Nome grande.');let x=Math.round(40-width/2);return t.tokens.flatMap(s=>{if(s===' '){x+=2;return [];}const [top,bottom]=tiles.get(s),sprites=[{x:x&255,y:1,tile:top,prop:0x0A},{x:x&255,y:9,tile:bottom,prop:0x0A}];x+=advance(s);return sprites;});});
 const raw=new Uint8Array(59+count*4),pointers=new Uint8Array(112);raw[0]=56;raw[1]=count&255;raw[2]=count>>8;let offset=0;
 lists.forEach((list,i)=>{raw[3+i]=list.length;pointers.set(word(2*offset),i*2);for(const sp of list){raw[59+offset]=sp.x;raw[59+count+offset]=sp.y;raw[59+count*2+offset]=sp.tile;raw[59+count*3+offset]=sp.prop;offset++;}});
 return {font,raw,pointers,count,dictionary};
}
export function planPlusTeamNames(base,state){
 const entries=teamNameEntries(state);if(!entries.length)return [];
 if(base.length<0x200000||u24(base,0x10A70)!==0x9DE13C||u24(base,0x10C21)!==0xA7E4B6)throw Error('Nomes: ROM-base Plus não reconhecida.');
 const original=konamiLzDecompress(base,0x13E4B6).data;if(original[0]!==56||original.length!==59+u16(original,1)*4)throw Error('Nomes: estrutura original de nomes grandes divergente.');
 for(const pc of [0x10A70,0x10E14,0x11719])if(u24(base,pc)!==0x9DE13C)throw Error('Nomes: loader da fonte divergente.');
 for(const pc of [0x10C21,0x10E49,0x116B5])if(u24(base,pc)!==0xA7E4B6)throw Error('Nomes: loader dos nomes grandes divergente.');
 const names=PRESETS.map(p=>({full:p.english,big:p.english,short:p.english}));for(const entry of entries)names[entry.team]=entry;
 const writes=[],layerPool=new Uint8Array(0xDF6CE-0xDEA6D).fill(255);let used=0;
 for(let team=0;team<56;team++){
  const entry=0x17CA6+team*6,oldCpu=u24(base,entry+3),oldPc=toPc(oldCpu),originalLayer=konamiLzDecompress(base,oldPc).data;
  if(u16(base,entry)!==team*64||base[entry+2]!==0x7F||u16(base,0xFEB0+team*2)!==(oldCpu&65535)||originalLayer.length!==(team===54?128:64))throw Error('Nomes: tabela de nomes curtos divergente na equipe '+team);
  let raw=(base[oldPc+1]&128)?transformLabelPlanes(originalLayer):originalLayer;
  if(entries.some(e=>e.team===team)){const rendered=renderSmallTeamName(names[team].short);raw=raw.slice();raw.set(rendered.raw);}
  const compressed=konamiLzCompress(raw);if(used+compressed.length>layerPool.length)throw Error('Nomes curtos: os textos excedem o bloco nativo.');
  const cpu=toCpu(0xDEA6D+used);layerPool.set(compressed,used);used+=compressed.length;
  writes.push([entry+3,long(cpu)],[0xFEB0+team*2,word(cpu)]);
  if(team===0)writes.push([0xE6B8,long(cpu)]);if(team===1)writes.push([0xE6BD,long(cpu)]);
 }
 writes.push([0xDEA6D,layerPool]);
 const big=renderBigTeamNames(names.map(n=>normalizeTeamName(n.big)),konamiLzDecompress(base,0xEE13C).data),font=konamiLzCompress(big.font),oam=konamiLzCompress(big.raw);
 for(const [pc,data,capacity]of [[0xEE13C,font,konamiLzDecompress(base,0xEE13C).compressedSize],[0x13E4B6,oam,konamiLzDecompress(base,0x13E4B6).compressedSize]]){
  if(data.length>capacity)throw Error('Nomes: o bloco nativo excede a capacidade em '+pc.toString(16)+': '+data.length+'/'+capacity);const slot=new Uint8Array(capacity).fill(255);slot.set(data);writes.push([pc,slot]);
 }
 writes.push([0x17BC4,big.pointers],...teamNameHookWrites(base,big.raw));return writes;
}
export function plusTeamNamesWriter(rom,state,base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('selecao-equipes'))return rom;
 const writes=planPlusTeamNames(base,state);for(const [start,size]of [[SQUAD_OAM_CACHE_SLOT,SQUAD_OAM_CACHE_SIZE],[SQUAD_RESTORE_SLOT,SQUAD_RESTORE_SIZE],[STADIUM_OAM_CACHE_SLOT,STADIUM_OAM_PLANE*4],[STADIUM_RESTORE_SLOT,STADIUM_RESTORE_SIZE]])if(writes.length&&(rom.length<start+size||rom.slice(start,start+size).some(v=>v!==255)))throw Error('Nomes: reserva dos objetos do estádio indisponível.');if(writes.length&&(rom.length<TEAM_NAME_CACHE_SLOT+TEAM_NAME_CACHE_SIZE||rom.slice(TEAM_NAME_CACHE_SLOT,TEAM_NAME_CACHE_SLOT+TEAM_NAME_CACHE_SIZE).some(v=>v!==255)))throw Error('Nomes: reserva do cache imutável indisponível.');if(writes.length&&(rom.length<MENU_OAM_CACHE_SLOT+MENU_OAM_CACHE_SIZE||rom.slice(MENU_OAM_CACHE_SLOT,MENU_OAM_CACHE_SLOT+MENU_OAM_CACHE_SIZE).some(v=>v!==255)))throw Error('Nomes: reserva de objetos compartilhados indisponível.');if(writes.length&&(rom.length<TEAM_NAME_HOOK_SLOT+TEAM_NAME_HOOK_SIZE||rom.slice(TEAM_NAME_HOOK_SLOT,TEAM_NAME_HOOK_SLOT+TEAM_NAME_HOOK_SIZE).some(v=>v!==255)))throw Error('Nomes altos: reserva de código indisponível.');for(const [pc,data]of writes)if(pc+data.length>rom.length)throw Error('Nomes: destino fora da ROM.');for(const [pc,data]of writes)rom.set(data,pc);return rom;
}
