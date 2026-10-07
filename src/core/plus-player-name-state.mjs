import {
  PLUS_NAME_LENGTH,
  decodeFixedPlayerName,
  inferPlayerNameAlignment,
  normalizePlayerName,
} from './plus-player-name.mjs';

function bytesFromNameHex(value){
  const hex=String(value??'').trim();
  if(!/^[0-9a-f]{16}$/i.test(hex))throw new TypeError('nameHex must contain exactly 16 hexadecimal characters');
  const out=new Uint8Array(PLUS_NAME_LENGTH);
  for(let i=0;i<PLUS_NAME_LENGTH;i++)out[i]=Number.parseInt(hex.slice(i*2,i*2+2),16);
  return out;
}

function editFromLegacyPlayer(team,player,state){
  if(state?.nameHex!=null){
    const fixed=decodeFixedPlayerName(bytesFromNameHex(state.nameHex));
    const alignment=inferPlayerNameAlignment(fixed);
    const edit={team,player,name:fixed.trim(),alignment};
    if(alignment==='manual')edit.manualFixed=fixed;
    return edit;
  }
  if(state?.name!=null){
    return {team,player,name:normalizePlayerName(state.name),alignment:'left'};
  }
  throw new TypeError('legacy player name is missing nameHex/name');
}

export function migrateLegacyPlayerNames(namesV1){
  const cloned=namesV1==null?namesV1:structuredClone(namesV1);
  const edits=[],quarantined=[];
  if(!cloned||typeof cloned!=='object'||Array.isArray(cloned))return {handled:false,namesV1:cloned,edits,quarantined};
  if(cloned.schema!=='isssd-name-roster-v1'||Number(cloned.version)!==1||cloned.mode!=='names-only'){
    return {handled:false,namesV1:cloned,edits,quarantined};
  }
  const teams=cloned.teams;
  if(!teams||typeof teams!=='object'||Array.isArray(teams))return {handled:false,namesV1:cloned,edits,quarantined};

  for(const key of Object.keys(teams).sort((a,b)=>Number(a)-Number(b))){
    const teamState=teams[key];
    if(!teamState||!Array.isArray(teamState.players))continue;
    const team=Number(teamState.teamId??key);
    for(const playerState of teamState.players){
      const slot=Number(playerState?.slot),player=slot-1;
      try{
        if(!Number.isInteger(team)||team<0||team>=56)throw new RangeError('team must be 0..55');
        if(!Number.isInteger(slot)||slot<1||slot>20)throw new RangeError('player slot must be 1..20');
        edits.push(editFromLegacyPlayer(team,player,playerState));
      }catch(error){
        quarantined.push({
          team:Number.isInteger(team)?team:null,
          player:Number.isInteger(player)?player:null,
          name:playerState?.name==null?null:String(playerState.name),
          nameHex:playerState?.nameHex==null?null:String(playerState.nameHex),
          reason:error instanceof Error?error.message:String(error),
        });
      }
    }
  }
  return {handled:true,namesV1:cloned,edits,quarantined};
}
