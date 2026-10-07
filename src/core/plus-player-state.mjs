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
      const slot=Number(playerState.slot),player=slot-1,attrHex=String(playerState.attrHex);
      delete playerState.attrHex;
      quarantined.push({
        team:Number.isInteger(team)&&team>=0&&team<56?team:null,
        player:Number.isInteger(player)&&player>=0&&player<20?player:null,
        attrHex,
        reason:'legacy attrHex snapshot is non-authoritative and is not promoted to playerEdits',
      });
    }
  }
  return {teamsV1:cloned,edits,quarantined};
}
