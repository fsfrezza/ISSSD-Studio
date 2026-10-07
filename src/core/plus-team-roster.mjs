import {PLUS,playerOffset,decodePlayerRecord} from './plus-player.mjs';

function requireTeam(team){
  if(!Number.isInteger(team)||team<0||team>=PLUS.teams)throw new RangeError('team must be 0..55');
  return team;
}
function requirePlayer(player){
  if(!Number.isInteger(player)||player<0||player>=PLUS.playersPerTeam)throw new RangeError('player must be 0..19');
  return player;
}
function requireJersey(jersey){
  if(!Number.isInteger(jersey)||jersey<1||jersey>20)throw new RangeError('jersey must be 1..20');
  return jersey;
}

export function readPlusTeamJerseys(rom,team){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  requireTeam(team);
  return Array.from({length:PLUS.playersPerTeam},(_,player)=>{
    const off=playerOffset(team,player);
    if(off+PLUS.recordSize>rom.length)throw new RangeError('player record outside ROM');
    return decodePlayerRecord(rom.slice(off,off+PLUS.recordSize)).jersey;
  });
}

export function validatePlusTeamJerseyPermutation(jerseys){
  if(!Array.isArray(jerseys)||jerseys.length!==PLUS.playersPerTeam)return false;
  const seen=new Set();
  for(const jersey of jerseys){
    if(!Number.isInteger(jersey)||jersey<1||jersey>20||seen.has(jersey))return false;
    seen.add(jersey);
  }
  return seen.size===20;
}

export function planPlusJerseySwap(rom,{team,player,jersey}={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  requireTeam(team);requirePlayer(player);requireJersey(jersey);
  const jerseys=readPlusTeamJerseys(rom,team);
  const oldJersey=jerseys[player];
  if(oldJersey===jersey)return [];
  const otherPlayer=jerseys.findIndex((value,index)=>index!==player&&value===jersey);
  const edits=[{team,player,jersey}];
  if(otherPlayer>=0&&oldJersey>=1&&oldJersey<=20){
    edits.push({team,player:otherPlayer,jersey:oldJersey});
  }
  return edits;
}

export function planPlusTeamJerseyAssignment(team,jerseys){
  requireTeam(team);
  if(!validatePlusTeamJerseyPermutation(jerseys))throw new RangeError('team jerseys must be a unique permutation of 1..20');
  return jerseys.map((jersey,player)=>({team,player,jersey}));
}

function tacticalIdentity(player,index){
  if(!player||typeof player!=='object'||Array.isArray(player))throw new TypeError(`tactical player ${index} must be an object`);
  return Number(player.rosterSlot??player.slot);
}

export function swapPlusStarterTacticalAssignments(teamState,rosterSlotA,rosterSlotB){
  if(!teamState||typeof teamState!=='object'||Array.isArray(teamState))throw new TypeError('team tactical state required');
  if(!Number.isInteger(rosterSlotA)||rosterSlotA<2||rosterSlotA>11)throw new RangeError('outfield starter slot A must be 2..11');
  if(!Number.isInteger(rosterSlotB)||rosterSlotB<2||rosterSlotB>11)throw new RangeError('outfield starter slot B must be 2..11');
  if(rosterSlotA===rosterSlotB)return structuredClone(teamState);
  if(!Array.isArray(teamState.players))throw new TypeError('team tactical players must be an array');

  const out=structuredClone(teamState);
  const ia=out.players.findIndex((player,index)=>tacticalIdentity(player,index)===rosterSlotA);
  const ib=out.players.findIndex((player,index)=>tacticalIdentity(player,index)===rosterSlotB);
  if(ia<0||ib<0)throw new Error('both starter roster slots must have tactical assignments');

  const fields=['x','y','className','attack'];
  const a={},b={};
  for(const field of fields){a[field]=out.players[ia][field];b[field]=out.players[ib][field];}
  for(const field of fields){out.players[ia][field]=b[field];out.players[ib][field]=a[field];}
  return out;
}
