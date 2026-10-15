import {konamiLzDecompress} from './konami-lz.mjs';
export const TITLE_NATIVE_GROUPS=Object.freeze({
 fundo:{desc:0x11979,lengths:[5344,3584]},
 letreiro:{desc:0x1198B,lengths:[3840,4096]},
 fotos:{desc:0x11971,lengths:[14848],planar:true},
});
export function nativeTitleStream(rom,id){
 const g=TITLE_NATIVE_GROUPS[id],d=g.desc,cpu=rom[d]|rom[d+1]<<8|rom[d+2]<<16;
 if((cpu&0x8000)===0||(cpu>>>16)<0x80)throw new Error('Descritor nativo inválido: '+id);
 const pc=((cpu>>>16)&0x7F)*0x8000+(cpu&0x7FFF),size=(rom[pc]|rom[pc+1]<<8)&0x7FFF;
 if(size<2||pc+size>rom.length)throw new Error('Stream nativo inválido: '+id);
 return {pc,size};
}
function deinterleave(d){const o=new Uint8Array(d.length);for(let g=0;g+15<d.length;g+=16)for(let k=0;k<8;k++){o[g+2*k]=d[g+k];o[g+2*k+1]=d[g+8+k];}return o;}
function bytes(v){if(!Array.isArray(v)||v.some(n=>!Number.isInteger(n)||n<0||n>255))throw new Error('Bytes gráficos inválidos');return Uint8Array.from(v);}
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export function customTitleRoles(project){
 const c=project?.state?.titleComposerV2;
 return (c?.state?.elements||[]).filter(e=>e.visible!==false&&['ball','title','photo1','photo2','photo3','photo4','photo5'].includes(e.role||e.id)&&(e.assetDefinition==='customizada'||e.titleTextEnabled)).map(e=>e.role||e.id);
}
export function applyNativeTitleGraphics(rom,base,project,payload){
 const required=customTitleRoles(project),groups=payload?.groups||[];
 for(const role of required){const id=role.startsWith('photo')?'fotos':role==='title'?'letreiro':'fundo';if(!groups.some(g=>g.id===id))throw new Error('Tela Inicial: falta conversão nativa da camada '+role+'. Exportação cancelada para não salvar a imagem original.');}
 const seen=new Set();
 for(const group of groups){
  const def=TITLE_NATIVE_GROUPS[group.id];if(!def||seen.has(group.id))throw new Error('Grupo gráfico não autorizado/duplicado');seen.add(group.id);
  const stream=nativeTitleStream(base,group.id),current=nativeTitleStream(rom,group.id),compressed=bytes(group.bytes),expected=bytes(group.expectedRaw);
  if(group.pc!==stream.pc||current.pc!==stream.pc||compressed.length>stream.size)throw new Error('Gráfico excede o stream nativo ou altera seu ponteiro: '+group.id);
  if(!def.lengths.includes(expected.length))throw new Error('Dimensão gráfica nativa inválida');
  const unpack=source=>{const d=konamiLzDecompress(source).data;return def.planar?deinterleave(d):d;};
  if(konamiLzDecompress(compressed).compressedSize!==compressed.length)throw new Error('Tamanho do stream gráfico divergente');
  if(!equal(unpack(compressed),expected))throw new Error('Round-trip gráfico divergente: '+group.id);
  if(group.id==='fotos'&&(compressed[1]&0x80)===0)throw new Error('Fotos perderam o bit de organização planar');
  if(equal(unpack(base.slice(stream.pc,stream.pc+stream.size)),expected))throw new Error('Conversão gráfica ainda contém os tiles originais: '+group.id);
  rom.set(compressed,stream.pc);
  if(!equal(unpack(rom.slice(stream.pc,stream.pc+compressed.length)),expected))throw new Error('Pixels gráficos não sobreviveram ao build');
 }return rom;
}
