import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const normalizeLf=text=>String(text).replace(/\r\n?/g,'\n');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const patch=normalizeLf(fs.readFileSync(new URL('../scripts/patch-mandatory-plus-4mb.mjs',import.meta.url),'utf8'));
const semanticOpen=normalizeLf(fs.readFileSync(new URL('../scripts/patch-project-open-semantic-only.mjs',import.meta.url),'utf8'));
const tactics=normalizeLf(fs.readFileSync(new URL('../scripts/patch-native-tactical-individualization.mjs',import.meta.url),'utf8'));
const core=normalizeLf(fs.readFileSync(new URL('../src/core/plus-tactics-infrastructure.mjs',import.meta.url),'utf8'));
const address=normalizeLf(fs.readFileSync(new URL('../src/core/plus-tactics-address.mjs',import.meta.url),'utf8'));
const cmd=pkg.scripts['build:editor'];

const replacementStart=tactics.indexOf('const replacement=String.raw`');
const replacementEnd=tactics.indexOf('`;\n\nhtml=html.slice',replacementStart);
const replacementBlock=replacementStart>=0&&replacementEnd>replacementStart?tactics.slice(replacementStart,replacementEnd):'';
const helperStart=patch.indexOf('const helper=String.raw`');
const helperEnd=patch.indexOf('`;\n\nif(!html.includes',helperStart);
const helperBlock=helperStart>=0&&helperEnd>helperStart?patch.slice(helperStart,helperEnd):'';

test('patch 4 MiB roda depois do player-id e antes do restore tático final',()=>{
  const identity=cmd.indexOf('patch-player-identity-v1.mjs');
  const mandatory=cmd.indexOf('patch-mandatory-plus-4mb.mjs');
  const tactical=cmd.indexOf('patch-native-tactical-individualization.mjs');
  assert.ok(identity>=0&&mandatory>identity&&tactical>mandatory);
});

test('studioRestoreTeamsV1 mantém barreira 4 MiB para operações mutantes fora da abertura',()=>{
  assert.match(patch,/const restoreNeedle='function studioRestoreTeamsV1\(state\)\{'/);
  assert.match(patch,/studioEnsureMandatoryPlus4MiBSync\(true\)/);
  assert.match(patch,/restoreNeedle\+restoreGuard/);
  assert.match(semanticOpen,/if\(window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)return false/);
});

test('preparação injetada não depende do preparador tático legado',()=>{
  assert.ok(helperBlock.length>0,'helper 4 MiB não encontrado');
  assert.doesNotMatch(helperBlock,/studioAutoPreparePlusTactics/);
  assert.match(patch,/dependência executável do preparador legado ainda presente/);
  assert.match(helperBlock,/function studioEnsureMandatoryPlus4MiBSync\(forcePlus=false\)/);
  assert.doesNotThrow(()=>new Function(helperBlock.replace(/^const helper=String\.raw`/,'')));
});

test('expansão troca explicitamente o buffer global para 4 MiB',()=>{
  assert.match(helperBlock,/new Uint8Array\(hs\+0x400000\)/);
  assert.match(helperBlock,/out\.fill\(0xFF\)/);
  assert.match(helperBlock,/rom=out;/);
  assert.match(helperBlock,/body!==0x400000/);
  assert.match(helperBlock,/ISSSD-PLUS-4M-ONLY/);
  assert.match(helperBlock,/out\[pc\(0x7FD7\)\]=0x0C/);
});

test('endereços LoROM são validados antes de aplicar o header offset',()=>{
  assert.match(helperBlock,/srcBase=studioPlus4MiBLoRomPc/);
  assert.match(helperBlock,/srcBase==null\|\|dstBase==null/);
  assert.match(helperBlock,/const srcPc=pc\(srcBase\),dstPc=pc\(dstBase\)/);
});

test('individualização browser segue infraestrutura canônica rastreada',()=>{
  for(const token of ['0x200200','0x200210','0x200220','0x02AA88','0x02B160','0x031934']){
    assert.ok(helperBlock.includes(token),`patch browser sem ${token}`);
    assert.ok(core.includes(token),`core canônico sem ${token}`);
  }
  for(const token of ['ISSDTACTBANKV1','0x200040','0x200100','0x05FDD0']){
    assert.ok(helperBlock.includes(token),`patch browser sem ${token}`);
    assert.ok(address.includes(token),`contrato de endereços sem ${token}`);
  }
  assert.match(helperBlock,/alternate=\[0xC0,0xC1,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7\]/);
});

test('abertura semantic-only bloqueia applyProject e expansão 4 MiB do ciclo legado',()=>{
  assert.match(patch,/studioCore\(\)\.applyProject/);
  assert.match(patch,/studioEnsureMandatoryPlus4MiB\(d\?\.base\?\.profile==='iss-deluxe-plus'\)/);
  assert.match(semanticOpen,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)\{\$\{physical\}\}/);
  assert.match(semanticOpen,/if\(!window\.__ISSSD_SEMANTIC_OPEN_ONLY__\)\$\{mandatory\}/);
});

test('salvamento ROM legado ainda exige 4 MiB quando usado fora do Build Pipeline',()=>{
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
