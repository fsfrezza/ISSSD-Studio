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
 if(body!==0x400000)throw new Error('Toda ROM Plus do Studio deve ter exatamente 4 MiB no buffer global; tamanho atual: '+body+' bytes.');
 window.__ISSSD_PLUS_4MB_MANDATORY__=true;
 return true;
}
`;

if(!html.includes('function studioCaptureNativePlusTacticsBaseline('))html=html.replace(applyNeedle,helper+'\n'+applyNeedle);

// Durante a abertura do projeto o activeRomProfile ainda pode não estar definido.
// O próprio documento informa o perfil; portanto forcePlus é derivado de d.base.profile.
// Isso impede que a preparação obrigatória seja pulada exatamente na primeira abertura.
const applyRx=/(studioCore\(\)\.applyProject\(cleanBase,rebuilt,[\s\S]*?\);)/;
const m=html.match(applyRx);
if(!m)throw new Error('4 MiB obrigatório: chamada studioCore().applyProject(...) não encontrada.');
const openGuard="\n await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');";
if(!html.includes(m[1]+openGuard))html=html.replace(m[1],m[1]+openGuard);

// Qualquer exportação de ROM Plus também passa pela garantia de 4 MiB.
const saveCandidates=['async function studioDoSave(){','async function studioDoSave() {'];
let saveNeedle=saveCandidates.find(x=>html.includes(x));
if(!saveNeedle)throw new Error('4 MiB obrigatório: studioDoSave não encontrado.');
const saveGuard='\n await studioEnsureMandatoryPlus4MiB(false);';
if(!html.includes(saveNeedle+saveGuard))html=html.replace(saveNeedle,saveNeedle+saveGuard);

if(!html.includes("body!==0x400000"))throw new Error('4 MiB obrigatório: validação de tamanho ausente.');
if(!html.includes("studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus')"))throw new Error('4 MiB obrigatório: abertura não força Plus pelo perfil do documento.');
if(!html.includes('studioCaptureNativePlusTacticsBaseline(forcePlus);'))throw new Error('4 MiB obrigatório: baseline tática nativa não respeita forcePlus.');
if(!html.includes('await studioAutoPreparePlusTactics();'))throw new Error('4 MiB obrigatório: expansão não está ligada ao buffer global rom.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: expansão Plus para 4 MiB é obrigatória no buffer global; abertura força a preparação pelo perfil do projeto mesmo antes de activeRomProfile existir.');
console.log('ISSSD Studio: táticas nativas são capturadas antes da expansão; o mesmo buffer rom consumido pelos writers é expandido e preparado.');
