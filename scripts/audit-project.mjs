#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import {canonicalProjectState} from '../src/core/project-state.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/audit-project.mjs <project.issdproj>');
  process.exit(2);
}

const raw = fs.readFileSync(file, 'utf8');
const p = JSON.parse(raw);
const patches = p?.state?.patchesCompact ?? p?.patchesCompact ?? [];
const baseSize = Number(p?.base?.size ?? 0x200000);
const targetLength = Number(p?.state?.targetLength ?? p?.targetLength ?? baseSize);

function patchOff(x) { return Number(x?.off ?? x?.offset ?? -1); }
function declaredLen(x) {
  if (Number.isFinite(Number(x?.len))) return Number(x.len);
  if (Number.isFinite(Number(x?.length))) return Number(x.length);
  return null;
}
function stable(x) { return JSON.stringify(x); }

const exact = new Map();
const duplicates = [];
const expansion = [];
const invalid = [];
for (let i=0;i<patches.length;i++) {
  const pch=patches[i], off=patchOff(pch), len=declaredLen(pch);
  if (!Number.isFinite(off) || off < 0) invalid.push(i);
  const key=stable(pch);
  if (exact.has(key)) duplicates.push([exact.get(key),i]);
  else exact.set(key,i);
  if (off >= baseSize || (len !== null && off + len > baseSize)) expansion.push({index:i,off,len});
}

let canonicalStateError=null;
try { canonicalProjectState(p,{baseSize}); }
catch (error) { canonicalStateError=error.message; }

const semantic = p?.semantic ?? p?.state?.semantic ?? {};
const report = {
  file,
  sha256: crypto.createHash('sha256').update(raw).digest('hex'),
  format: p?.format ?? null,
  version: p?.version ?? null,
  appVersion: p?.appVersion ?? null,
  baseSize,
  targetLength,
  patchCount: patches.length,
  exactDuplicatePatchCount: duplicates.length,
  expansionPatchCount: expansion.length,
  invalidPatchCount: invalid.length,
  canonicalStateError,
  semanticKeys: Object.keys(semantic),
  suspiciousFullExpansion: expansion.filter(x=>x.off===0x200000 && x.len===0x200000),
};
console.log(JSON.stringify(report,null,2));

let bad=false;
if (canonicalStateError) { console.error('FAIL: '+canonicalStateError); bad=true; }
if (invalid.length) { console.error('FAIL: invalid patch offsets'); bad=true; }
if (report.suspiciousFullExpansion.length) {
  console.error('FAIL: persisted full 2 MiB expansion patch(es) at 0x200000');
  bad=true;
}
if (targetLength > baseSize && report.suspiciousFullExpansion.length) {
  console.error('FAIL: project persists generated expansion state');
  bad=true;
}
process.exitCode=bad?1:0;
