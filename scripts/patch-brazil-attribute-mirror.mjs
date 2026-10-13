import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'editor', 'ISSSD-Studio.html');

let html = fs.readFileSync(file, 'utf8');

const OLD_IDS = [
  'ISSSD_BRAZIL_ATTR_MIRROR_V1',
  'ISSSD_BRAZIL_ATTR_MIRROR_V2'
];

for (const id of OLD_IDS) {
  const re = new RegExp(
    `<script\\s+id=["']${id}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,
    'g'
  );
  html = html.replace(re, '');
}

const runtime = String.raw`
<script id="ISSSD_BRAZIL_ATTR_MIRROR_V2">
(()=>{
'use strict';

const BRAZIL_MAIN_BASE = 0x151068;
const BRAZIL_SPECIAL_MIRROR = 0x78C0;
const BRAZIL_FULL_MIRROR = 0x78C6;
const RECORD_SIZE = 7;

function syncBrazilAttributeMirrors(rom){
  if (!(rom instanceof Uint8Array)) return 0;

  let writes = 0;

  // Jogador 1 (Cafu): somente bytes 1..6 sao espelhados.
  {
    const src = BRAZIL_MAIN_BASE + RECORD_SIZE;
    const srcStart = src + 1;
    const srcEnd = src + RECORD_SIZE;

    if (
      srcEnd <= rom.length &&
      BRAZIL_SPECIAL_MIRROR + 6 <= rom.length
    ) {
      rom.set(
        rom.slice(srcStart, srcEnd),
        BRAZIL_SPECIAL_MIRROR
      );
      writes++;
    }
  }

  // Jogadores 2..7: registro completo de 7 bytes.
  for (let playerIndex = 2; playerIndex <= 7; playerIndex++) {
    const src = BRAZIL_MAIN_BASE + playerIndex * RECORD_SIZE;
    const dst = BRAZIL_FULL_MIRROR + (playerIndex - 2) * RECORD_SIZE;

    if (
      src + RECORD_SIZE <= rom.length &&
      dst + RECORD_SIZE <= rom.length
    ) {
      rom.set(
        rom.slice(src, src + RECORD_SIZE),
        dst
      );
      writes++;
    }
  }

  return writes;
}

function brazilMirrorsAreValid(rom){
  if (!(rom instanceof Uint8Array)) return false;

  const p1 = BRAZIL_MAIN_BASE + RECORD_SIZE;

  for (let i = 0; i < 6; i++) {
    if (rom[p1 + 1 + i] !== rom[BRAZIL_SPECIAL_MIRROR + i]) {
      return false;
    }
  }

  for (let playerIndex = 2; playerIndex <= 7; playerIndex++) {
    const src = BRAZIL_MAIN_BASE + playerIndex * RECORD_SIZE;
    const dst = BRAZIL_FULL_MIRROR + (playerIndex - 2) * RECORD_SIZE;

    for (let i = 0; i < RECORD_SIZE; i++) {
      if (rom[src + i] !== rom[dst + i]) {
        return false;
      }
    }
  }

  return true;
}

window.__ISSSD_SYNC_BRAZIL_ATTRIBUTE_MIRRORS__ = syncBrazilAttributeMirrors;
window.__ISSSD_VALIDATE_BRAZIL_ATTRIBUTE_MIRRORS__ = brazilMirrorsAreValid;

function patchDownload(){
  if (
    typeof window.studioDownload !== 'function' ||
    window.__ISSSD_BRAZIL_MIRROR_DOWNLOAD_V2_PATCHED__
  ) {
    return false;
  }

  const original = window.studioDownload;

  window.studioDownload = function(data, name, type, ...rest){
    const filename = String(name || '');
    const isRom =
      /\\.(?:smc|sfc)$/i.test(filename) ||
      /octet-stream/i.test(String(type || ''));

    if (isRom) {
      let out = null;

      if (data instanceof Uint8Array) {
        out = new Uint8Array(data);
      } else if (data instanceof ArrayBuffer) {
        out = new Uint8Array(data.slice(0));
      } else if (
        ArrayBuffer.isView(data) &&
        data.buffer instanceof ArrayBuffer
      ) {
        out = new Uint8Array(
          data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength
          )
        );
      }

      if (out) {
        syncBrazilAttributeMirrors(out);

        if (!brazilMirrorsAreValid(out)) {
          throw new Error(
            'Falha ao sincronizar os registros espelhados do Brasil.'
          );
        }

        data = out;

        window.ISSSDLog?.add?.(
          'ROM / Build',
          'info',
          'Espelhamento de atributos do Brasil sincronizado',
          {
            player1: 'main bytes 1..6 -> 0x78C0..0x78C5',
            players2to7: 'main 7 bytes -> 0x78C6..0x78EF'
          }
        );
      }
    }

    return original.call(this, data, name, type, ...rest);
  };

  window.__ISSSD_BRAZIL_MIRROR_DOWNLOAD_V2_PATCHED__ = true;
  return true;
}

if (!patchDownload()) {
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (patchDownload() || tries > 200) {
      clearInterval(timer);
    }
  }, 50);
}

})();
</script>
`;

if (!html.includes('</body>')) {
  throw new Error('Nao foi possivel localizar </body> em editor/ISSSD-Studio.html.');
}

html = html.replace('</body>', runtime + '\n</body>');

fs.writeFileSync(file, html, 'utf8');

console.log('ISSSD Studio: mirror Brasil V2 instalado.');
console.log('  jogador 1: bytes 1..6 -> 0x78C0..0x78C5');
console.log('  jogadores 2..7: 7 bytes -> 0x78C6..0x78EF');
