import {captureSelectionFlags,nativeFieldFlagPointer} from './independent-teams.mjs';
import {konamiLzDecompress} from './konami-lz.mjs';
import {independentFlagPixels,editIndependentFlag} from './independent-team-fields.mjs';
export const TEAM_FLAGS_SCHEMA='isssd-team-flags-v1';
export function validateTeamFlags(value){
 if(value==null)return{schema:TEAM_FLAGS_SCHEMA,teams:{}};
 if(value.schema!==TEAM_FLAGS_SCHEMA||!value.teams||Array.isArray(value.teams))throw Error('Bandeiras: projeto inválido.');
 const out={schema:TEAM_FLAGS_SCHEMA,teams:{}};
 for(const[id,flag]of Object.entries(value.teams)){
  if(!/^(0|[1-9]\d*)$/.test(id)||Number(id)>=54||!flag)throw Error('Bandeiras: equipe inválida.');
  if(!Array.isArray(flag.colors)||flag.colors.length!==4||flag.colors.some(v=>!Number.isInteger(v)||v<0||v>32767))throw Error('Bandeiras: quatro cores BGR555 necessárias.');
  const row={colors:flag.colors.slice()};for(const key of ['selectionPixels','fieldPixels']){const p=flag[key];if(!Array.isArray(p)||p.length!==384||p.some(v=>!Number.isInteger(v)||v<0||v>15))throw Error('Bandeiras: quadro de 24 × 16 inválido.');row[key]=p.slice();}out.teams[id]=row;
 }return out;
}
export function flagPixelsToStreams(pixels){return editIndependentFlag({data:{}},pixels,'fieldFlags').data.fieldFlags;}
export function captureTeamFlag(rom,id){
 if(!Number.isInteger(id)||id<0||id>=54||!(rom instanceof Uint8Array))throw Error('Bandeira nativa inválida.');
 const w=at=>rom[at]|rom[at+1]<<8,p=w(0xFE06+id*2),at=0x48000+(p&32767);
 if(p<0x8000||w(at)!==7)throw Error('Paleta nativa da bandeira divergente.');
 const fieldFlags=[0,1].map(h=>{const ptr=nativeFieldFlagPointer(rom,id*4+h*2),start=0xD0000+(ptr&32767);return{bytes:Array.from(konamiLzDecompress(rom,start).data),planar:!!(rom[start+1]&128)};});
 return{colors:Array.from({length:4},(_,i)=>w(at+2+i*2)),selectionPixels:independentFlagPixels({data:{selectionFlags:captureSelectionFlags(rom,id)}},'selectionFlags'),fieldPixels:independentFlagPixels({data:{fieldFlags}},'fieldFlags')};
}
