import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Verificação final: editor gerado não encontrado: '+htmlPath);
const html=fs.readFileSync(htmlPath,'utf8');

const restoreNeedle='function studioRestoreTeamsV1(state){';
const restoreStart=html.indexOf(restoreNeedle);
if(restoreStart<0)throw new Error('Verificação final: studioRestoreTeamsV1 não encontrado.');
const restoreHead=html.slice(restoreStart,restoreStart+220);
if(!restoreHead.includes('studioEnsureMandatoryPlus4MiBSync(true);')){
  throw new Error('Verificação final: studioRestoreTeamsV1 pode iniciar sem a barreira síncrona obrigatória de 4 MiB.');
}

const syncStart=html.indexOf('function studioEnsureMandatoryPlus4MiBSync(forcePlus=false){');
if(syncStart<0)throw new Error('Verificação final: preparador síncrono 4 MiB ausente.');
const syncEnd=html.indexOf('async function studioEnsureMandatoryPlus4MiB(',syncStart);
if(syncEnd<0)throw new Error('Verificação final: fim do preparador síncrono não encontrado.');
const syncBlock=html.slice(syncStart,syncEnd);
for(const required of [
  'new Uint8Array(hs+0x400000)',
  'rom=out;',
  'ISSSD-PLUS-4M-ONLY',
  'ISSDTACTBANKV1',
  '0x200100',
  '0x200200',
  '0x200210',
  '0x200220'
])if(!syncBlock.includes(required))throw new Error('Verificação final: preparação 4 MiB incompleta; ausente '+required+'.');
if(syncBlock.includes('studioAutoPreparePlusTactics'))throw new Error('Verificação final: preparação 4 MiB ainda depende do preparador legado.');

const reqStart=html.indexOf('function studioTeamsV3RequireExclusive4MiBTactic(team){');
const reqEnd=html.indexOf('function studioTeamsV3RestoreTactics(state){',reqStart);
if(reqStart<0||reqEnd<0)throw new Error('Verificação final: guard tático 4 MiB não encontrado.');
const reqBlock=html.slice(reqStart,reqEnd);
if(!reqBlock.includes('body!==0x400000'))throw new Error('Verificação final: restore tático não exige 4 MiB.');

// Os três JSLs em C0 são infraestrutura derivada válida SOMENTE dentro do preparador
// obrigatório de 4 MiB. Eles não podem reaparecer como patches persistidos do projeto.
if(!html.includes("roundTrip:'semantic-first-v3'"))throw new Error('Verificação final: proteção de round-trip ausente.');
if(!html.includes('0x2AA8E,0x2B166,0x3193A'))throw new Error('Verificação final: saneamento dos loaders derivados não está presente no round-trip.');

if(!html.includes("fetch('/__isssd/finalize-plus-rom'"))throw new Error('Verificação final: finalizador canônico de ROM ausente.');

console.log('ISSSD Studio: invariantes finais verificados — teamsV1 autodefende 4 MiB de forma síncrona, preparação não depende do runtime legado, round-trip e finalizador canônico presentes.');
