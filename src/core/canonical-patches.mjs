import {PLUS_BASELINE} from './plus-baseline.mjs';

export const PLUS_BASE_SIZE = PLUS_BASELINE.size;

function patchOffset(patch) {
  const off = Number(patch?.off ?? patch?.offset);
  if (!Number.isInteger(off) || off < 0) throw new RangeError('invalid patch offset');
  return off;
}

function patchBytes(patch) {
  if (patch?.data instanceof Uint8Array) return Uint8Array.from(patch.data);
  if (Array.isArray(patch?.data)) {
    if (!patch.data.every(x => Number.isInteger(x) && x >= 0 && x <= 0xFF)) throw new RangeError('invalid patch byte');
    return Uint8Array.from(patch.data);
  }
  if (typeof patch?.data === 'string') {
    const hex = patch.data.replace(/\s+/g, '');
    if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new TypeError('patch data string must be hexadecimal');
    return Uint8Array.from(hex.match(/../g)?.map(x => Number.parseInt(x, 16)) ?? []);
  }
  if (Number.isInteger(patch?.value) && patch.value >= 0 && patch.value <= 0xFF) return Uint8Array.of(patch.value);
  throw new TypeError('patch must contain byte data');
}

export function normalizePatch(patch) {
  const off = patchOffset(patch);
  const data = patchBytes(patch);
  if (data.length === 0) throw new RangeError('empty patch');
  return {off, data};
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function canonicalizePatches(patches, {baseSize=PLUS_BASE_SIZE, rejectPersistedExpansion=true}={}) {
  if (!Array.isArray(patches)) throw new TypeError('patch array required');
  const normalized = patches.map(normalizePatch);

  if (rejectPersistedExpansion) {
    for (const patch of normalized) {
      if (patch.off >= baseSize || patch.off + patch.data.length > baseSize) {
        throw new RangeError('persisted patch crosses immutable base boundary');
      }
    }
  }

  normalized.sort((a,b) => a.off - b.off || a.data.length - b.data.length);

  const out = [];
  for (const patch of normalized) {
    const previous = out.at(-1);
    if (previous && previous.off === patch.off && sameBytes(previous.data, patch.data)) continue;

    if (previous) {
      const previousEnd = previous.off + previous.data.length;
      if (patch.off < previousEnd) throw new RangeError('overlapping patches');
    }
    out.push({off:patch.off, data:Uint8Array.from(patch.data)});
  }
  return out;
}

export function applyCanonicalPatches(base, patches) {
  if (!(base instanceof Uint8Array)) throw new TypeError('Uint8Array base required');
  const canonical = canonicalizePatches(patches, {baseSize:base.length, rejectPersistedExpansion:true});
  const out = base.slice();
  for (const patch of canonical) out.set(patch.data, patch.off);
  return out;
}
