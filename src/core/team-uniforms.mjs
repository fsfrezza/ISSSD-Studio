// Plus native match uniforms: palette loader at 8B:CFD0 and jersey detail DMA at 84:E802.
export const UNIFORM_SCHEMA='isssd-team-uniforms-v1';
export const JERSEY_DETAILS_PC=0xC45D4,JERSEY_DETAIL_COUNT=32;
const word=(b,p)=>b[p]|b[p+1]<<8;
const pc=cpu=>((cpu&0x7F0000)>>>1)|(cpu&32767);
export function uniformMapping(base){
 if(base[0x5CFD0]!==0xBF||base[0x26801]!==0xBF)throw Error('Mapeamento de uniformes Plus não verificado.');
 const palette=pc(base[0x5CFD1]|base[0x5CFD2]<<8|base[0x5CFD3]<<16),layouts=pc(base[0x26802]|base[0x26803]<<8|base[0x26804]<<16);
 if(palette!==0x10274||layouts!==0xFCEC)throw Error('Tabelas de uniformes Plus divergentes.');return{palette,layouts};
}
export function validateUniforms(value){
 if(value==null)return{schema:UNIFORM_SCHEMA,version:1,kits:{},layouts:{},patterns:{}};
 if(value.schema!==UNIFORM_SCHEMA||value.version!==1)throw Error('Projeto de uniformes inválido.');
 const out={schema:UNIFORM_SCHEMA,version:1,kits:{},layouts:{},patterns:{}};
 for(const part of ['kits','layouts','patterns'])if(!value[part]||typeof value[part]!=='object'||Array.isArray(value[part]))throw Error('Seção de uniformes inválida: '+part);
 for(const [key,entry]of Object.entries(value.kits)){
  if(!/^(\d+):[01]$/.test(key)||Number(key.split(':')[0])>=56||String(Number(key.split(':')[0]))!==key.split(':')[0]||!Array.isArray(entry.colors)||entry.colors.length!==9||entry.colors.some(c=>!Number.isInteger(c)||c<0||c>32767))throw Error('Cores de uniforme inválidas: '+key);
  out.kits[key]={colors:entry.colors.slice()};
 }
 for(const [key,pointer]of Object.entries(value.layouts)){
  if(!/^\d+$/.test(key)||String(Number(key))!==key||Number(key)>=56||!Number.isInteger(pointer)||!(pointer===0xF014||pointer===0xF0D4||(pointer>=0xC5D4&&pointer<0xE5D4&&(pointer-0xC5D4)%256===0)))throw Error('Desenho de camisa inválido: '+key);out.layouts[key]=pointer;
 }
 for(const [key,pixels]of Object.entries(value.patterns)){
  if(!/^\d+$/.test(key)||String(Number(key))!==key||Number(key)>=32||!Array.isArray(pixels)||pixels.length!==512||pixels.some(p=>!Number.isInteger(p)||p<0||p>15))throw Error('Quadros de camisa inválidos: '+key);out.patterns[key]=pixels.slice();
 }return out;
}
export function nativeUniform(base,team,kit=0){
 if(!Number.isInteger(team)||team<0||team>=56||![0,1].includes(kit))throw Error('Equipe/uniforme inválido.');
 const {palette,layouts}=uniformMapping(base),pointer=word(base,palette+(team+kit*56)*2),at=0x48000+(pointer&32767);
 if(pointer<0x8000||at+34>base.length||word(base,at)!==31)throw Error('Paleta de uniforme inválida.');
 return{pc:at+2,colors:Array.from({length:16},(_,i)=>word(base,at+2+i*2)),layout:word(base,layouts+team*2)};
}
export function readUniform(base,state,team,kit=0){const value=nativeUniform(base,team,kit),entry=state?.kits?.[team+':'+kit];if(entry)value.colors.splice(7,9,...entry.colors);value.layout=state?.layouts?.[team]??value.layout;return value;}
export function readJerseyPattern(base,state,style){
 if(!Number.isInteger(style)||style<0||style>=32)throw Error('Modelo de camisa inválido.');
 if(state?.patterns?.[style])return state.patterns[style].slice();
 const start=JERSEY_DETAILS_PC+style*256,pixels=Array(512).fill(0);
 for(let tile=0;tile<8;tile++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let plane=0;plane<4;plane++)pixels[tile*64+y*8+x]|=((base[start+tile*32+(plane>>1)*16+y*2+(plane&1)]>>(7-x))&1)<<plane;
 return pixels;
}
export function encodeJerseyPattern(pixels){const bytes=new Uint8Array(256);for(let tile=0;tile<8;tile++)for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let plane=0;plane<4;plane++)bytes[tile*32+(plane>>1)*16+y*2+(plane&1)]|=((pixels[tile*64+y*8+x]>>plane)&1)<<(7-x);return bytes;}
export function uniformRegions(base){
 const {layouts}=uniformMapping(base),regions=[[layouts,layouts+112],[JERSEY_DETAILS_PC,JERSEY_DETAILS_PC+8192]];
 for(let team=0;team<56;team++)for(let kit=0;kit<2;kit++){const p=nativeUniform(base,team,kit).pc+14;regions.push([p,p+18]);}return regions;
}
export function plusUniformsWriter(rom,state,base,selectedAreas=null){
 const value=validateUniforms(state.uniformsV1);if(selectedAreas&&!selectedAreas.includes('jogadores'))return rom;
 if(!Object.values(value.kits).length&&!Object.keys(value.layouts).length&&!Object.keys(value.patterns).length)return rom;
 const {layouts}=uniformMapping(base),writes=[];
 for(const[key,entry]of Object.entries(value.kits)){const [team,kit]=key.split(':').map(Number),at=nativeUniform(base,team,kit).pc;for(let t=0;t<56;t++)for(let k=0;k<2;k++)if((t!==team||k!==kit)&&nativeUniform(base,t,k).pc===at)throw Error('Paleta compartilhada: individualização necessária.');writes.push([at+14,Uint8Array.from(entry.colors.flatMap(v=>[v&255,v>>8]))]);}
 for(const[key,pointer]of Object.entries(value.layouts))writes.push([layouts+Number(key)*2,Uint8Array.of(pointer&255,pointer>>8)]);
 for(const[key,pixels]of Object.entries(value.patterns))writes.push([JERSEY_DETAILS_PC+Number(key)*256,encodeJerseyPattern(pixels)]);
 for(const[at,data]of writes)if(at<0||at+data.length>rom.length)throw Error('Uniforme fora da ROM.');
 for(const[at,data]of writes)rom.set(data,at);return rom;
}
