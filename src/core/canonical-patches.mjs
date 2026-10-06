import {PLUS_BASELINE} from './plus-baseline.mjs';

export const PLUS_BASE_SIZE = PLUS_BASELINE.size;

function patchOffset(patch) {
  const off = Number(patch?.off ?? patch?.offset);
  if (!Number.isInteger(off) || off < 0) throw new RangeError('invalid patch offset');
  return off;
}

function validateByteArray(value) {
  if (!value.every(x => Number.isInteger(x) && x >= 0 && x <= 0xFF)) throw new RangeError('invalid patch byte');
  return Uint8Array.from(value);
}

function decodeHex(value,label) {
  const compact=value.replace(/\s+/g,'');
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(compact)) throw new TypeError(`${label} string must be hexadecimal`);
  return Uint8Array.from(compact.match(/../g)?.map(x => Number.parseInt(x,16)) ?? []);
}

function decodeBase64(value,label) {
  const compact=String(value ?? '').replace(/\s+/g,'');
  const base64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (compact.length===0 || compact.length%4!==0 || !base64.test(compact)) {
    throw new TypeError(`${label} must be valid Base64`);
  }
  try {
    const binary=atob(compact);
    return Uint8Array.from(binary,ch=>ch.charCodeAt(0)&0xFF);
  } catch {
    throw new TypeError(`${label} must be valid Base64`);
  }
}

function decodeHistoricalRle(bytes,expectedLength) {
  const length=Number(expectedLength);
  if (!Number.isInteger(length) || length < 0) throw new RangeError('rle-base64 patch len must be a non-negative integer');
  const a=bytes instanceof Uint8Array?bytes:Uint8Array.from(bytes||[]);
  const out=new Uint8Array(length);
  let i=0,k=0;
  while (i<a.length && k<out.length) {
    const control=a[i++];
    const count=(control&0x7F)+1;
    if (control&0x80) {
      if (i>=a.length) throw new RangeError('rle-base64 repeat run is truncated');
      const value=a[i++];
      out.fill(value,k,Math.min(out.length,k+count));
      k+=count;
    } else {
      const end=Math.min(i+count,a.length);
      out.set(a.subarray(i,end),k);
      k+=end-i;
      i=end;
    }
  }
  if (k!==out.length) throw new RangeError('rle-base64 reconstructed length mismatch');
  return out;
}

function patchBytes(patch) {
  if (patch?.encoding === 'rle-base64') {
    if (typeof patch?.data !== 'string') throw new TypeError('rle-base64 patch data must be a Base64 string');
    return decodeHistoricalRle(decodeBase64(patch.data,'rle-base64 patch data'),patch.len);
  }
  if (patch?.encoding != null) throw new TypeError(`unsupported patch encoding: ${patch.encoding}`);
  if (patch?.data instanceof Uint8Array) return Uint8Array.from(patch.data);
  if (Array.isArray(patch?.data)) return validateByteArray(patch.data);
  if (patch?.bytes instanceof Uint8Array) return Uint8Array.from(patch.bytes);
  if (Array.isArray(patch?.bytes)) return validateByteArray(patch.bytes);
  if (typeof patch?.data === 'string') return decodeHex(patch.data,'patch data');
  if (typeof patch?.bytes === 'string') return decodeHex(patch.bytes,'patch bytes');
  if (Number.isInteger(patch?.value) && patch.value >= 0 && patch.value <= 0xFF) return Uint8Array.of(patch.value);
  throw new TypeError('patch must contain byte data');
}

export function normalizePatch(patch) {
  const off = patchOffset(patch);
  const data = patchBytes(patch);
  if (data.length === 0) throw new RangeError('empty patch');
  return {off, data};
}

function patchPreview(patch) {
  const raw=patch?.data ?? patch?.bytes ?? patch?.value;
  if (typeof raw==='string') return JSON.stringify(raw.slice(0,80));
  if (Array.isArray(raw)) return JSON.stringify(raw.slice(0,16));
  if (raw instanceof Uint8Array) return JSON.stringify([...raw.slice(0,16)]);
  try { return JSON.stringify(raw); } catch { return String(raw); }
}

function normalizePatchWithContext(patch,index) {
  try {
    const normalized=normalizePatch(patch);
    return {...normalized,sourceIndex:index};
  } catch (error) {
    const rawOff=patch?.off ?? patch?.offset;
    const message=`invalid persisted patch at index ${index}, offset ${String(rawOff)}, preview ${patchPreview(patch)}: ${error.message}`;
    const wrapped=new error.constructor(message);
    wrapped.cause=error;
    throw wrapped;
  }
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function hexPreview(bytes,max=16) {
  return [...bytes.slice(0,max)].map(v=>v.toString(16).padStart(2,'0').toUpperCase()).join(' ');
}

function replayLegacyRlePatches(normalized,baseSize,rejectPersistedExpansion) {
  let length=baseSize;
  if (!rejectPersistedExpansion) {
    for (const patch of normalized) length=Math.max(length,patch.off+patch.data.length);
  }
  const values=new Uint8Array(length);
  const written=new Uint8Array(length);

  // Historical studioApplyPatches() iterated in persisted order and called
  // out.set(...), therefore a later patch wins any overlapping byte.
  for (const patch of normalized) {
    values.set(patch.data,patch.off);
    written.fill(1,patch.off,patch.off+patch.data.length);
  }

  const out=[];
  let i=0;
  while (i<length) {
    if (!written[i]) { i++; continue; }
    const start=i;
    while (i<length && written[i]) i++;
    out.push({off:start,data:values.slice(start,i)});
  }
  return out;
}

export function canonicalizePatches(patches, {baseSize=PLUS_BASE_SIZE, rejectPersistedExpansion=true}={}) {
  if (!Array.isArray(patches)) throw new TypeError('patch array required');
  const normalized = patches.map((patch,index)=>normalizePatchWithContext(patch,index));

  if (rejectPersistedExpansion) {
    for (const patch of normalized) {
      if (patch.off >= baseSize || patch.off + patch.data.length > baseSize) {
        throw new RangeError('persisted patch crosses immutable base boundary');
      }
    }
  }

  const isLegacyRleSet=patches.length>0 && patches.every(patch=>patch?.encoding==='rle-base64');
  if (isLegacyRleSet) return replayLegacyRlePatches(normalized,baseSize,rejectPersistedExpansion);

  normalized.sort((a,b) => a.off - b.off || a.data.length - b.data.length || a.sourceIndex-b.sourceIndex);

  const out = [];
  for (const patch of normalized) {
    const previous = out.at(-1);
    if (previous && previous.off === patch.off && sameBytes(previous.data, patch.data)) continue;

    if (previous) {
      const previousEnd = previous.off + previous.data.length;
      if (patch.off < previousEnd) {
        const overlapStart=patch.off;
        const overlapEnd=Math.min(previousEnd,patch.off+patch.data.length);
        const previousSlice=previous.data.slice(overlapStart-previous.off,overlapEnd-previous.off);
        const currentSlice=patch.data.slice(0,overlapEnd-overlapStart);
        if (!sameBytes(previousSlice,currentSlice)) {
          throw new RangeError(
            `overlapping patches: previous index ${previous.sourceIndex} offset ${previous.off} len ${previous.data.length}; `+
            `current index ${patch.sourceIndex} offset ${patch.off} len ${patch.data.length}; `+
            `overlap ${overlapStart}..${overlapEnd-1}; previous bytes [${hexPreview(previousSlice)}]; current bytes [${hexPreview(currentSlice)}]`
          );
        }
        const patchEnd=patch.off+patch.data.length;
        if (patchEnd<=previousEnd) continue;
        const tail=patch.data.slice(previousEnd-patch.off);
        previous.data=Uint8Array.from([...previous.data,...tail]);
        continue;
      }
    }
    out.push({off:patch.off, data:Uint8Array.from(patch.data), sourceIndex:patch.sourceIndex});
  }
  return out.map(({off,data})=>({off,data}));
}

export function applyCanonicalPatches(base, patches) {
  if (!(base instanceof Uint8Array)) throw new TypeError('Uint8Array base required');
  const canonical = canonicalizePatches(patches, {baseSize:base.length, rejectPersistedExpansion:true});
  const out = base.slice();
  for (const patch of canonical) out.set(patch.data, patch.off);
  return out;
}
