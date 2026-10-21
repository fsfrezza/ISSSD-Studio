import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {installBodyCompositionProof,alignProofHead,composeProofBody,readProofBody,BODY_PROOF_POSE} from '../src/core/player-body-proof.mjs';
import {expandPlusTo4MiB} from '../src/core/plus-tactics-infrastructure.mjs';
import {syncPlusRuntimeMirrors,writeFinalSnesChecksum} from '../src/core/plus-export-finalizer.mjs';
import {playerOffset} from '../src/core/plus-player.mjs';
import {readNativeAppearancePalettes} from '../src/core/player-appearance.mjs';
import {loadPlayerHairFiles} from '../src/platform/player-hair-files.mjs';
const args=process.argv.slice(2),get=(key,def)=>{const i=args.indexOf(key);if(i<0)return def;if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Falta valor de '+key);return args[i+1];};
const romPath=get('--rom',process.env.ISSSD_PLUS_ROM_PATH||'roms/International Superstar Soccer Deluxe Plus.sfc'),out=path.resolve(get('--out','scratch/player-body-proof')),team=Number(get('--team','30'));
if(!Number.isInteger(team)||team<0||team>=56)throw Error('Equipe deve ser 0–55.');
if(path.resolve(romPath)===path.join(out,'prova-corpo.sfc'))throw Error('A saída não pode substituir a ROM-base.');
const base=new Uint8Array(fs.readFileSync(romPath)),hash=crypto.createHash('sha256').update(base).digest('hex');
if(hash!=='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a')throw Error('Use a ROM Plus original canônica de 2 MB.');
const root=path.resolve(import.meta.dirname,'..'),input=get('--heads'),loaded=input?null:loadPlayerHairFiles(root);let heads;
if(input){const doc=JSON.parse(fs.readFileSync(input));if(doc.schema!=='isssd-body-proof-v1'||doc.pose!==BODY_PROOF_POSE.cpu)throw Error('Arquivo de cabeças da prova incompatível.');heads=doc.heads;}else heads={14:Array.from(alignProofHead(loaded.frames[14][0])),15:Array.from(alignProofHead(loaded.frames[15][0]))};
const original=readProofBody(base);for(const h of [14,15])composeProofBody(base,heads[h]); // validate before writing any output
const rom=expandPlusTo4MiB(base);installBodyCompositionProof(rom,base,{heads});
// Ten outfield players, alternating 14/15: deliberately more than three.
for(let p=1;p<11;p++){const at=playerOffset(team,p)+6;rom[at]=(rom[at]&240)|(p%2?14:15);}
syncPlusRuntimeMirrors(rom);rom.set(Buffer.from('ISSSD BODY PROOF'.padEnd(21)),0x7FC0);writeFinalSnesChecksum(rom);
const model={schema:'isssd-body-proof-v1',pose:BODY_PROOF_POSE.cpu,heads,original:Array.from(original),palette:readNativeAppearancePalettes(base,team).colors[0]};
const template=fs.readFileSync(path.join(root,'editor-src/player-body-proof.html'),'utf8');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'prova-corpo.sfc'),rom);fs.writeFileSync(path.join(out,'cabecas.json'),JSON.stringify({schema:model.schema,pose:model.pose,heads},null,2));fs.writeFileSync(path.join(out,'editar-prova.html'),template.replace('/*__PROOF_MODEL__*/',JSON.stringify(model)));
const report={experimental:true,baseSHA256:hash,pose:BODY_PROOF_POSE,team,players:Array.from({length:10},(_,i)=>({slot:i+2,hair:i%2?15:14})),headsSource:input||loaded.files,romSHA256:crypto.createHash('sha256').update(rom).digest('hex'),scope:'Only Up_Running1 uses composed heads; all other poses retain original body graphics. Additional overlays 14/15 are disabled in this experimental ROM. No production Editor or project was modified.'};
fs.writeFileSync(path.join(out,'relatorio.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,rom:path.join(out,'prova-corpo.sfc'),editor:path.join(out,'editar-prova.html'),scope:report.scope},null,2));
