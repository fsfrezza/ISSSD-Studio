import {decodePlayerRecord} from './plus-player.mjs';

const SKILLS=['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'];

function bytesFromAttrHex(value){
  const hex=String(value??'').trim();
  if(!/^[0-9a-f]{14}$/i.test(hex))throw new TypeError('attrHex must contain exactly 14 hexadecimal characters');
  const out=new Uint8Array(7);
  for(let i=0;i<7;i++)out[i]=Number.parseInt(hex.slice(i*2,i*2+2),16);
  return out;
}

function canonicalEdit(team,player,attrHex){
  const decoded=decodePlayerRecord(bytesFromAttrHex(attrHex));
  const skills={};
  for(const field of SKILLS){
    const raw=decoded[field];
    if(!Number.isInteger(raw)||raw<0||raw>9)throw new RangeError('legacy player skill nibble must be 0..9');
    skills[field]=raw+1;
  }
  if(!Number.isInteger(decoded.naturalPosition)||decoded.naturalPosition<0||decoded.naturalPosition>6){
    throw new RangeError('legacy player natural position must be 0..6');
  }
  if(!Number.isInteger(decoded.jersey)||decoded.jersey<1||decoded.jersey>20){
    throw new RangeError('legacy player jersey must be 1..20');
  }
  return {
    team,player,skills,
    naturalPosition:decoded.naturalPosition,
    jersey:decoded.jersey,
    // Opaque metadata only. plusPlayerWriter deliberately ignores this field
    // until appearance byte semantics are independently validated.
    appearanceRaw:decoded.appearanceRaw,
  };
}

export function migrateLegacyPlayerAttributes(teamsV1){
  const cloned=teamsV1==null?teamsV1:structuredClone(teamsV1);
  const edits=[],quarantined=[];
  const teams=cloned?.names?.teams;
  if(!teams||typeof teams!=='object'||Array.isArray(teams))return {teamsV1:cloned,edits,quarantined};

  for(const key of Object.keys(teams).sort((a,b)=>Number(a)-Number(b))){
    const teamState=teams[key];
    if(!teamState||!Array.isArray(teamState.players))continue;
    const team=Number(teamState.teamId??key);
    for(const playerState of teamState.players){
      if(!playerState||playerState.attrHex==null)continue;
      const slot=Number(playerState.slot),player=slot-1,attrHex=playerState.attrHex;
      delete playerState.attrHex;
      try{
        if(!Number.isInteger(team)||team<0||team>=56)throw new RangeError('team must be 0..55');
        if(!Number.isInteger(slot)||slot<1||slot>20)throw new RangeError('player slot must be 1..20');
        edits.push(canonicalEdit(team,player,attrHex));
      }catch(error){
        quarantined.push({
          team:Number.isInteger(team)?team:null,
          player:Number.isInteger(player)?player:null,
          attrHex:String(attrHex),
          reason:error instanceof Error?error.message:String(error),
        });
      }
    }
  }
  return {teamsV1:cloned,edits,quarantined};
}
