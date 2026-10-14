import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const patch=fs.readFileSync(new URL('../scripts/patch-mandatory-plus-4mb.mjs',import.meta.url),'utf8');
const tactics=fs.readFileSync(new URL('../scripts/patch-native-tactical-individualization.mjs',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../src/core/plus-tactics-infrastructure.mjs',import.meta.url),'utf8');
const cmd=pkg.scripts['build:editor'];

const replacementStart=tactics.indexOf('const replacement=String.raw`');
const replacementEnd=tactics.indexOf('`;\n\nhtml=html.slice',replacementStart);
const replacementBlock=replacementStart>=0&&replacementEnd>replacementStart?tactics.slice(replacementStart,replacementEnd):'';

test('patch 4 MiB roda depois do player-id e antes do restore tático final',()=>{
  const identity=cmd.indexOf('patch-player-identity-v1.mjs');
  const mandatory=cmd.indexOf('patch-mandatory-plus-4mb.mjs');
  const tactical=cmd.indexOf('patch-native-tactical-individualization.mjs');
  assert.ok(identity>=0&&mandatory>identity&&tactical>mandatory);
});

test('studioRestoreTeamsV1 recebe barreira síncrona própria',()=>{
  assert.match(patch,/const restoreNeedle='function studioRestoreTeamsV1\(state\)\{'/);
  assert.match(patch,/studioEnsureMandatoryPlus4MiBSync\(true\)/);
  assert.match(patch,/restoreNeedle\+restoreGuard/);
  assert.match(patch,/não pode iniciar enquanto o buffer global rom ainda tiver 2 MiB/);
});

test('preparação não depende de studioAutoPreparePlusTactics',()=>{
  assert.doesNotMatch(patch,/await studioAutoPreparePlusTactics\(\)/);
  assert.match(patch,/dependência do preparador legado ainda presente/);
  assert.match(patch,/function studioEnsureMandatoryPlus4MiBSync\(forcePlus=false\)/);
});

test('expansão troca explicitamente o buffer global para 4 MiB',()=>{
  assert.match(patch,/new Uint8Array\(hs\+0x400000\)/);
  assert.match(patch,/out\.fill\(0xFF\)/);
  assert.match(patch,/rom=out;/);
  assert.match(patch,/body!==0x400000/);
  assert.match(patch,/ISSSD-PLUS-4M-ONLY/);
  assert.match(patch,/out\[pc\(0x7FD7\)\]=0x0C/);
});

test('individualização browser segue infraestrutura canônica rastreada',()=>{
  for(const token of ['ISSDTACTBANKV1','0x200040','0x200100','0x200200','0x200210','0x200220','0x02AA88','0x02B160','0x031934']){
    assert.ok(patch.includes(token),`patch browser sem ${token}`);
    assert.ok(core.includes(token),`core canônico sem ${token}`);
  }
  assert.match(patch,/alternate=\[0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7\]/);
});

test('abertura mantém preparação antecipada após applyProject',()=>{
  assert.match(patch,/studioCore\(\)\.applyProject/);
  assert.match(patch,/studioEnsureMandatoryPlus4MiB\(d\?\.base\?\.profile==='iss-deluxe-plus'\)/);
});

test('exportação também exige 4 MiB',()=>{
  assert.match(patch,/async function studioDoSave/);
  assert.match(patch,/studioEnsureMandatoryPlus4MiB\(false\)/);
});

test('restore tático final continua exigindo 4 MiB e identidade lógica',()=>{
  assert.ok(replacementBlock.length>0,'bloco de restauração tática 4 MiB não encontrado');
  assert.match(replacementBlock,/__ISSSD_PLUS_NATIVE_TACTICS_BASELINE_V1__/);
  assert.match(replacementBlock,/studioTeamsV3BaseSlot\(t,p,slot\)/);
  assert.match(replacementBlock,/body!==0x400000/);
  assert.match(replacementBlock,/ainda compartilha registro tático/);
});
