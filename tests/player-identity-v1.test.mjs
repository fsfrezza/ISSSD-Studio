import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patch=fs.readFileSync(path.join(root,'scripts','patch-player-identity-v1.mjs'),'utf8');
const swap=fs.readFileSync(path.join(root,'scripts','fix-lineup-swap.mjs'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('player-id-v1 integra o build após baseline e antes do modelo de posição e patches visuais',()=>{
  const cmd=pkg.scripts['build:editor'];
  const baseline=cmd.indexOf('patch-immutable-player-attr-baseline.mjs');
  const identity=cmd.indexOf('patch-player-identity-v1.mjs');
  const positions=cmd.indexOf('patch-player-position-model.mjs');
  const title=cmd.indexOf('patch-single-internal-title.mjs');
  assert.ok(baseline>=0&&identity>baseline,'player-id deve rodar depois do baseline imutável');
  assert.ok(positions>identity,'modelo de posição deve rodar depois de player-id');
  assert.ok(title>positions,'patches visuais devem rodar depois do modelo de posição');
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

test('original identity reader accepts the actual legacy fixed-name record contract',async()=>{
 const vm=await import('node:vm');
 const a=patch.indexOf('function studioTeamsV3OriginalPlayer(t,baseSlot){');
 const b=patch.indexOf('function studioTeamsV3OriginalNameBytes',a);
 const c=vm.createContext({
  original:new Uint8Array(256),
  studioTeamsV3OriginalNameRecord:()=>({no:0,fixed:' Cafu   '}),
  studioTeamsV3AttrOffset:()=>0,
  studioTeamsV3DecodeAttr:()=>({number:2,position:'DF-MF',skills:{speed:9}}),
  studioTeamsV3PlayerId:(t,s)=>t+':'+s,
  studioTeamsV3Hex:()=>'',studioTeamsV3OriginalTactical:()=>({x:-30,y:30})
 });
 vm.runInContext(patch.slice(a,b),c);
 const p=c.studioTeamsV3OriginalPlayer(30,2);
 assert.equal(p.name,'Cafu');assert.equal(p.number,2);assert.equal(p.baseSlot,2);
});
