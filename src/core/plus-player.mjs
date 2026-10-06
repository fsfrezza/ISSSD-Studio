export const PLUS = Object.freeze({
  baseSize: 0x200000,
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

// Empirically verified Plus low-ROM mirrors only.
// Brazil is internal team 30; only player indices 2..7 have known 7-byte mirrors.
export function knownMirrorOffset(team, player) {
  if (team===30 && player>=2 && player<=7) return 0x78C6 + ((player-2)*7);
  return null;
}

export function surgicalWritesForRecord(team,player,before,after) {
  if(before.length!==7||after.length!==7) throw new TypeError('7-byte records required');
  const high=playerOffset(team,player), mirror=knownMirrorOffset(team,player), writes=[];
  for(let i=0;i<7;i++) if(before[i]!==after[i]) {
    writes.push({off:high+i,value:after[i],kind:'main'});
    if(mirror!==null) writes.push({off:mirror+i,value:after[i],kind:'mirror'});
  }
  return writes;
}
