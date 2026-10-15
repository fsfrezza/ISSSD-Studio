import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Verificação final: editor gerado não encontrado: '+htmlPath);
const html=fs.readFileSync(htmlPath,'utf8');

const restoreNeedle='function studioRestoreTeamsV1(state){';
const restoreStart=html.indexOf(restoreNeedle);
if(restoreStart<0)throw new Error('Verificação final: studioRestoreTeamsV1 não encontrado.');
const restoreHead=html.slice(restoreStart,restoreStart+300);
if(!restoreHead.includes('if(window.__ISSSD_SEMANTIC_OPEN_ONLY__)return false;'))throw new Error('Verificação final: teamsV1 ainda pode escrever durante a abertura semântica.');
if(!restoreHead.includes('studioEnsureMandatoryPlus4MiBSync(true);'))throw new Error('Verificação final: studioRestoreTeamsV1 pode iniciar sem a barreira síncrona obrigatória de 4 MiB fora da abertura.');

const syncStart=html.indexOf('function studioEnsureMandatoryPlus4MiBSync(forcePlus=false){');
if(syncStart<0)throw new Error('Verificação final: preparador síncrono 4 MiB ausente.');
const syncEnd=html.indexOf('async function studioEnsureMandatoryPlus4MiB(',syncStart);
if(syncEnd<0)throw new Error('Verificação final: fim do preparador síncrono não encontrado.');
const syncBlock=html.slice(syncStart,syncEnd);
for(const required of ['new Uint8Array(hs+0x400000)','rom=out;','ISSSD-PLUS-4M-ONLY','ISSDTACTBANKV1','0x200100','0x200200','0x200210','0x200220']){
 if(!syncBlock.includes(required))throw new Error('Verificação final: preparação 4 MiB incompleta; ausente '+required+'.');
}
if(syncBlock.includes('studioAutoPreparePlusTactics'))throw new Error('Verificação final: preparação 4 MiB ainda depende do preparador legado.');

const reqStart=html.indexOf('function studioTeamsV3RequireExclusive4MiBTactic(team){');
const reqEnd=html.indexOf('function studioTeamsV3RestoreTactics(state){',reqStart);
if(reqStart<0||reqEnd<0)throw new Error('Verificação final: guard tático 4 MiB não encontrado.');
const reqBlock=html.slice(reqStart,reqEnd);
if(!reqBlock.includes('body!==0x400000'))throw new Error('Verificação final: restore tático não exige 4 MiB.');

if(!html.includes('roundTripSaveSanitized'))throw new Error('Verificação final: proteção de salvamento do round-trip ausente.');
if(html.includes("roundTrip:'semantic-first-v3'"))throw new Error('Verificação final: saneamento físico legado voltou à abertura do projeto.');
if(!html.includes('0x2AA8E,0x2B166,0x3193A'))throw new Error('Verificação final: saneamento dos loaders derivados não está presente no salvamento.');

if(!html.includes('/* isssd-team-semantic-overlay-v1 */'))throw new Error('Verificação final: overlay semântico de equipes não foi instalado.');
const overlayAt=html.indexOf('/* isssd-team-semantic-overlay-v1 */');
const bootAt=html.indexOf('<script id="isssd-team-semantic-bootstrap-v1">');
const canonicalAt=html.indexOf('function studioTeamsV3ReadFull(){');
if(bootAt<canonicalAt||canonicalAt<0||bootAt<html.indexOf('</script>',overlayAt))throw new Error('Verificação final: bootstrap semântico executa antes do runtime canônico.');
if(!html.includes('window.__ISSSD_INSTALL_TEAMS_SEMANTIC_V1__=function(){'))throw new Error('Verificação final: instalador semântico diferido ausente.');

const scriptStart=html.lastIndexOf('<script',overlayAt),scriptEnd=html.indexOf('</script>',overlayAt);
const scopedBlock=html.slice(scriptStart,scriptEnd);
for(const needle of ['teams=[]','function refreshPlusTeamFromRom(team){','function ensureCurrentTeamFresh(){','window.plusTacticalRecordForTeam=(...args)=>plusTacticalRecordForTeam(...args)']){
 if(!scopedBlock.includes(needle))throw new Error('Verificação final: overlay fora do escopo lexical do modelo: '+needle);
}
for(const required of ['__ISSSD_TEAMS_PROJECT_OVERLAY_V1__','__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__','__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__','__ISSSD_PROJECT_TEAMS_HYDRATED_V1__']){
 if(!html.includes(required))throw new Error('Verificação final: overlay teamsV1 incompleto; ausente '+required+'.');
}

if(!html.includes('id="isssd-project-open-semantic-only-v4"'))throw new Error('Verificação final: barreira v4 de abertura semântica não foi instalada.');
for(const required of [
 'window.__ISSSD_SEMANTIC_OPEN_ONLY__=true',
 'if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__){studioCore().applyProject',
 'studioCore().applyProject(cleanBase,cleanBase,baseName,d?.state?.ui||{},d?.base?.profile||null)',
 "if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__)await studioEnsureMandatoryPlus4MiB",
 "if(!window.__ISSSD_SEMANTIC_OPEN_ONLY__)window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(d)",
 'rom=new Uint8Array(baseBytes)',
 'window.__ISSSD_PROJECT_OPEN_ROM_PRISTINE__=true'
])if(!html.includes(required))throw new Error('Verificação final: abertura semântica incompleta; ausente '+required+'.');
if(html.includes('legacyApply(d,new Uint8Array(baseBytes),baseName)'))throw new Error('Verificação final: abertura ainda cria uma ROM temporária para o importador legado.');

const reapplyProjectP=/window\s*\.\s*__ISSSD_GIT_REAPPLY_PROJECT_STATE__\s*\?\.\s*\(\s*p\s*\)/;
if(reapplyProjectP.test(html))throw new Error('Verificação final: hidratação pós-abertura ainda reaplica projeto diretamente na ROM.');
if(!/hydrateDom\s*\(\s*p\s*\)/.test(html))throw new Error('Verificação final: hidratação semântica da interface não está conectada após abrir projeto.');

if(!html.includes("fetch('/__isssd/build-plus-project'"))throw new Error('Verificação final: Build Pipeline v1 não está conectado à exportação Plus.');
if(!html.includes('await studioProjectObject()'))throw new Error('Verificação final: exportação Plus não envia o projeto atual ao pipeline.');
if(!html.includes("response.headers.get('X-ISSSD-Builder')!=='plus-build-pipeline-v1'"))throw new Error('Verificação final: browser não exige confirmação do Build Pipeline v1.');
if(!html.includes("response.headers.get('X-ISSSD-Archive')!=='cumulative-v1'"))throw new Error('Verificação final: exportação não exige ZIP cumulativo.');


// Presence checks cannot detect an invalid legacy script that silently never executes.
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const attrs=match[1];if(/type=["'](?:application\/json|importmap)["']/i.test(attrs))continue;
 if(/type=["']module["']/i.test(attrs)){
  const checked=spawnSync(process.execPath,['--check','--input-type=module'],{input:match[2],encoding:'utf8'});
  if(checked.status!==0)throw new Error('Verificação final: módulo inválido em '+attrs+': '+checked.stderr);
  continue;
 }
 try{new vm.Script(match[2])}catch(e){throw new Error('Verificação final: JavaScript inválido em '+(attrs||'script sem id')+': '+e.message)}
}

console.log('ISSSD Studio: invariantes finais verificadas — abrir projeto carrega formalmente a ROM-base no core, hidrata teamsV1/textos sem materializar overrides, o round-trip saneia somente o salvamento e a ROM final Plus nasce somente do Build Pipeline v1.');
