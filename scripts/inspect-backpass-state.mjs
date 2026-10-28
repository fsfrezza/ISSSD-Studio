import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {parseMesenSaveState,compareMesenWram} from '../src/emulator/mesen-save-state.mjs';

const [source,destination,comparison]=process.argv.slice(2);
if(!source||!destination)throw Error('Uso: node scripts/inspect-backpass-state.mjs estado.mss diretório-saída [estado-depois.mss]');
const state=parseMesenSaveState(readFileSync(source));
// Parse all inputs before creating outputs.
const diff=comparison?compareMesenWram(state,parseMesenSaveState(readFileSync(comparison))):null;
const out=resolve(destination);mkdirSync(out,{recursive:true});
writeFileSync(join(out,'backpass-wram.bin'),state.wram);
const summary={schema:'isssd-backpass-state-inspection-v1',sourceSha256:state.sha256,rom:state.rom,formatVersion:state.formatVersion,wramSize:state.wram.length,fieldCount:state.fields.size,frame:state.frame,cpu:state.cpu,gameplayMappingConfirmed:false,note:'Estado extraído; endereços de contato e rotina de pênalti ainda não confirmados.'};
writeFileSync(join(out,'backpass-state.json'),JSON.stringify(summary,null,2)+'\n');
if(diff)writeFileSync(join(out,'backpass-wram-diff.json'),JSON.stringify(diff,null,2)+'\n');
console.log(JSON.stringify(summary));
