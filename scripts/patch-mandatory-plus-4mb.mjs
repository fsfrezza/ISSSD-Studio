import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('4 MiB obrigatório: editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const applyNeedle='async function studioApplyProjectWithBase(d,baseBytes,baseName){';
if(!html.includes(applyNeedle))throw new Error('4 MiB obrigatório: studioApplyProjectWithBase não encontrado.');

const helper=String.raw`async function studioEnsureMandatoryPlus4MiB(){
 if(activeRomProfile?.id!=='iss-deluxe-plus')return false;
 const c=studioCore?.();if(!c)throw new Error('Núcleo Plus indisponível para expansão obrigatória.');
 let s=c.plusExpansionOnlyStatus?.()||{},body=Number(s.bodyLength)||0;
 if(body===0x200000){
  const r=c.apply4MiBExpansionOnly?.();
  if(!r?.ok)throw new Error(r?.error||'Falha ao expandir a ROM Plus para 4 MiB.');
  s=c.plusExpansionOnlyStatus?.()||{};body=Number(s.bodyLength)||Number(r.bodyLength)||0;
 }
 if(body!==0x400000)throw new Error('Toda ROM Plus do Studio deve ter exatamente 4 MiB; tamanho atual: '+body+' bytes.');
 if(!c.tacticsIndividualized?.()){
  const r=await c.individualizeAllTactics?.();
  if(!r?.ok)throw new Error(r?.error||r?.reason||'Falha ao individualizar as táticas na ROM Plus de 4 MiB.');
 }
 if(!c.tacticsIndividualized?.())throw new Error('A expansão de 4 MiB foi feita, mas as táticas não ficaram individualizadas.');
 window.__ISSSD_PLUS_4MB_MANDATORY__=true;
 return true;
}
`;

if(!html.includes('function studioEnsureMandatoryPlus4MiB()'))html=html.replace(applyNeedle,helper+'\n'+applyNeedle);

// Primeiro passo depois de carregar a ROM-base no runtime: expandir e individualizar,
// antes de qualquer estado semântico do projeto ser restaurado.
const applyRx=/(studioCore\(\)\.applyProject\(cleanBase,rebuilt,[\s\S]*?\);)/;
const m=html.match(applyRx);
if(!m)throw new Error('4 MiB obrigatório: chamada studioCore().applyProject(...) não encontrada.');
if(!html.includes(m[1]+'\n await studioEnsureMandatoryPlus4MiB();'))html=html.replace(m[1],m[1]+'\n await studioEnsureMandatoryPlus4MiB();');

// Qualquer exportação de ROM Plus também passa pela garantia de 4 MiB. Isso cobre
// sessões iniciadas por ROM, mesmo sem abrir um projeto antes.
const saveCandidates=['async function studioDoSave(){','async function studioDoSave() {'];
let saveNeedle=saveCandidates.find(x=>html.includes(x));
if(!saveNeedle)throw new Error('4 MiB obrigatório: studioDoSave não encontrado.');
const saveGuard='\n await studioEnsureMandatoryPlus4MiB();';
if(!html.includes(saveNeedle+saveGuard))html=html.replace(saveNeedle,saveNeedle+saveGuard);

if(!html.includes("body!==0x400000"))throw new Error('4 MiB obrigatório: validação de tamanho ausente.');
if(!html.includes('await studioEnsureMandatoryPlus4MiB();'))throw new Error('4 MiB obrigatório: chamada obrigatória não instalada.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: expansão Plus para 4 MiB é obrigatória e automática; ocorre antes da restauração do projeto e antes de toda exportação de ROM.');
console.log('ISSSD Studio: banco tático é individualizado integralmente na preparação de 4 MiB; o usuário não escolhe essa etapa.');
