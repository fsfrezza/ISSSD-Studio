import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const oldLine="const raw=studioTeamsV3OriginalNameBytes(t,baseSlot);if(raw){rom.set(raw,playerNameFileOffset(t,slot-1));copied++}";
const newLine="const raw=studioTeamsV3OriginalNameBytes(t,baseSlot),dst=studioTeamsV3NameRecord(t,slot-1)?.no;if(raw&&Number.isInteger(dst)){rom.set(raw,dst);copied++}";

const hadOld=html.includes(oldLine);
if(hadOld)html=html.replace(oldLine,newLine);
if(html.includes(oldLine))throw new Error('Player name offset: chamada antiga permaneceu em studioTeamsV3RestoreNames.');
if(!html.includes("dst=studioTeamsV3NameRecord(t,slot-1)?.no"))throw new Error('Player name offset: destino canônico de nome não foi instalado.');

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: restore de nomes usa studioTeamsV3NameRecord no ponto de player-id; referências legadas fora desse bloco não são tratadas como erro de build.');
