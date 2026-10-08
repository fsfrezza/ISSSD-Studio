import {PLUS_BASELINE} from './plus-baseline.mjs';

export const PLUS = Object.freeze({
  baseSize: PLUS_BASELINE.size,
  playerBank: 0x150000,
  teams: 56,
  playersPerTeam: 20,
  recordSize: 7,
});

export function playerOffset(team, player) {
  if (!Number.isInteger(team) || team < 0 || team >= PLUS.teams) throw new RangeError('team');
  if (!Number.isInteger(player) || player < 0 || player >= PLUS.playersPerTeam) throw new RangeError('player');
  return PLUS.playerBank + ((team * PLUS.playersPerTeam + player) * PLUS.recordSize);
}

export function decodePlayerRecord(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 7) throw new TypeError('7-byte Uint8Array required');
  const hi=x=>(x>>>4)&0xF, lo=x=>x&0xF;
  return {
    acceleration:hi(bytes[0]), speed:lo(bytes[0]),
    shot:hi(bytes[1]), curve:lo(bytes[1]),
    balance:hi(bytes[2]), intelligence:lo(bytes[2]),
    dribbling:hi(bytes[3]), jump:lo(bytes[3]),
    naturalPosition:hi(bytes[4]), energy:lo(bytes[4]),
    jersey:bytes[5]+1,
    appearanceRaw:bytes[6],
  };
}

export function writeSkill(record, field, uiValue) {
  if (!(record instanceof Uint8Array) || record.length !== 7) throw new TypeError('7-byte Uint8Array required');
  if (!Number.isInteger(uiValue) || uiValue < 1 || uiValue > 10) throw new RangeError('skill must be 1..10');
  const raw=uiValue-1;
  const map={
    acceleration:[0,'hi'],speed:[0,'lo'],shot:[1,'hi'],curve:[1,'lo'],
    balance:[2,'hi'],intelligence:[2,'lo'],dribbling:[3,'hi'],jump:[3,'lo'],energy:[4,'lo']
  };
  const spec=map[field]; if(!spec) throw new RangeError('unknown skill');
  const [i,n]=spec;
  record[i]=n==='hi'?((raw<<4)|(record[i]&0x0F)):((record[i]&0xF0)|raw);
  return record;
}

export function writeNaturalPosition(record, rawPosition) {
  if (!Number.isInteger(rawPosition)||rawPosition<0||rawPosition>6) throw new RangeError('position');
  record[4]=(rawPosition<<4)|(record[4]&0x0F); return record;
}

export function writeJersey(record, jersey) {
  if (!Number.isInteger(jersey)||jersey<1||jersey>20) throw new RangeError('jersey');
  record[5]=jersey-1; return record;
}

// Plus-specific integrity copies stored in original ISSD bank-80 freespace.
// Disassembly-assisted verification shows Brazil/player 1 bytes 1..6 are
// compared at runtime against $80:F8C0..$80:F8C5. Players 2..7 have the
// previously verified full 7-byte copies beginning at PC 0x78C6.
export function knownMirrorSlices(team,player){
  if(team!==30)return [];
  if(player===1)return [{mainStart:1,mirror:0x78C0,length:6}];
  if(player>=2&&player<=7)return [{mainStart:0,mirror:0x78C6+((player-2)*7),length:7}];
  return [];
}

// Compatibility helper for callers that require a full-record mirror offset.
export function knownMirrorOffset(team, player) {
  const slices=knownMirrorSlices(team,player);
  if(slices.length===1&&slices[0].mainStart===0&&slices[0].length===7)return slices[0].mirror;
  return null;
}

export function surgicalWritesForRecord(team,player,before,after) {
  if(before.length!==7||after.length!==7) throw new TypeError('7-byte records required');
  const high=playerOffset(team,player), slices=knownMirrorSlices(team,player), writes=[];
  for(let i=0;i<7;i++) if(before[i]!==after[i]) {
    writes.push({off:high+i,value:after[i],kind:'main'});
    for(const slice of slices){
      if(i>=slice.mainStart&&i<slice.mainStart+slice.length){
        writes.push({off:slice.mirror+(i-slice.mainStart),value:after[i],kind:'mirror'});
      }
    }
  }
  return writes;
}

export function reconcileKnownPlayerIntegrityMirrors(rom){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const out=rom.slice();
  for(let player=1;player<=7;player++){
    const main=playerOffset(30,player);
    for(const slice of knownMirrorSlices(30,player)){
      for(let i=0;i<slice.length;i++)out[slice.mirror+i]=out[main+slice.mainStart+i];
    }
  }
  return out;
}
