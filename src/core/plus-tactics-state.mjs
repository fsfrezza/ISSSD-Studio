const MIN_COORD=-39,MAX_COORD=39;

function int(value,label){
  const n=Number(value);
  if(!Number.isInteger(n))throw new TypeError(label+' must be an integer');
  return n;
}

function clone(value){return value==null?null:structuredClone(value)}

function normalizePlayer(player,index){
  if(!player||typeof player!=='object'||Array.isArray(player))throw new TypeError('tactical player must be an object');
  const rosterSlot=int(player.rosterSlot ?? player.slot,'rosterSlot');
  if(rosterSlot<1||rosterSlot>20)throw new RangeError('rosterSlot must be 1..20');
  const x=int(player.x,'x'),y=int(player.y,'y');
  if(x<MIN_COORD||x>MAX_COORD||y<MIN_COORD||y>MAX_COORD)throw new RangeError('tactical coordinate must be -39..39');
  return {
    index:Number.isInteger(Number(player.index))?Number(player.index):index,
    rosterSlot,
    ...(player.name!=null?{name:String(player.name)}:{}),
    ...(Number.isInteger(Number(player.number))?{number:Number(player.number)}:{}),
    x,y,
    ...(player.className!=null?{className:String(player.className)}:{}),
    attack:!!player.attack,
  };
}

export function canonicalizePlusTacticsState(input){
  if(input==null)return {schema:'isssd-plus-tactics-v1',version:1,teams:{}};
  if(typeof input!=='object'||Array.isArray(input))throw new TypeError('Plus tactics state must be an object');
  const teams=input.teams??{};
  if(typeof teams!=='object'||Array.isArray(teams))throw new TypeError('Plus tactics teams must be an object');
  const out={schema:'isssd-plus-tactics-v1',version:1,teams:{}};
  for(const key of Object.keys(teams).sort((a,b)=>Number(a)-Number(b))){
    const source=teams[key];
    if(!source||typeof source!=='object'||Array.isArray(source))continue;
    const teamId=int(source.teamId??key,'teamId');
    if(teamId<0||teamId>=56)throw new RangeError('teamId must be 0..55');
    const formationIndex=source.formationIndex==null?null:int(source.formationIndex,'formationIndex');
    const players=Array.isArray(source.players)?source.players.map(normalizePlayer):[];
    out.teams[String(teamId)]={
      teamId,
      ...(formationIndex==null?{}:{formationIndex}),
      ...(source.formationLabel!=null?{formationLabel:String(source.formationLabel)}:{}),
      players,
      ...(source.custom!=null?{custom:!!source.custom}:{}),
      ...(source.customState!=null?{customState:clone(source.customState)}:{}),
    };
  }
  return out;
}
