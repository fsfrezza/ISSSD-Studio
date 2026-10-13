import assert from 'node:assert/strict';

const MAIN = 0x151068;
const SPECIAL = 0x78C0;
const FULL = 0x78C6;
const REC = 7;

function syncBrazilAttributeMirrors(rom){
  const p1 = MAIN + REC;
  rom.set(rom.slice(p1 + 1, p1 + REC), SPECIAL);

  for (let playerIndex = 2; playerIndex <= 7; playerIndex++) {
    const src = MAIN + playerIndex * REC;
    const dst = FULL + (playerIndex - 2) * REC;
    rom.set(rom.slice(src, src + REC), dst);
  }
}

const rom = new Uint8Array(0x200000);

for (let p = 0; p < 20; p++) {
  const off = MAIN + p * REC;
  for (let b = 0; b < REC; b++) {
    rom[off + b] = (0x10 * p + b + 1) & 0xFF;
  }
}

rom.fill(0xEE, SPECIAL, FULL + 6 * REC);

syncBrazilAttributeMirrors(rom);

const p1 = MAIN + REC;
assert.deepEqual(
  [...rom.slice(SPECIAL, SPECIAL + 6)],
  [...rom.slice(p1 + 1, p1 + 7)]
);

for (let p = 2; p <= 7; p++) {
  const src = MAIN + p * REC;
  const dst = FULL + (p - 2) * REC;

  assert.deepEqual(
    [...rom.slice(dst, dst + REC)],
    [...rom.slice(src, src + REC)],
    `Mirror divergente no jogador ${p}`
  );
}

console.log('OK: espelhamento especial do Brasil validado.');
console.log('OK: jogador 1 usa bytes 1..6 em 0x78C0.');
console.log('OK: jogadores 2..7 usam registros completos em 0x78C6..0x78EF.');
