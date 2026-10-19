import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {additionalTextValues,normalizeAdditionalText,ADDITIONAL_TEXT_SECTIONS} from './additional-screen-text-fields.mjs';
import {GRAPHICAL_LABEL_ASSETS} from './graphical-label-layout.mjs';
import {COMPACT_MENU_FONT} from './plus-controller-text.mjs';
import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {NATIVE_MENU_FONTS} from './native-menu-text-fields.mjs';

export function transformLabelPlanes(raw,inverse=false){
 const out=new Uint8Array(raw.length);
 for(let g=0;g<raw.length;g+=16)for(let k=0;k<8;k++){
  if(inverse){out[g+k]=raw[g+2*k];out[g+8+k]=raw[g+2*k+1];}
  else{out[g+2*k]=raw[g+k];out[g+2*k+1]=raw[g+8+k];}
 }
 return out;
}
// One horizontal strip; supports native 2bpp menu text and 4bpp formation text.
const ROLE_FONT=Object.fromEntries(Object.entries(PLUS_MAIN_MENU_GLYPHS).map(([c,rows])=>[c,rows.slice(0,7).map(v=>Array.from({length:5},(_,x)=>v&(1<<(6-x))?'1':'0').join(''))]));
export function drawGraphicalLabel(raw,text,{tile=0,tiles,bpp=2,background=0,ink=1,outline=3,x=0,right=tiles*8,condense=false,align='left',font=COMPACT_MENU_FONT}={}){
 const q=normalizeAdditionalText(text),glyphs=[...q].map(c=>{
  if(c===' ')return {rows:[],w:2,space:true};
  const rows=condense&&c==='-'?['0','0','0','1','0','0','0']:font[c];if(!rows)throw Error('Caractere indisponível no texto gráfico: '+c);
  return {rows,w:rows[0].length};
 });
 const normal=Math.max(0,glyphs.reduce((n,g)=>n+g.w+(g.space?0:1),0)-1);
 const gap=condense&&normal>right-x?0:1;
 const width=Math.max(0,glyphs.reduce((n,g)=>n+g.w+(g.space?0:gap),0)-gap);
 if(width>right-x)throw Error('“'+q+'” precisa de '+width+' px; este campo possui '+(right-x)+' px.');
 const stride=bpp*8,pix=new Uint8Array(tiles*8*8),w=tiles*8;
 if((tile+tiles)*stride>raw.length)throw Error('Rótulo fora dos tiles reservados.');
 for(let t=0;t<tiles;t++)for(let y=0;y<8;y++)for(let xx=0;xx<8;xx++){
  let v=0;for(let p=0;p<bpp;p++)v|=((raw[(tile+t)*stride+(p>>1)*16+y*2+(p&1)]>>(7-xx))&1)<<p;
  pix[y*w+t*8+xx]=v;
 }
 for(let yy=0;yy<8;yy++)pix.fill(background,yy*w+x,yy*w+right);
 const strokes=[];let cursor=x+(align==='center'?Math.floor((right-x-width)/2):align==='right'?right-x-width:0);
 for(const g of glyphs){for(let yy=0;yy<g.rows.length;yy++)for(let xx=0;xx<g.w;xx++)if(g.rows[yy][xx]==='1')strokes.push([cursor+xx,yy]);cursor+=g.w+(g.space?0:gap);}
 for(const [xx,yy] of strokes)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const nx=xx+dx,ny=yy+dy;if(nx>=x&&nx<right&&ny>=0&&ny<8)pix[ny*w+nx]=outline;
 }
 for(const [xx,yy] of strokes)pix[yy*w+xx]=ink;
 for(let t=0;t<tiles;t++)for(let y=0;y<8;y++)for(let p=0;p<bpp;p++){
  let v=0;for(let xx=0;xx<8;xx++)v|=((pix[y*w+t*8+xx]>>p)&1)<<(7-xx);
  raw[(tile+t)*stride+(p>>1)*16+y*2+(p&1)]=v;
 }
 return raw;
}
function drawTallLabel(raw,value,tiles){
 const text=normalizeAdditionalText(value),w=tiles.length/2*8,pix=new Uint8Array(w*16);
 const width=[...text].reduce((n,c)=>n+(c===' '?2:(COMPACT_MENU_FONT[c]?.[0].length??99)+1),0)-1;
 if(width>w)throw Error('Rótulo alto: texto excede '+w+' px.');let x=Math.floor((w-width)/2);
 for(const c of text){if(c===' '){x+=2;continue;}const g=COMPACT_MENU_FONT[c];for(let y=0;y<7;y++)for(let xx=0;xx<g[0].length;xx++)if(g[y][xx]==='1')for(let yy=0;yy<2;yy++)pix[(y*2+yy+1)*w+x+xx]=1;x+=g[0].length+1;}
 for(let t=0;t<tiles.length;t++)for(let y=0;y<8;y++){let b=0;for(let xx=0;xx<8;xx++)b|=pix[(Math.floor(t/(w/8))*8+y)*w+(t%(w/8))*8+xx]<<(7-xx);raw[tiles[t]*16+y*2]=b;raw[tiles[t]*16+y*2+1]=0;}
}
// Four non-contiguous 4bpp tiles form each 16x16 role button. Keep its
// triangular border and keep the native six-pixel lettering and shadow.
const NATIVE_ROLE_BUTTON_FONT={
 D:['11110','11011','11011','11011','11011','11110'],
 F:['11111','11000','11110','11000','11000','11000'],
 M:['11011','11111','11111','11011','11011','11011'],
 C:['01111','11000','11000','11000','11000','01111'],
 A:['01110','11011','11011','11111','11011','11011'],
 T:['11111','01100','01100','01100','01100','01100'],
};
function paintRoleButton(parts,value){
 const text=normalizeAdditionalText(value),w=text.length*7-2;if(w>14)throw Error('Ícone de posição: máximo de 14 px.');
 const pixels=Array.from({length:7},()=>new Uint8Array(14).fill(14)),strokes=[];
 let left=Math.floor((16-w)/2)-1;
 for(const c of text){const glyph=NATIVE_ROLE_BUTTON_FONT[c]??ROLE_FONT[c]?.slice(0,6);if(!glyph)throw Error('Ícone: caractere indisponível.');for(let y=0;y<6;y++)for(let x=0;x<5;x++)if(glyph[y][x]==='1')strokes.push([left+x,y]);left+=7;}
 // Native DF has six-pixel white strokes and a dark-to-purple lower shadow.
 for(const [x,y]of strokes)for(let dx=0;dx<3;dx++)if(x+dx<14)pixels[y+1][x+dx]=Math.min(pixels[y+1][x+dx],12+dx);
 for(const [x,y]of strokes)pixels[y][x]=11;
 for(let y=0;y<7;y++)for(let x=0;x<14;x++){
  const px=x+1,py=y+4,[raw,tile]=parts[(py>>3)*2+(px>>3)],v=pixels[y][x];
  for(let p=0;p<4;p++){const at=tile*32+(p>>1)*16+(py%8)*2+(p&1),bit=1<<(7-px%8);raw[at]=(raw[at]&~bit)|(((v>>p)&1)?bit:0);}
 }
}
// The native participation caption spans eleven top cells and seven bottom
// cells. Four extra cells complete the second row without touching role icons.
function paintTallButton(raw,value,tiles,columns){
 const text=normalizeAdditionalText(value),width=[...text].reduce((n,c)=>n+(c===' '?2:(COMPACT_MENU_FONT[c]?.[0].length??99)+1),0)-1;
 const w=columns*8,scale=Math.min(2,(w-8)/width),target=Math.floor(width*scale),origin=Math.floor((w-target)/2),pix=new Uint8Array(w*16).fill(11),mask=new Uint8Array(width*7);let x=0;
 for(const c of text){if(c===' '){x+=2;continue;}const glyph=COMPACT_MENU_FONT[c];if(!glyph)throw Error('Botão: caractere indisponível.');for(let y=0;y<7;y++)for(let xx=0;xx<glyph[0].length;xx++)if(glyph[y][xx]==='1')mask[y*width+x+xx]=1;x+=glyph[0].length+1;}
 const strokes=[];for(let y=1;y<15;y++)for(let xx=0;xx<target;xx++)if(mask[Math.floor((y-1)/2)*width+Math.floor(xx/scale)])strokes.push([origin+xx,y]);
 for(const [xx,y] of strokes)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=xx+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<16)pix[ny*w+nx]=9;}
 for(const [xx,y] of strokes)pix[y*w+xx]=8;
 for(let t=0;t<tiles.length;t++)for(let y=0;y<8;y++)for(let p=0;p<4;p++){let b=0;for(let xx=0;xx<8;xx++)b|=((pix[(Math.floor(t/columns)*8+y)*w+t%columns*8+xx]>>p)&1)<<(7-xx);raw[tiles[t]*32+(p>>1)*16+y*2+(p&1)]=b;}
}
function cpu(pc){return (0x80+(pc>>15))*0x10000+0x8000+(pc&0x7FFF);}
function pointer(a){return [a&255,(a>>8)&255,(a>>16)&255];}
export function literalLabelStream(source,planar=false){
 const out=new Uint8Array(2+source.length+Math.ceil(source.length/31));let at=2;
 for(let i=0;i<source.length;i+=31){const part=source.subarray(i,i+31);out[at++]=0x80|part.length;out.set(part,at);at+=part.length;}
 out[0]=out.length&255;out[1]=(out.length>>8)|(planar?128:0);return out;
}
export function prepareSharedGraphicalBaseline(rom,state={},base=rom,selectedAreas=null){
 const values=additionalTextValues(state),active=area=>!selectedAreas||selectedAreas.includes(area);
 const allFields={teamStats:[['navigation-labels','cancel','CANCEL','formacoes'],['navigation-labels','cancel','CANCEL','pre-partida'],['formation-labels','defenders','DF','formacoes'],['formation-labels','midfielders','MF','formacoes'],['formation-labels','forwards','FW','formacoes']],cancelHeader:[['navigation-labels','cancel','CANCEL','pre-partida'],['team-selection-labels','formation','FORMATION','selecao-equipes'],['team-selection-labels','statistics','TEAM STATISTICS','selecao-equipes']]};
 const writes=[];
 for(const a of GRAPHICAL_LABEL_ASSETS.filter(a=>a.literal)){
  if(!allFields[a.id].some(([s,id,en,area])=>active(area)&&Object.hasOwn(values[s]||{},id)&&normalizeAdditionalText(values[s][id])!==en))continue;
  const d=konamiLzDecompress(base,a.pc);
  if(d.data.length!==a.raw||d.compressedSize>a.size||!!(base[a.pc+1]&128)!==a.planar||a.pointers.some(pc=>pointer(a.cpu).some((v,i)=>base[pc+i]!==v)))throw Error(a.id+': ROM-base divergente.');
  if(base.slice(a.slot,a.slot+a.capacity).length!==a.capacity||base.slice(a.slot,a.slot+a.capacity).some(v=>v!==255))throw Error(a.id+': reserva ocupada.');
  let source=d.data;if(a.id==='teamStats'&&active('formacoes')&&Object.hasOwn(values['navigation-labels']||{},'cancel')&&normalizeAdditionalText(values['navigation-labels'].cancel)!=='CANCEL'){source=new Uint8Array(86*32);source.set(d.data);}
  writes.push([a.slot,literalLabelStream(source,a.planar)]);for(const pc of a.pointers)writes.push([pc,pointer(cpu(a.slot))]);
 }
 for(const [pc,bytes] of writes)rom.set(bytes,pc);return rom;
}
export function plusGraphicalLabelsWriter(rom,state={},base=rom,selectedAreas=null){
 const values=additionalTextValues(state),writes=[];
 const active=area=>!selectedAreas||selectedAreas.includes(area);
 const original=(s,id)=>ADDITIONAL_TEXT_SECTIONS.find(a=>a.id===s).fields.find(f=>f[0]===id)[1];
 const changed=(s,id)=>Object.hasOwn(values[s]||{},id)&&normalizeAdditionalText(values[s][id])!==normalizeAdditionalText(original(s,id));
 const assets=new Map();
 function asset(id){
  if(assets.has(id))return assets.get(id).raw;
  const a=GRAPHICAL_LABEL_ASSETS.find(a=>a.id===id),decoded=konamiLzDecompress(base,a.pc);
  if(decoded.data.length!==a.raw||decoded.compressedSize>a.size||!!(base[a.pc+1]&128)!==a.planar)throw Error(id+': bloco gráfico diverge da ROM Plus verificada.');
  for(const pc of a.pointers)if(pointer(a.cpu).some((v,i)=>base[pc+i]!==v))throw Error(id+': ponteiro gráfico diverge da ROM Plus verificada.');
  const raw=a.planar?transformLabelPlanes(decoded.data):decoded.data.slice();assets.set(id,{a,raw});return raw;
 }
 const draw=(assetId,s,id,tile,tiles,extra={})=>{if(changed(s,id))drawGraphicalLabel(asset(assetId),values[s][id],{tile,tiles,...extra});};
 if(active('jogadores')){
  const s='player-labels';draw('playerMisc',s,'player',0,4);draw('playerMisc',s,'substitute',4,4);
  draw('playerSkills',s,'pointsLeft',39,3);
  if(changed(s,'pointsLeft')){
   // DATA_87C7FC is a 7x3 BG3 rectangle. Both counters keep their
   // independent native calculations; only their coordinates move right.
   const expected=[2,1,1,169,170,171,0,172,173,0,0,0,0,0,0,0,10,1,169,170,171];
   if(expected.some((v,i)=>base[0x3C7FC+i]!==v)||base[0x3347A]!==0xA0||base[0x33485]!==0xA0)throw Error('Pontos: descritores nativos divergentes.');
   writes.push([0x3C7FC,Uint8Array.from([169,170,171,2,1,1,0,0,0,0,0,0,0,0,169,170,171,0,10,1,0])]);
   writes.push([0x3347B,Uint8Array.of(0x12)],[0x33486,Uint8Array.of(0x12)]);
  }
  draw('playerMisc',s,'speed',8,4);
  // Keep the native four-cell rectangles: wider descriptors collide with
  // live points/counter overlays. Long inscriptions use the same 3x7 alphabet
  // with zero inter-letter spacing (and a one-pixel hyphen), without truncation.
  for(const [id,tile] of [['dash',44],['shotPower',0],['curlSkill',4],['balance',8],['intelligence',12],['jump',16],['dribble',20],['stamina',24]])draw('playerSkills',s,id,tile,4,{condense:true});
 }
 if(active('selecao-equipes')){
  draw('cancelHeader','team-selection-labels','statistics',0,6,{condense:true});draw('cancelHeader','team-selection-labels','formation',6,5);
  if(changed('team-selection-labels','keeperAbbr')){const text=normalizeAdditionalText(values['team-selection-labels'].keeperAbbr);if(!/^[A-Z ]{0,2}$/.test(text))throw Error('GO: máximo de duas letras.');writes.push([0x3C530,Uint8Array.from(text.padEnd(2),c=>NATIVE_MENU_FONTS.SmallMenuText[c])]);}
 }
 if(active('formacoes')){
  for(const [id,pc] of [['defenders',0x3C532],['midfielders',0x3C534],['forwards',0x3C536]])if(changed('formation-labels',id)){const text=normalizeAdditionalText(values['formation-labels'][id]);if(text.length>2||!/^[A-Z ]*$/.test(text))throw Error('Posição: máximo de duas letras.');writes.push([pc,Uint8Array.from(text.padEnd(2),c=>NATIVE_MENU_FONTS.SmallMenuText[c])]);}
  const s='formation-labels';
  if(changed('navigation-labels','cancel')){
   const raw=new Uint8Array(86*32);raw.set(asset('teamStats'));assets.get('teamStats').raw=raw;
   drawGraphicalLabel(raw,values['navigation-labels'].cancel,{tile:80,tiles:6,bpp:4,background:12,ink:9,outline:12,align:'center',font:ROLE_FONT});
   const map=asset('formationRoleMap'),row=21*32;
   const set=(x,t)=>{map[(row+x)*2]=t&255;map[(row+x)*2+1]=t>>8;};
   set(7,0x1C27);set(8,0x1C28);for(let x=0;x<6;x++)set(9+x,0x1D00+x);
   if([0x44,0x03,0xC2,0xA9,2,2,0x44,0x17,0xC2,0xAB,2,4].some((v,i)=>base[0x3ADC8+i]!==v)||base.slice(0x3FB90,0x3FB98).some(v=>v!==255))throw Error('CANCELA: controles do rodapé divergentes.');
   writes.push([0x3ADC8,Uint8Array.from([0x44,0x03,0xC2,0xA7,2,2,0x44,0x90,0xFB,0xA9,2,6])],[0x3FB90,Uint8Array.from([0xFD,0x3D,0,1,2,3,4,5])]);
   // This table normally translates code 1 to tile D3 (NUMBER), not 101.
   // Only our six literal cells bypass that lookup; every native string keeps
   // the original conversion and attributes.
   if([0xBD,0x16,0xC0,0x05,0x06].some((v,i)=>base[0x28E80+i]!==v)||rom.length<0x3E3240||rom.slice(0x3E3200,0x3E3240).some(v=>v!==255))throw Error('CANCELA: conversor de células divergente.');
   const literal=Uint8Array.from([0xC0,0x92,0xFB,0x90,21,0xC0,0x98,0xFB,0xB0,16,0xA5,6,0xC9,0,0x3D,0xD0,9,0x8A,0x4A,0x18,0x69,0,1,0x05,6,0x6B,0xBF,0x16,0xC0,0x87,0x05,6,0x6B]);
   writes.push([0x28E80,Uint8Array.from([0x22,...pointer(cpu(0x3E3200)),0xEA])],[0x3E3200,literal]);

  }
  if(changed(s,'formationType')){
   const text=normalizeAdditionalText(values[s].formationType),words=text.split(' ');let line='';
   const measure=q=>[...q].reduce((n,c)=>n+(c===' '?2:COMPACT_MENU_FONT[c]?.[0].length+1||999),0)-1;
   while(words.length&&measure(line?line+' '+words[0]:words[0])<=32)line+=(line?' ':'')+words.shift();
   drawGraphicalLabel(asset('formationType'),line,{tile:0,tiles:4});drawGraphicalLabel(asset('formationType'),words.join(' '),{tile:4,tiles:5});
  }
  if(changed(s,'attackParticipation')){
   const old=asset('attackParticipation'),raw=new Uint8Array(75*32);raw.set(old);assets.get('attackParticipation').raw=raw;
   const tiles=[...Array.from({length:18},(_,i)=>50+i),71,72,73,74];
   paintTallButton(raw,values[s].attackParticipation,tiles,11);
   const map=asset('formationRoleMap');
   for(let x=0;x<11;x++){const at=((25*32)+5+x)*2,word=map[at]|map[at+1]<<8;const tile=0x69+tiles[11+x];map[at]=(word&0xFC00|tile)&255;map[at+1]=(word&0xFC00|tile)>>8;}
  }
  for(const [id,tile] of [['defenders',6],['midfielders',8],['forwards',10]])if(changed(s,id))drawGraphicalLabel(asset('teamStats'),values[s]?.[id]??original(s,id),{tile,tiles:2,bpp:4,background:8,ink:9,outline:13,x:1,font:ROLE_FONT});
  const mf=changed(s,'midfielders'),fw=changed(s,'forwards'),df=changed(s,'defenders');
  if(mf||fw||df){
   let raw=asset('attackParticipation');
   if(mf||df){
    const next=new Uint8Array(Math.max(raw.length,71*32));next.set(raw);
    const top=transformLabelPlanes(konamiLzDecompress(base,0xF6F2B).data);
    if(top.length!==544)throw Error('Ícones: gráficos-base divergentes.');
    next.set(top.subarray(2*32,3*32),69*32);next.set(raw.subarray(32,64),70*32);raw=next;assets.get('attackParticipation').raw=raw;
    if(mf)paintRoleButton([[raw,2],[raw,69],[raw,3],[raw,70]],values[s].midfielders);
    const map=asset('formationRoleMap');let matches=0;
    for(let i=0;i<map.length-3;i+=2){const a=map[i]|map[i+1]<<8,b=map[i+2]|map[i+3]<<8;
     if(a===0x1CB8&&b===0x1CB7){map[i+2]=0xB9;matches++;}
     if((a&1023)===0x6B&&(b&1023)===0x32)map[i+2]=0xAE;
     if((a&1023)===0x6C&&(b&1023)===0x6A)map[i+2]=0xAF;
    }
    if(!matches)throw Error('MF: descritor da formação não encontrado.');
   }
   if(fw)paintRoleButton([[raw,4],[raw,5],[raw,6],[raw,7]],values[s].forwards);
   if(df){const top=asset('formationRoleButtonTop');paintRoleButton([[top,1],[top,2],[raw,0],[raw,1]],values[s].defenders);}
  }
  // DATA_9A8BE0: four 32-byte strips FW/MF/DF/GK, selected by
  // DATA_819419 and DMA'd by CODE_80CC8B on the formation screen.
  for(const [id,offset] of [['forwards',0],['midfielders',32],['defenders',64]])if(changed(s,id)){
   const text=normalizeAdditionalText(values[s][id]).padEnd(2),font=konamiLzDecompress(base,0xD81FA).data,raw=new Uint8Array(32);for(let i=0;i<2;i++)if(text[i]!==' '){const tile=text.charCodeAt(i)-65;if(tile<0||tile>=26)throw Error('Posição: use duas letras.');raw.set(font.slice(tile*16,(tile+1)*16),i*16);}writes.push([0xD0BE0+offset,raw]);
  }
 }
 if(active('pre-partida')){
  for(const [id,tile,tiles] of [['shirt',0,4],['pants',4,4],['socks',8,4],['color',12,3],['type',24,4],['edit',28,3]])draw('uniformLabels','uniform-labels',id,tile,tiles,{condense:true});
  for(const [id,tile,tiles] of [['keeper',8,8],['skill',16,4]])draw('handicapLabels','handicap-labels',id,tile,tiles,{condense:true,align:'center'});
  if(changed('handicap-labels','players')){
   const words=normalizeAdditionalText(values['handicap-labels'].players).split(' ');let first='';const width=q=>[...q].reduce((n,c)=>n+(c===' '?2:(COMPACT_MENU_FONT[c]?.[0].length??99)+1),0)-1;
   while(words.length&&width(first?first+' '+words[0]:words[0])<=48)first+=(first?' ':'')+words.shift();
   drawGraphicalLabel(asset('handicapLabels'),first,{tile:20,tiles:6,align:'center'});drawGraphicalLabel(asset('handicapLabels'),words.join(' '),{tile:26,tiles:5,align:'center'});
  }
  if(['condition','keeper','skill','players','strong','weak'].some(id=>changed('handicap-labels',id))){
   const expected=[0,101,119,0,102,119,0,103,119,95,94,119,95,95,119];
   if(expected.some((v,i)=>base[0x3C875+i]!==v))throw Error('Vantagem: tabela de quantidade divergente.');
   const counts=Uint8Array.from(expected);for(const i of [2,5,8,11,14])counts[i]=0;writes.push([0x3C875,counts]);
  }
  if(changed('handicap-labels','condition'))drawTallLabel(asset('handicapLabels'),values['handicap-labels'].condition,[0,2,4,6,1,3,5,7]);
  draw('handicapStrength','handicap-labels','strong',0,4,{align:'right'});
  if(changed('handicap-labels','strong')||changed('handicap-labels','weak')){
   const old=asset('handicapLabels'),raw=new Uint8Array(640);raw.set(old);assets.get('handicapLabels').raw=raw;
   drawGraphicalLabel(raw,values['handicap-labels'].strong??'STRONG',{tile:32,tiles:4,align:'left'});
   drawGraphicalLabel(raw,values['handicap-labels'].weak??'WEAK',{tile:36,tiles:4,align:'right'});
   if(base[0x3AFCA]!==0x15||base[0x3AFCB]!==2||base.slice(0x3FB80,0x3FB88).some(v=>v!==255))throw Error('Vantagem: descritores dos extremos divergentes.');
   writes.push([0x3AFC8,Uint8Array.of(0x80,0xFB,0x16,2)],[0x3AFD4,Uint8Array.of(0x84,0xFB,0x1B,2)],[0x3FB80,Uint8Array.from([0xB2,0xB3,0xB4,0xB5,0xB6,0xB7,0xB8,0xB9])]);
  }draw('handicapStrength','handicap-labels','weak',4,4);
  draw('playerNumberLabel','navigation-labels','numbers',0,3,{bpp:4,background:12,ink:9,outline:12,x:1,right:23,condense:true,align:'center'});
  const s='navigation-labels';
  if(changed(s,'cancel')){
   drawGraphicalLabel(asset('teamStats'),values[s].cancel,{tile:2,tiles:4,bpp:4,background:12,ink:9,outline:12,x:1});
   const raw=base.slice(0xD0B60,0xD0BE0);drawGraphicalLabel(raw,values[s].cancel,{tiles:8,x:1});writes.push([0xD0B60,raw]);
   // Preserve B and its arrow in the first twelve pixels of this strip.
   drawGraphicalLabel(asset('cancelHeader'),values[s].cancel,{tile:16,tiles:5,x:12,condense:true});
  }
  if(changed(s,'exit')){
   drawGraphicalLabel(asset('navigationButtons'),values[s].exit,{tile:13,tiles:3,bpp:4,background:12,ink:9,outline:12,x:4,right:20});
   const text=normalizeAdditionalText(values[s].exit);if(text.length>7)throw Error('EXIT: máximo de 7 células.');
   if([0x6C,0x7F,0x70,0x7B,0,0,0].some((v,i)=>base[0x3DFB7+i]!==v))throw Error('EXIT: texto nativo diverge da ROM Plus verificada.');
   const bytes=Uint8Array.from(text.padEnd(7),c=>{const v=NATIVE_MENU_FONTS.TallMenuText[c];if(v===undefined)throw Error('EXIT: caractere indisponível.');return v;});writes.push([0x3DFB7,bytes]);
  }
 }
 for(const {a,raw} of assets.values()){
  const source=a.planar?transformLabelPlanes(raw,true):raw,packed=a.literal?literalLabelStream(source):konamiLzCompress(source);
  if(packed.length>a.capacity)throw Error(a.id+': bloco gráfico excede a reserva.');
  if(konamiLzDecompress(packed).data.some((v,i)=>v!==source[i]))throw Error(a.id+': falha ao conferir compressão.');
  if(a.planar)packed[1]|=128;
  if(rom.length<a.slot+a.capacity||base.slice(a.slot,a.slot+a.capacity).length!==a.capacity||base.slice(a.slot,a.slot+a.capacity).some(v=>v!==255)||(!a.literal&&rom.slice(a.slot,a.slot+a.capacity).some(v=>v!==255)))throw Error(a.id+': espaço gráfico reservado indisponível.');
  writes.push([a.slot,packed]);for(const pc of a.pointers)writes.push([pc,Uint8Array.from(pointer(cpu(a.slot)))]);
 }
 for(const [pc,data] of writes)rom.set(data,pc);
 return rom;
}
