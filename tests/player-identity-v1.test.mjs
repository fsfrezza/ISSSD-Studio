import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=fs.readFileSync(path.join(root,'scripts','patch-player-identity-v1.mjs'),'utf8');
const swap=fs.readFileSync(path.join(root,'scripts','fix-lineup-swap.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('player-id-v1 integra o build após sparse/baseline e antes dos patches visuais',()=>{
  const cmd=pkg.scripts['build:editor'];
  assert.match(cmd,/patch-immutable-player-attr-baseline\.mjs && node scripts\/patch-player-identity-v1\.mjs && node scripts\/patch-single-internal-title\.mjs/);
});

test('snapshot salva identidade estável separada do slot atual',()=>{
  assert.match(patch,/identityModel:'player-id-v1'/);
  assert.match(patch,/playerId:studioTeamsV3PlayerId\(Number\(id\),baseSlot\),baseSlot,slot:Number\(pcur\.slot\)/);
});

test('restore reconstrói atributos do jogador pela identidade original e grava no slot atual',()=>{
  assert.match(patch,/studioTeamsV3OriginalPlayer\(t,baseSlot\)/);
  assert.match(patch,/studioTeamsV3AttrOffsets\(t,slot-1\)/);
  assert.match(patch,/studioTeamsV3OriginalTactical\(t,baseSlot\)/);
});

test('troca de escalação também troca o mapa de identidade lógica',()=>{
  assert.match(swap,/__ISSSD_PLAYER_BASE_SLOT_BY_CURRENT_SLOT_V1__/);
  assert.match(swap,/identity\[ra\]=identity\[rb\];identity\[rb\]=tmp/);
});
