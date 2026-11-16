// Exact reachable helper from PB9T's 84:FFB3, relocated to 84:FFDB so the
// existing Plus penalty-input helper at 84:FFC0 remains independent.
// This is deliberately not registered as a confirmed gameplay improvement.
export const PB9T_REPLAY_CANDIDATE=Uint8Array.from('ad2a00890080f007892000d012800dad2800890080f008892000d0039d8e00a0240060'.match(/../g),v=>parseInt(v,16));
export function applyPB9TReplayCandidate(input,base){
 const site=0x26a1c,slot=0x27fdb,expected=[0xa0,0x24,0];
 if(expected.some((v,i)=>base[site+i]!==v||input[site+i]!==v)||input.slice(slot,slot+PB9T_REPLAY_CANDIDATE.length).some(v=>v!==255))throw Error('PB9T: rotina ou reserva incompatível');
 const out=input.slice();out.set([0x20,0xdb,0xff],site);out.set(PB9T_REPLAY_CANDIDATE,slot);return out;
}
