import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Verificação final: editor gerado não encontrado: '+htmlPath);
const html=fs.readFileSync(htmlPath,'utf8');

const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
const applyStart=html.indexOf(applyNeedle);
const applyEnd=html.indexOf('function studioProjectChangeHasValues(',applyStart);
if(applyStart<0||applyEnd<0)throw new Error('Verificação final: não foi possível delimitar studioApplyProjectWithBase.');
const applyBlock=html.slice(applyStart,applyEnd);
const restoreToken='studioRestoreTeamsV1(';
const restore=applyBlock.lastIndexOf(restoreToken);
const guardToken="await studioEnsureMandatoryPlus4MiB(d?.base?.profile==='iss-deluxe-plus');";
const guard=applyBlock.lastIndexOf(guardToken,restore);
if(restore<0)throw new Error('Verificação final: restore direto de teamsV1 não encontrado.');
if(guard<0||guard>restore)throw new Error('Verificação final: teamsV1 pode ser restaurado antes da garantia obrigatória de 4 MiB.');
if(restore-guard>260)throw new Error('Verificação final: a garantia de 4 MiB não está imediatamente antes do restore direto de teamsV1.');

const reqStart=html.indexOf('function studioTeamsV3RequireExclusive4MiBTactic(team){');
const reqEnd=html.indexOf('function studioTeamsV3RestoreTactics(state){',reqStart);
if(reqStart<0||reqEnd<0)throw new Error('Verificação final: guard tático 4 MiB não encontrado.');
const reqBlock=html.slice(reqStart,reqEnd);
if(!reqBlock.includes('body!==0x400000'))throw new Error('Verificação final: restore tático não exige 4 MiB.');

for(const off of ['0x2AA8E','0x2B166','0x3193A']){
  const legacyPattern=new RegExp(`${off}[^\n]{0,120}(?:22\\s*00\\s*82\\s*C0|22\\s*10\\s*82\\s*C0|22\\s*20\\s*82\\s*C0)`,'i');
  if(legacyPattern.test(html))throw new Error('Verificação final: loader C0 legado reapareceu em '+off+'.');
}

if(!html.includes("fetch('/__isssd/finalize-plus-rom'"))throw new Error('Verificação final: finalizador canônico de ROM ausente.');
if(!html.includes("roundTrip:'semantic-first-v3'"))throw new Error('Verificação final: proteção de round-trip ausente.');

console.log('ISSSD Studio: invariantes finais verificados — 4 MiB antes de teamsV1, restore tático 4 MiB, round-trip e finalizador canônico presentes.');
