import {PLUS} from './plus-player.mjs';
import {assertExpectedSize,diffRanges,writeSnesChecksum} from './rom-integrity.mjs';

function requireBytes(value, label) {
  if (!(value instanceof Uint8Array)) throw new TypeError(label+' must be Uint8Array');
  return value;
}

export function buildPlusRom(baseRom, {
  semanticState={},
  prepareInfrastructure=null,
  writers=[],
  writeChecksum=true,
}={}) {
  requireBytes(baseRom,'base ROM');
  if (baseRom.length !== PLUS.baseSize) throw new RangeError('Plus base ROM must be exactly 2 MiB');
  if (!Array.isArray(writers) || writers.some(x => typeof x !== 'function')) throw new TypeError('writers must be functions');

  const immutableSnapshot=baseRom.slice();
  let work=baseRom.slice();

  if (prepareInfrastructure !== null) {
    if (typeof prepareInfrastructure !== 'function') throw new TypeError('prepareInfrastructure must be a function');
    const prepared=prepareInfrastructure(work,semanticState);
    if (prepared !== undefined) work=requireBytes(prepared,'prepared ROM');
  }

  for (const writer of writers) {
    const result=writer(work,semanticState);
    if (result !== undefined) work=requireBytes(result,'writer result');
  }

  assertExpectedSize(work.length);
  if (writeChecksum) writeSnesChecksum(work);

  if (baseRom.length !== immutableSnapshot.length || baseRom.some((v,i)=>v!==immutableSnapshot[i])) {
    throw new Error('build mutated immutable base ROM');
  }

  return {
    rom:work,
    diff:diffRanges(baseRom,work),
  };
}
