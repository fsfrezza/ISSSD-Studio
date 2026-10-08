import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertPlusBaseDescriptor} from '../src/core/plus-baseline.mjs';
import {playerOffset} from '../src/core/plus-player.mjs';

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function hex(n,width=6){return `0x${Number(n).toString(16).toUpperCase().padStart(width,'0')}`;}
function byteHex(n){return `0x${Number(n).toString(16).toUpperCase().padStart(2,'0')}`;}
function sameAt(haystack,off,needle){for(let i=0;i<needle.length;i++)if(haystack[off+i]!==needle[i])return false;return true;}

const [romPath]=process.argv.slice(2);
if(!romPath){console.error('Usage: node scripts/inspect-player-tail-mirrors-plus.mjs <clean-plus.sfc>');process.exit(2);}
const base=Uint8Array.from(await readFile(romPath));
assertPlusBaseDescriptor({size:base.length,sha256:sha256(base)});

const PLAYER_BANK_START=0x150000;
const PLAYER_BANK_END=0x151EA0;
const matches=[];
for(let team=0;team<56;team++){
  for(let player=0;player<20;player++){
    const mainOff=playerOffset(team,player);
    const record=base.slice(mainOff,mainOff+7);
    const tail=record.slice(1);
    for(let off=0;off+6<=base.length;off++){
      if(off>=PLAYER_BANK_START-1 && off<PLAYER_BANK_END) continue;
      if(!sameAt(base,off,tail)) continue;
      const prefixOff=off-1;
      const prefix=prefixOff>=0?base[prefixOff]:null;
      matches.push({
        team,player,
        mainOffset:mainOff,mainOffsetHex:hex(mainOff),
        mainByte0:record[0],mainByte0Hex:byteHex(record[0]),
        tailOffset:off,tailOffsetHex:hex(off),
        prefixOffset:prefixOff,prefixOffsetHex:prefixOff>=0?hex(prefixOff):null,
        prefixByte:prefix,prefixByteHex:prefix==null?null:byteHex(prefix),
        xorWithMainByte0:prefix==null?null:(prefix^record[0]),
        xorWithMainByte0Hex:prefix==null?null:byteHex(prefix^record[0]),
        deltaFromMainByte0:prefix==null?null:prefix-record[0],
      });
    }
  }
}

const brazilPlayer1=matches.filter(m=>m.team===30&&m.player===1);
const lowRomMatches=matches.filter(m=>m.tailOffset<0x100000);
const transforms=new Map();
for(const m of lowRomMatches){
  const key=`${m.mainByte0Hex}->${m.prefixByteHex}`;
  transforms.set(key,(transforms.get(key)||0)+1);
}
const transformSummary=[...transforms.entries()].map(([transform,count])=>({transform,count})).sort((a,b)=>b.count-a.count||a.transform.localeCompare(b.transform));

console.log(JSON.stringify({
  mode:'inspect-player-tail-mirrors',
  playerBank:{startHex:hex(PLAYER_BANK_START),endExclusiveHex:hex(PLAYER_BANK_END)},
  totalExactTailMatchesOutsidePlayerBank:matches.length,
  lowRomExactTailMatches:lowRomMatches.length,
  brazilPlayer1,
  transformSummary:transformSummary.slice(0,50),
  nearbyLowRomMatches:lowRomMatches.filter(m=>m.tailOffset>=0x7800&&m.tailOffset<0x7A00),
},null,2));
