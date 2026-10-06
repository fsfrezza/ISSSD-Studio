import {resolvePlusTacticalRecord} from './plus-tactics-address.mjs';
import {encodePlusTacticalRecord} from './plus-tactics-record.mjs';

function tacticalUsers(rom,targetPc){
  const users=[];
  for(let team=0;team<56;team++){
    const rec=resolvePlusTacticalRecord(rom,team);
    if(rec&&rec.recordPc===targetPc)users.push(team);
  }
  return users;
}

export function plusTacticsWriter(rom,state={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  const tactics=state?.plusTactics;
  if(tactics==null)return rom;
  if(typeof tactics!=='object'||Array.isArray(tactics))throw new TypeError('plusTactics must be an object');
  const teams=tactics.teams??{};
  if(typeof teams!=='object'||Array.isArray(teams))throw new TypeError('plusTactics teams must be an object');

  for(const key of Object.keys(teams).sort((a,b)=>Number(a)-Number(b))){
    const teamState=teams[key];
    const team=Number(teamState?.teamId??key);
    if(!Number.isInteger(team)||team<0||team>=56)throw new RangeError('tactical team must be 0..55');
    const rec=resolvePlusTacticalRecord(rom,team);
    if(!rec)throw new Error(`Plus tactical record could not be resolved for team ${team}`);
    const users=tacticalUsers(rom,rec.recordPc);
    if(users.length!==1||users[0]!==team){
      throw new Error(`Plus tactical record for team ${team} is shared by teams ${users.join(', ')}`);
    }
    const encoded=encodePlusTacticalRecord(rec.raw,teamState);
    for(let i=0;i<encoded.length;i++)if(encoded[i]!==rec.raw[i])rom[rec.recordPc+i]=encoded[i];
  }
  return rom;
}
