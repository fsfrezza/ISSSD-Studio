import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('4 MiB obrigatório: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
if(!html.includes(applyNeedle))throw new Error('4 MiB obrigatório: studioApplyProjectWithBase não encontrado.');

// A preparação injetada abaixo é autossuficiente: não chama o preparador tático legado
// nem depende do momento em que activeRomProfile é inicializado para a barreira de restore.
// O algoritmo replica as invariantes rastreadas em src/core/plus-tactics-infrastructure.mjs.
const helper=String.raw`function studioPlus4MiBAscii(text){return new TextEncoder().encode(String(text))}
function studioPlus4MiBBytesEqual(source,off,bytes){if(off<0||off+bytes.length>source.length)return false;for(let i=0;i<bytes.length;i++)if(source[off+i]!==bytes[i])return false;return true}
function studioPlus4MiBLoRomPc(bank,addr){if(!Number.isInteger(bank)||!Number.isInteger(addr)||bank<0x80||addr<0x8000)return null;return ((bank&0x7F)*0x8000)+(addr&0x7FFF)}
function studioPlus4MiBJsl(helperPc){const bank=0x80+Math.floor(helperPc/0x8000),addr=0x8000+(helperPc&0x7FFF);return new Uint8Array([0x22,addr&255,(addr>>>8)&255,bank,0xEA])}
function studioPlus4MiBLoaderBytes(pointerDp,bankDp,helperPc,patched){const head=[0xBF,0xD0,0xFD,0x8B,0x85,pointerDp];return new Uint8Array(patched?[...head,...studioPlus4MiBJsl(helperPc)]:[...head,0xA9,0x8B,0x00,0x85,bankDp])}
function studioPlus4MiBHelperBytes(bankDp){return new Uint8Array([0xBF,0x00,0x81,0xC0,0x85,bankDp,0x6B])}
function studioCaptureNativePlusTacticsBaseline(forcePlus=false){
 if(!forcePlus&&activeRomProfile?.id!=='iss-deluxe-plus')return false;
 if(!(rom instanceof Uint8Array))return false;
 if(window.__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__?.teams)return true;
 const hs=(rom.length%0x8000===0x200)?0x200:0,body=rom.length-hs;if(body!==0x200000)return false;
 const teams={};
 for(let team=0;team<56;team++){
  let rec=null;try{rec=plusTacticalRecordForTeam(team)}catch(_){}
  if(!rec?.raw||Number(rec.raw.length)!==31)continue;
  teams[String(team)]={teamId:team,recordPc:Number(rec.recordPc),raw:Array.from(rec.raw,Number)};
 }
 if(Object.keys(teams).length!==56)throw new Error('Não foi possível capturar as 56 táticas nativas antes da expansão obrigatória.');
 window.__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__={schema:'isssd-plus-native-tactics-baseline-v1',teams};
 return true;
}
function studioEnsureMandatoryPlus4MiBSync(forcePlus=false){
 if(!forcePlus&&activeRomProfile?.id!=='iss-deluxe-plus')return false;
 if(!(rom instanceof Uint8Array))throw new Error('ROM Plus indisponível para expansão obrigatória.');
 let hs=(rom.length%0x8000===0x200)?0x200:0,body=rom.length-hs;
 if(body===0x400000){window.__ISSSD_PLUS_4MB_MANDATORY__=true;return true}
 if(body!==0x200000)throw new Error('ROM Plus com tamanho incompatível antes da expansão obrigatória: '+body+' bytes.');
 studioCaptureNativePlusTacticsBaseline(true);
 const src=rom;
 const out=new Uint8Array(hs+0x400000);out.fill(0xFF);
 if(hs){out.set(src.slice(0,hs),0);out.set(src.slice(hs),hs)}else out.set(src);
 const pc=x=>x+hs;
 out.set(studioPlus4MiBAscii('ISSSD-PLUS-4M-ONLY'),pc(0x20A000));
 out[pc(0x7FD7)]=0x0C;
 const pointerTable=pc(0x05FDD0),selectorMarker=pc(0x200040),selectorTable=pc(0x200100);
 const groups=new Map();
 for(let entry=0;entry<57;entry++){
  const off=pointerTable+entry*2,ptr=out[off]|(out[off+1]<<8);
  if(ptr<0x8000)throw new Error('Ponteiro tático inválido durante expansão obrigatória: equipe '+entry);
  if(!groups.has(ptr))groups.set(ptr,[]);groups.get(ptr).push(entry);
 }
 const bankWords=new Uint8Array(57*2);for(let i=0;i<57;i++)bankWords[i*2]=0x8B;
 const alternate=[0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7];
 for(const [ptr,entries] of groups){
  if(entries.length<=1)continue;
  for(let rank=1;rank<entries.length;rank++){
   if(rank-1>=alternate.length)throw new Error('Muitas equipes compartilham o ponteiro tático 0x'+ptr.toString(16));
   const entry=entries[rank],bank=alternate[rank-1];
   const srcBase=studioPlus4MiBLoRomPc(0x8B,ptr),dstBase=studioPlus4MiBLoRomPc(bank,ptr);
   if(srcBase==null||dstBase==null)throw new Error('Endereço LoROM tático inválido durante expansão obrigatória.');
   const srcPc=pc(srcBase),dstPc=pc(dstBase);
   if(srcPc+31>out.length||dstPc+31>out.length)throw new Error('Clone tático fora da ROM durante expansão obrigatória.');
   const raw=out.slice(srcPc,srcPc+31);let blank=true,same=true;
   for(let j=0;j<31;j++){if(out[dstPc+j]!==0xFF)blank=false;if(out[dstPc+j]!==raw[j])same=false}
   if(!blank&&!same)throw new Error('Destino de clone tático ocupado em 0x'+dstPc.toString(16));
   if(!same)out.set(raw,dstPc);bankWords[entry*2]=bank;
  }
 }
 out.set(studioPlus4MiBAscii('ISSDTACTBANKV1'),selectorMarker);out.set(bankWords,selectorTable);
 const loaders=[
  {pc:0x02AA88,pointerDp:0x02,bankDp:0x04,helperPc:0x200200},
  {pc:0x02B160,pointerDp:0xC2,bankDp:0xC4,helperPc:0x200210},
  {pc:0x031934,pointerDp:0xC0,bankDp:0xC2,helperPc:0x200220}
 ];
 for(const e of loaders){
  const at=pc(e.pc),orig=studioPlus4MiBLoaderBytes(e.pointerDp,e.bankDp,e.helperPc,false),patched=studioPlus4MiBLoaderBytes(e.pointerDp,e.bankDp,e.helperPc,true);
  const isOrig=studioPlus4MiBBytesEqual(out,at,orig),isPatched=studioPlus4MiBBytesEqual(out,at,patched);
  if(!isOrig&&!isPatched)throw new Error('Loader tático incompatível antes da expansão em 0x'+e.pc.toString(16));
  const helperAt=pc(e.helperPc),helper=studioPlus4MiBHelperBytes(e.bankDp);let blank=true,same=true;
  for(let i=0;i<helper.length;i++){if(out[helperAt+i]!==0xFF)blank=false;if(out[helperAt+i]!==helper[i])same=false}
  if(!blank&&!same)throw new Error('Área do helper tático ocupada em 0x'+e.helperPc.toString(16));
  if(!same)out.set(helper,helperAt);if(isOrig)out.set(studioPlus4MiBJsl(e.helperPc),at+6);
 }
 rom=out;
 hs=(rom.length%0x8000===0x200)?0x200:0;body=rom.length-hs;
 if(body!==0x400000)throw new Error('Falha interna: buffer global não ficou com 4 MiB; obtido '+body+' bytes.');
 window.__ISSSD_PLUS_4MB_MANDATORY__=true;
 return true;
}
async function studioEnsureMandatoryPlus4MiB(forcePlus=false){return studioEnsureMandatoryPlus4MiBSync(forcePlus)}
`;

if(!html.includes('function studioEnsureMandatoryPlus4MiBSync('))html=html.replace(applyNeedle,helper+'\n'+applyNeedle);

// Barreira definitiva: nenhuma restauração de teamsV1 pode sequer iniciar sobre 2 MiB.
const restoreNeedle='function studioRestoreTeamsV1(state){';
if(!html.includes(restoreNeedle))throw new Error('4 MiB obrigatório: studioRestoreTeamsV1 não encontrado.');
const restoreGuard='\n studioEnsureMandatoryPlus4MiBSync(true);';
if(!html.includes(restoreNeedle+restoreGuard))html=html.replace(restoreNeedle,restoreNeedle+restoreGuard);

// Preparação antecipada redundante após o rebuild físico.
const applyRx=/(studioCore\(\)\.applyProject\(cleanBase,rebuilt,[\s\S]*?\);)/;
const m=html.match(applyRx);
if(!m)throw new Error('4 MiB obrigatório: chamada studioCore().applyProject(...) não encontrada.');
const structuralGuard="\n await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');";
if(!html.includes(m[1]+structuralGuard))html=html.replace(m[1],m[1]+structuralGuard);

// O baseline canônico usa studioDoSave(options={}); aceitar parâmetros evita acoplamento à assinatura histórica vazia.
const saveMatch=html.match(/async function studioDoSave\([^)]*\)\s*\{/);
if(!saveMatch)throw new Error('4 MiB obrigatório: studioDoSave não encontrado.');
const saveNeedle=saveMatch[0];
const saveGuard='\n await studioEnsureMandatoryPlus4MiB(false);';
if(!html.includes(saveNeedle+saveGuard))html=html.replace(saveNeedle,saveNeedle+saveGuard);

if(html.includes('await studioAutoPreparePlusTactics();'))throw new Error('4 MiB obrigatório: dependência executável do preparador legado ainda presente.');
if(!html.includes("rom=out;"))throw new Error('4 MiB obrigatório: expansão não substitui o buffer global rom.');
if(!html.includes(restoreNeedle+restoreGuard))throw new Error('4 MiB obrigatório: barreira síncrona não está no início de studioRestoreTeamsV1.');
if(!html.includes("ISSDTACTBANKV1"))throw new Error('4 MiB obrigatório: seletor de bancos táticos ausente.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: expansão Plus 4 MiB é síncrona, canônica e independente do preparador legado.');
console.log('ISSSD Studio: studioRestoreTeamsV1 possui barreira própria e não pode iniciar sobre uma ROM de 2 MiB.');
