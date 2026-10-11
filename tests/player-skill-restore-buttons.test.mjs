import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const patchFile=path.join(root,'scripts','patch-player-skill-restore-buttons.mjs');
const src=fs.readFileSync(patchFile,'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('patch dos botões de restauração de skills é JavaScript válido e integra o build',()=>{
 execFileSync(process.execPath,['--check',patchFile],{stdio:'pipe'});
 assert.match(pkg.scripts['build:editor'],/patch-player-skill-restore-buttons\.mjs/);
 assert.match(src,/restoreSkillsProjectBtn/);
 assert.match(src,/restoreSkillsOriginalBtn/);
});

test('restaurar skills do projeto usa somente custom.skills sobre baseline original',()=>{
 assert.match(src,/studioTeamsV3BaselinePlayer\(currentTeam,currentPlayer\)/);
 assert.match(src,/saved\?\.custom\?\.skills/);
 assert.match(src,/if\(mode==='project'\)/);
 assert.match(src,/Object\.prototype\.hasOwnProperty\.call\(custom,k\)/);
});

test('restaurar skills originais usa baseline da ROM e não depende de cópia original no projeto',()=>{
 assert.match(src,/const target=\{\.\.\.base\.skills\}/);
 assert.doesNotMatch(src,/fieldState/);
 assert.doesNotMatch(src,/originalSkills/);
});

test('restauração de skills preserva posição, camisa e aparência nos demais bits e bytes',()=>{
 assert.match(src,/const bytes=new Uint8Array\(rom\.slice\(off,off\+7\)\)/);
 assert.match(src,/bytes\[rel\]=shift===4\?\(\(bytes\[rel\]&0x0F\)/);
 assert.match(src,/\(bytes\[rel\]&0xF0\)\|\(native&0x0F\)/);
 assert.match(src,/studioTeamsV3AttrOffsets\(currentTeam,currentPlayer\)/);
});

test('botões têm os rótulos pedidos',()=>{
 assert.match(src,/Restaurar skills do projeto/);
 assert.match(src,/Restaurar skills originais/);
});
