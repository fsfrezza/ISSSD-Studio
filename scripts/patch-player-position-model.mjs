import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

// A posição do registro de jogador usa seis códigos reais:
// 1 GO, 2 DF, 3 DF-MF, 4 MF, 5 MF-FW, 6 FW.
// VOL/MC/MO/AT ficam apenas como aliases de compatibilidade para projetos antigos.
const oldMap="const STUDIO_TEAMS_V3_POS_TO_ID={NONE:0,GO:1,DF:2,VOL:3,MC:4,MO:5,AT:6};";
const newMap="const STUDIO_TEAMS_V3_POS_TO_ID={NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6};";
if(html.includes(oldMap))html=html.replace(oldMap,newMap);
else if(!html.includes(newMap))throw new Error('Position model: mapa POS_TO_ID não encontrado em formato legado nem canônico.');

const oldIds="const STUDIO_TEAMS_V3_ID_TO_POS=['NONE','GO','DF','VOL','MC','MO','AT'];";
const newIds="const STUDIO_TEAMS_V3_ID_TO_POS=['NONE','GO','DF','DF-MF','MF','MF-FW','FW'];";
if(html.includes(oldIds))html=html.replace(oldIds,newIds);
else if(!html.includes(newIds))throw new Error('Position model: mapa ID_TO_POS não encontrado em formato legado nem canônico.');

// O patch sparse elimina referências TDZ usando mapas inline; atualiza esses mapas também.
html=html.replaceAll("(['NONE','GO','DF','VOL','MC','MO','AT'][(b[4]>>4)&15]||'NONE')","(['NONE','GO','DF','DF-MF','MF','MF-FW','FW'][(b[4]>>4)&15]||'NONE')");
html=html.replaceAll("({NONE:0,GO:1,DF:2,VOL:3,MC:4,MO:5,AT:6}[String(p?.position||'NONE').toUpperCase()]??0)","({NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6}[String(p?.position||'NONE').toUpperCase()]??0)");

// Campo visual pPosition usa os códigos numéricos da ROM. Só a nomenclatura estava errada.
const visualLabels=[
 ['0 · Não usar','0 · Não usar'],
 ['1 · Goleiro','1 · GO · Goleiro'],
 ['2 · Defensor','2 · DF · Defensor'],
 ['3 · Volante','3 · DF-MF · Defensor / Meio-campista'],
 ['4 · Meio-campista','4 · MF · Meio-campista'],
 ['5 · Meia ofensivo','5 · MF-FW · Meio-campista / Atacante'],
 ['6 · Atacante','6 · FW · Atacante']
];
for(const [from,to] of visualLabels)html=html.replaceAll(from,to);

// O encoder pode estar no formato com tabela const (antes do sparse patch) ou
// com mapa inline (depois do sparse patch). Ambos são válidos, mas o resultado
// final deve conter a nomenclatura canônica 1..6.
const canonicalConstEncoder="const s=p?.skills||{},ap=p?.appearance||{},pos=STUDIO_TEAMS_V3_POS_TO_ID[String(p?.position||'NONE').toUpperCase()]??0;";
const canonicalInlineEncoder="({NONE:0,GO:1,GK:1,DF:2,'DF-MF':3,VOL:3,MF:4,MC:4,'MF-FW':5,MO:5,FW:6,AT:6}[String(p?.position||'NONE').toUpperCase()]??0)";
if(!html.includes(canonicalConstEncoder)&&!html.includes(canonicalInlineEncoder)){
 throw new Error('Position model: encoder de posição canônico não encontrado.');
}

if(!html.includes("'DF-MF':3")||!html.includes("'MF-FW':5")||!html.includes("['NONE','GO','DF','DF-MF','MF','MF-FW','FW']"))throw new Error('Position model: nomenclatura canônica não foi instalada.');
fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: posições de jogador normalizadas para GO / DF / DF-MF / MF / MF-FW / FW; aliases legados preservados apenas para leitura.');
