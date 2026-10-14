import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('4 MiB obrigatório: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
if(!html.includes(applyNeedle))throw new Error('4 MiB obrigatório: studioApplyProjectWithBase não encontrado.');

const helper=String.raw`function studioCaptureNativePlusTacticsBaseline(forcePlus=false){
 if((!forcePlus&&activeRomProfile?.id!=='iss-deluxe-plus')||!rom)return false;
 if(window.__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__?.teams)return true;
 const hs=(rom.length%0x8000===0x200)?0x200:0,body=rom.length-hs;if(body!==0x200000)return false;
 const teams={};
 for(let team=0;team<56;team++){
  let rec=null;try{rec=plusTacticalRecordForTeam(team)}catch(_){}
  if(!rec||!Array.isArray(rec.raw)||rec.raw.length!==31)continue;
  teams[String(team)]={teamId:team,recordPc:Number(rec.recordPc),raw:Array.from(rec.raw,Number)};
 }
 if(Object.keys(teams).length!==56)throw new Error('Não foi possível capturar as 56 táticas nativas antes da expansão obrigatória.');
 window.__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__={schema:'isssd-plus-native-tactics-baseline-v1',teams};
 return true;
}
async function studioEnsureMandatoryPlus4MiB(forcePlus=false){
 if(!forcePlus&&activeRomProfile?.id!=='iss-deluxe-plus')return false;
 if(!(rom instanceof Uint8Array))throw new Error('ROM Plus indisponível para expansão obrigatória.');
 let hs=(rom.length%0x8000===0x200)?0x200:0,body=rom.length-hs;
 if(body===0x200000){
  studioCaptureNativePlusTacticsBaseline(forcePlus);
  if(typeof studioAutoPreparePlusTactics!=='function')throw new Error('Preparador tático Plus indisponível para expansão obrigatória de 4 MiB.');
  await studioAutoPreparePlusTactics();
  if(!(rom instanceof Uint8Array))throw new Error('Preparador Plus invalidou o buffer global da ROM.');
  hs=(rom.length%0x8000===0x200)?0x200:0;body=rom.length-hs;
 }
 if(body!==0x400000)throw new Error('Toda ROM Plus do Studio deve ter exatamente 4 MiB no buffer global ANTES de restaurar equipes; tamanho atual: '+body+' bytes.');
 window.__ISSSD_PLUS_4MB_MANDATORY__=true;
 return true;
}
`;

if(!html.includes('function studioCaptureNativePlusTacticsBaseline('))html=html.replace(applyNeedle,helper+'\n'+applyNeedle);

// O erro recorrente mostrou que preparar depois de studioCore().applyProject não garante
// ordem suficiente: há um restore legado de teamsV1 antes desse ponto em algumas baselines.
// Portanto delimitamos studioApplyProjectWithBase e instalamos a garantia imediatamente
// antes da ÚLTIMA chamada direta de studioRestoreTeamsV1 dentro da função principal.
// A primeira ocorrência textual pode estar dentro da definição aninhada do Git Bridge.
const applyStart=html.indexOf(applyNeedle);
const applyEnd=html.indexOf('function studioProjectChangeHasValues(',applyStart);
if(applyStart<0||applyEnd<0)throw new Error('4 MiB obrigatório: não foi possível delimitar studioApplyProjectWithBase.');
let applyBlock=html.slice(applyStart,applyEnd);
const restoreToken='studioRestoreTeamsV1(';
const lastRestore=applyBlock.lastIndexOf(restoreToken);
if(lastRestore<0)throw new Error('4 MiB obrigatório: restore de teamsV1 não encontrado dentro da abertura do projeto.');
const directGuard="await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');\n  ";
if(!applyBlock.slice(Math.max(0,lastRestore-220),lastRestore).includes('studioEnsureMandatoryPlus4MiB')){
 applyBlock=applyBlock.slice(0,lastRestore)+directGuard+applyBlock.slice(lastRestore);
 html=html.slice(0,applyStart)+applyBlock+html.slice(applyEnd);
}

// Mantemos ainda uma segunda barreira após applyProject para cobrir baselines cujo fluxo
// estrutural passa por esse ponto. Ela é redundante por projeto: a função é idempotente.
const applyRx=/(studioCore\(\)\.applyProject\(cleanBase,rebuilt,[\s\S]*?\);)/;
const m=html.match(applyRx);
if(!m)throw new Error('4 MiB obrigatório: chamada studioCore().applyProject(...) não encontrada.');
const structuralGuard="\n await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');";
if(!html.includes(m[1]+structuralGuard))html=html.replace(m[1],m[1]+structuralGuard);

// Qualquer exportação de ROM Plus também passa pela garantia de 4 MiB.
const saveCandidates=['async function studioDoSave(){','async function studioDoSave() {'];
let saveNeedle=saveCandidates.find(x=>html.includes(x));
if(!saveNeedle)throw new Error('4 MiB obrigatório: studioDoSave não encontrado.');
const saveGuard='\n await studioEnsureMandatoryPlus4MiB(false);';
if(!html.includes(saveNeedle+saveGuard))html=html.replace(saveNeedle,saveNeedle+saveGuard);

// Auditoria do HTML FINAL: dentro da função de abertura, a última restauração direta
// de teamsV1 obrigatoriamente deve vir DEPOIS de uma chamada await da garantia 4 MiB.
const finalStart=html.indexOf(applyNeedle),finalEnd=html.indexOf('function studioProjectChangeHasValues(',finalStart);
const finalBlock=html.slice(finalStart,finalEnd),finalRestore=finalBlock.lastIndexOf(restoreToken);
const finalGuard=finalBlock.lastIndexOf("await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');",finalRestore);
if(finalRestore<0||finalGuard<0||finalGuard>finalRestore)throw new Error('4 MiB obrigatório: ordem final inválida; teamsV1 pode ser restaurado antes da expansão.');
if(finalRestore-finalGuard>260)throw new Error('4 MiB obrigatório: garantia 4 MiB ficou distante demais do restore direto de teamsV1.');
if(!html.includes("body!==0x400000"))throw new Error('4 MiB obrigatório: validação de tamanho ausente.');
if(!html.includes('studioCaptureNativePlusTacticsBaseline(forcePlus);'))throw new Error('4 MiB obrigatório: baseline tática nativa não respeita forcePlus.');
if(!html.includes('await studioAutoPreparePlusTactics();'))throw new Error('4 MiB obrigatório: preparador Plus não está ligado ao guard.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: 4 MiB agora é verificado imediatamente antes do restore direto de teamsV1 e novamente após applyProject/export.');
console.log('ISSSD Studio: o build falha se qualquer restore direto de equipes puder ocorrer antes da barreira obrigatória de 4 MiB.');
