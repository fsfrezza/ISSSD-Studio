import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const MARKER='isssd-player-skill-restore-v2';
html=html.replace(/<div[^>]*id=["']isssd-player-skill-restore-v[12]["'][^>]*>[\s\S]*?<\/div>\s*/g,block=>block.match(/<button\b(?=[^>]*\bid=["']restorePlayerBtn["'])[^>]*>[\s\S]*?<\/button>/i)?.[0]||'');
html=html.replace(/<style\b[^>]*id=["']isssd-player-actions-layout["'][^>]*>[\s\S]*?<\/style>/g,'');

// Localiza o controle pelo ID estável; não depende do texto, indentação ou CRLF do HTML legado.
const restoreButtonRe=/<button\b(?=[^>]*\bid=["']restorePlayerBtn["'])[^>]*>[\s\S]*?<\/button>/i;
const restoreMatch=html.match(restoreButtonRe);
if(!restoreMatch)throw new Error('Não encontrei o controle #restorePlayerBtn no HTML final para posicionar os botões de skills.');
const newActions=`<div id="${MARKER}" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">\n<button class="btn" id="restoreSkillsProjectBtn" type="button">Restaurar skills do projeto</button>\n<button class="btn" id="restoreSkillsOriginalBtn" type="button">Restaurar skills originais</button>\n${restoreMatch[0].replace(/>\s*[\s\S]*?\s*<\/button>$/i,'>Restaurar jogador original</button>')}\n</div>`;
html=html.replace(restoreButtonRe,newActions);
html=html.replace('</head>',`<style id="isssd-player-actions-layout">
#${MARKER}{width:100%;margin:0!important;justify-content:flex-start}
#${MARKER} .btn{flex:0 0 auto;white-space:nowrap;font-size:13px;padding:8px 10px}
</style></head>`);

const hook='$("restorePlayerBtn").onclick=restorePlayer;';
if(!html.includes(hook))throw new Error('Não encontrei o binding estável #restorePlayerBtn no runtime final.');

const runtime=String.raw`
// Keep the four player actions together across the full width of their grid.
(function(){
 const row=document.getElementById('isssd-player-skill-restore-v2');
 if(!row)return;
 const appearance=Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Editar aparência');
 if(appearance){
  const old=appearance.parentElement;row.prepend(appearance);
  if(old!==row.parentElement&&!old.querySelector('button,input,select,textarea')&&/^Aparência\s*cabelo\s*\+\s*paleta$/i.test(old.textContent.trim()))old.hidden=true;
 }
 row.parentElement.style.gridColumn='1 / -1';
})();
// ISSSD_PLAYER_SKILL_RESTORE_RUNTIME_V2
function studioSparsePlayerEntry(state,team,player){
 const ts=state?.teams?.[String(team)];
 if(!ts||!Array.isArray(ts.players))return null;
 return ts.players.find(p=>Number(p?.slot)===Number(player)+1)||ts.players[Number(player)]||null;
}
function studioSparseSkillTarget(mode){
 const base=studioTeamsV3BaselinePlayer(currentTeam,currentPlayer);
 if(!base?.skills)throw new Error('Baseline original do jogador não está disponível. Reabra o projeto para recapturar a ROM-base.');
 const target={...base.skills};
 if(mode==='project'){
  const saved=studioSparsePlayerEntry(window.__ISSSD_TEAMS_V1__,currentTeam,currentPlayer);
  const custom=saved?.custom?.skills;
  if(custom&&typeof custom==='object')for(const k of Object.keys(target))if(Object.prototype.hasOwnProperty.call(custom,k))target[k]=custom[k];
 }
 return target;
}
function studioEncodeSkillsPreservingOtherFields(target){
 const off=studioTeamsV3AttrOffset(currentTeam,currentPlayer);
 const bytes=new Uint8Array(rom.slice(off,off+7));
 const map={acceleration:[0,4],speed:[0,0],shot:[1,4],curve:[1,0],balance:[2,4],intelligence:[2,0],dribbling:[3,4],jump:[3,0],energy:[4,0]};
 for(const [key,[rel,shift]] of Object.entries(map)){
  const native=studioTeamsV3Clamp(target[key],1,10,1)-1;
  bytes[rel]=shift===4?((bytes[rel]&0x0F)|((native&0x0F)<<4)):((bytes[rel]&0xF0)|(native&0x0F));
 }
 return bytes;
}
function studioRestoreSkills(mode){
 if(activeRomProfile?.id!=='iss-deluxe-plus'){alert('Esta restauração seletiva está habilitada no momento para o perfil Deluxe Plus.');return false}
 try{
  const target=studioSparseSkillTarget(mode),bytes=studioEncodeSkillsPreservingOtherFields(target),writes=[];
  for(const off of studioTeamsV3AttrOffsets(currentTeam,currentPlayer))writes.push({off,bytes:new Uint8Array(bytes)});
  const p=teams[currentTeam]?.players?.[currentPlayer];
  const label=mode==='project'?'Restaurar skills do projeto':'Restaurar skills originais';
  const ok=recordAction(label+': '+(p?.name||('slot '+(currentPlayer+1))),'Jogadores',writes);
  if(ok){syncModelsFromRom();renderEverything()}
  return !!ok;
 }catch(e){console.error('ISSSD Studio: restauração seletiva de skills',e);alert('Falha ao restaurar skills: '+(e?.message||e));return false}
}
`;
html=html.replace(hook,runtime+'\n'+hook+'\n$("restoreSkillsProjectBtn").onclick=()=>studioRestoreSkills("project");\n$("restoreSkillsOriginalBtn").onclick=()=>studioRestoreSkills("original");');

if(!html.includes('id="restoreSkillsProjectBtn"')||!html.includes('id="restoreSkillsOriginalBtn"'))throw new Error('Botões de restauração de skills não foram instalados no HTML final.');
if(!html.includes('function studioRestoreSkills(mode)'))throw new Error('Runtime de restauração de skills não foi instalado.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: botões “Restaurar skills do projeto” e “Restaurar skills originais” instalados por #restorePlayerBtn; sem dependência de formatação do HTML legado.');
