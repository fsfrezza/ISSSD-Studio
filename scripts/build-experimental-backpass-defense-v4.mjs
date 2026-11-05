import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildExperimentalBackpassDefenseV4} from '../src/core/experimental-backpass-defense-v4.mjs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Uso: node scripts/build-experimental-backpass-defense-v4.mjs Plus-limpa.sfc Recuo-defesa-v4.sfc');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),base=readFileSync(input);
if(sha(base)!=='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a')throw Error('Base diferente da ROM Plus analisada');
const rom=buildExperimentalBackpassDefenseV4(base);writeFileSync(output,rom);
console.log(JSON.stringify({baseSha256:sha(base),outputSha256:sha(rom),size:rom.length,experimental:true,editorIntegrated:false}));
