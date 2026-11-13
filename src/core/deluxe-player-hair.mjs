import {deluxePlayerOffsets} from './deluxe-players.mjs';
import {plusBaldPlayerBaseWriter,baldBaseSupported} from './plus-bald-player-base.mjs';
// The atlas depends only on native graphics, not team indices or player data.
// Cache it once; the Deluxe writer owns roster values and never uses Plus offsets.
let cachedWrites;
export function applyDeluxePlayerHair(input,base,project,playerBase=base){
 if(!project.changes.teamVisuals&&!Object.values(project.changes.players??{}).some(p=>p.appearance))return input;
 if(!baldBaseSupported(base))throw Error('Aparência: gráficos Deluxe incompatíveis com o modelo Plus');
 if(!cachedWrites){const rom=new Uint8Array(0x400000).fill(255);rom.set(base);plusBaldPlayerBaseWriter(rom,{},base);const ranges=[];let at=0;while(at<rom.length){if(rom[at]===(base[at]??255)){at++;continue;}const start=at;while(at<rom.length&&rom[at]!== (base[at]??255))at++;ranges.push([start,rom.slice(start,at)]);}cachedWrites=ranges;}
 const out=new Uint8Array(0x400000).fill(255);out.set(input);if(!project.changes.teamVisuals)for(let t=0;t<(project.changes.structure?.teams.length??36);t++)for(let p=0;p<20;p++){if(p===0||p===11)continue;const at=deluxePlayerOffsets(playerBase,t,p).record+6;if(!(out[at]&15)&&project.changes.players?.[t+':'+p]?.appearance?.hair!==0)out[at]|=14;}for(const[at,bytes]of cachedWrites){for(let i=0;i<bytes.length;i++)if(out[at+i]!== (base[at+i]??255)&&out[at+i]!==bytes[i])throw Error('Aparência: espaço ocupado em 0x'+(at+i).toString(16));out.set(bytes,at);}out[0x7fd7]=12;return out;
}
