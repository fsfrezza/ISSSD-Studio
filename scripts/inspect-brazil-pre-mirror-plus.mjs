import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {playerOffset,knownMirrorOffset} from '../src/core/plus-player.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function hex(n,width=6){return `0x${Number(n).toString(16).toUpperCase().padStart(width,'0')}`;}
function bytesHex(bytes){return [...bytes].map(x=>`0x${x.toString(16).toUpperCase().padStart(2,'0')}`);}
function similarity(a,b){let equal=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]===b[i])equal++;return equal;}

const [romPath]=process.argv.slice(2);
if(!romPath){console.error('Usage: node scripts/inspect-brazil-pre-mirror-plus.mjs <clean-plus.sfc>');process.exit(2);}
const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});

const team=30;
const mains=[];
for(let player=0;player<=2;player++){
  const off=playerOffset(team,player);
  const data=base.slice(off,off+7);
  mains.push({player,offset:off,offsetHex:hex(off),bytes:[...data],bytesHex:bytesHex(data)});
}
const knownP2=knownMirrorOffset(team,2);
const scanStart=knownP2-14;
const scanEnd=knownP2;
const candidates=[];
for(let off=scanStart;off+7<=scanEnd;off++){
  const data=base.slice(off,off+7);
  candidates.push({
    offset:off,
    offsetHex:hex(off),
    bytes:[...data],
    bytesHex:bytesHex(data),
    similarities:mains.map(m=>({player:m.player,equalBytePositions:similarity(data,m.bytes)})),
  });
}
console.log(JSON.stringify({
  mode:'inspect-brazil-pre-mirror',
  team,
  knownPlayer2Mirror:{offset:knownP2,offsetHex:hex(knownP2)},
  scan:{start:scanStart,startHex:hex(scanStart),endExclusive:scanEnd,endExclusiveHex:hex(scanEnd)},
  mains,
  candidates,
},null,2));
