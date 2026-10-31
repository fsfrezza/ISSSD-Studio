#!/usr/bin/env node
// PB9T discovery only. No ROM is modified and no unverified patch is enabled.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const [baselinePath, pb9tPath, outputPath] = process.argv.slice(2);
if (!baselinePath || !pb9tPath) {
  console.error('Uso: node scripts/analyze-pb9t.mjs <plus-base.sfc> <pb9t.sfc> [resultado.json]');
  process.exit(2);
}
const base = fs.readFileSync(baselinePath);
const pb9t = fs.readFileSync(pb9tPath);
if (base.length !== pb9t.length) throw new Error('ROMs de tamanhos distintos: comparar mapeamento antes dos offsets.');
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const changes = [], banks = new Map();
let begin = -1, last = -1, differenceCount = 0;
for (let i = 0; i < base.length; i++) {
  if (base[i] === pb9t[i]) {
    if (begin >= 0) { changes.push({start:begin,end:last,length:last-begin+1});begin = -1; }
    continue;
  }
  differenceCount++;
  if (begin < 0) begin = i;
  last = i;
  const bank = Math.floor(i / 0x8000);
  banks.set(bank,(banks.get(bank)||0)+1);
}
if (begin >= 0) changes.push({start:begin,end:last,length:last-begin+1});
const result = {
  note:'Inventário binário, não é prova de quais funcionalidades estão presentes. Não copiar estes trechos automaticamente.',
  files: [{file:path.basename(baselinePath),sha256:sha256(base),size:base.length},
          {file:path.basename(pb9tPath),sha256:sha256(pb9t),size:pb9t.length}],
  differenceCount, differencePercent:Number((differenceCount*100/base.length).toFixed(5)),
  differentRanges:changes.length,
  banks:[...banks].sort((a,b)=>b[1]-a[1]).map(([bank,bytes])=>({bank,bankHex:'0x'+bank.toString(16),differentBytes:bytes})),
  ranges:changes
};
const json = JSON.stringify(result,null,2)+'\n';
if (outputPath) { fs.mkdirSync(path.dirname(outputPath),{recursive:true});fs.writeFileSync(outputPath,json); }
else process.stdout.write(json);
