export const PLUS_GROUP_SCHEMA='isssd-plus-groups-v1';
export const PLUS_GROUP_VERSION=1;
export const PLUS_GROUP_TABLE_BASE=0x00E7F2;
export const PLUS_SECRET_GROUP_BASE=0x00E828;
export const PLUS_SECRET_TERMINATOR=0x00E82E;
export const PLUS_SECRET_GROUP_COUNT=0x00E82F;
export const PLUS_GROUP_EMPTY=0x70;
export const PLUS_GROUP_LOGICAL_TO_PHYSICAL=Object.freeze([6,7,8,0,1,2,3,4,5]);
export const PLUS_GROUP_LABELS=Object.freeze([
  'AMERICA 1','AMERICA 2','AMERICA 3','EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA','AFRICA','ALL STARS'
]);
export const PLUS_GROUP_ORDER_CONVENTION='issd-plus-logical-v2';
export const PLUS_TEAM_INDEX_CONVENTION='issd-plus-original-v1';
export const PLUS_GROUP_TEAM_COUNT=56;

export const PLUS_GROUP_PHYSICAL_TO_LOGICAL=Object.freeze((()=>{
  const out=Array(9).fill(0);
  PLUS_GROUP_LOGICAL_TO_PHYSICAL.forEach((physical,logical)=>out[physical]=logical);
  return out;
})());

function assertRom(rom){if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');}
function assertBounds(rom,offset,length,name){if(offset<0||offset+length>rom.length)throw new RangeError(name+' outside ROM');}

export function decodePlusGroupByte(value,{empty=PLUS_GROUP_EMPTY}={}){
  const byte=Number(value);
  if(!Number.isInteger(byte)||byte<0||byte>0xFF)throw new RangeError('group byte must be 0..255');
  if(byte===empty)return null;
  if(byte&1)throw new RangeError('Plus group team byte must be even');
  const team=byte>>1;
  if(team<0||team>=PLUS_GROUP_TEAM_COUNT)throw new RangeError('Plus group team id outside 0..55');
  return team;
}

export function encodePlusGroupTeam(value,{empty=PLUS_GROUP_EMPTY}={}){
  if(value===null||value===undefined||value===-1)return empty;
  const team=Number(value);
  if(!Number.isInteger(team)||team<0||team>=PLUS_GROUP_TEAM_COUNT)throw new RangeError('Plus group team id must be 0..55 or null');
  return team*2;
}

function canonicalizeGroup(group,label){
  if(!Array.isArray(group)||group.length!==6)throw new TypeError(label+' must contain exactly 6 slots');
  const out=group.map(value=>value===null||value===undefined||value===-1?null:Number(value));
  for(const value of out){
    if(value===null)continue;
    if(!Number.isInteger(value)||value<0||value>=PLUS_GROUP_TEAM_COUNT)throw new RangeError(label+' team id must be 0..55 or null');
  }
  if(!out.some(value=>value!==null))throw new RangeError(label+' must contain at least one team');
  return out;
}

export function validatePlusGroups(value){
  const state=canonicalizePlusGroupsState(value);
  const used=[];
  for(const group of state.groups)for(const value of group)if(value!==null)used.push(value);
  for(const value of state.secret)if(value!==null)used.push(value);
  return {
    counts:state.groups.map(group=>group.filter(value=>value!==null).length),
    secretCount:state.secret.filter(value=>value!==null).length,
    duplicates:[...new Set(used.filter((value,index)=>used.indexOf(value)!==index))],
  };
}

export function canonicalizePlusGroupsState(value){
  if(value===undefined||value===null)return null;
  if(typeof value!=='object'||Array.isArray(value))throw new TypeError('Plus groups state must be an object');
  if(value.schema&&value.schema!==PLUS_GROUP_SCHEMA)throw new TypeError('Unsupported Plus groups schema');
  if(value.version!==undefined&&Number(value.version)!==PLUS_GROUP_VERSION)throw new TypeError('Unsupported Plus groups version');
  if(value.groupOrderConvention&&value.groupOrderConvention!==PLUS_GROUP_ORDER_CONVENTION)throw new TypeError('Unsupported Plus groups order convention');
  if(value.teamIndexConvention&&value.teamIndexConvention!==PLUS_TEAM_INDEX_CONVENTION)throw new TypeError('Unsupported Plus team index convention');
  if(!Array.isArray(value.groups)||value.groups.length!==9)throw new TypeError('Plus groups state must contain 9 normal groups');
  const groups=value.groups.map((group,index)=>canonicalizeGroup(group,'Plus group '+(index+1)));
  const secret=canonicalizeGroup(value.secret,'Plus secret group');
  const labels=Array.from({length:10},(_,index)=>String(value.labels?.[index]??PLUS_GROUP_LABELS[index]));
  return {
    schema:PLUS_GROUP_SCHEMA,
    version:PLUS_GROUP_VERSION,
    teamIndexConvention:PLUS_TEAM_INDEX_CONVENTION,
    groupOrderConvention:PLUS_GROUP_ORDER_CONVENTION,
    labels,
    groups,
    secret,
  };
}

export function readPlusGroups(rom){
  assertRom(rom);
  assertBounds(rom,PLUS_GROUP_TABLE_BASE,54,'Plus group table');
  assertBounds(rom,PLUS_SECRET_GROUP_BASE,6,'Plus secret group');
  assertBounds(rom,PLUS_SECRET_GROUP_COUNT,1,'Plus secret group count');
  const groups=[];
  for(let logical=0;logical<9;logical++){
    const physical=PLUS_GROUP_LOGICAL_TO_PHYSICAL[logical],offset=PLUS_GROUP_TABLE_BASE+physical*6;
    groups.push(Array.from({length:6},(_,slot)=>decodePlusGroupByte(rom[offset+slot])));
  }
  const secret=Array.from({length:6},(_,slot)=>decodePlusGroupByte(rom[PLUS_SECRET_GROUP_BASE+slot]));
  return {
    schema:PLUS_GROUP_SCHEMA,
    version:PLUS_GROUP_VERSION,
    teamIndexConvention:PLUS_TEAM_INDEX_CONVENTION,
    groupOrderConvention:PLUS_GROUP_ORDER_CONVENTION,
    labels:[...PLUS_GROUP_LABELS],
    groups,
    secret,
    rawSecretCounter:rom[PLUS_SECRET_GROUP_COUNT],
  };
}

export function encodePlusGroupsNative(value){
  const state=canonicalizePlusGroupsState(value);
  if(!state)throw new TypeError('Plus groups state required');
  const normal=new Uint8Array(54);normal.fill(PLUS_GROUP_EMPTY);
  for(let logical=0;logical<9;logical++){
    const physical=PLUS_GROUP_LOGICAL_TO_PHYSICAL[logical];
    for(let slot=0;slot<6;slot++)normal[physical*6+slot]=encodePlusGroupTeam(state.groups[logical][slot]);
  }
  const secret=Uint8Array.from(state.secret.map(encodePlusGroupTeam));
  const secretCount=Math.max(1,state.secret.filter(value=>value!==null).length);
  return {state,normal,secret,terminator:PLUS_GROUP_EMPTY,secretCount};
}

export function plusGroupsWriter(rom,state={}){
  assertRom(rom);
  const value=state?.plusGroups;
  if(value===undefined||value===null)return rom;
  assertBounds(rom,PLUS_GROUP_TABLE_BASE,54,'Plus group table');
  assertBounds(rom,PLUS_SECRET_GROUP_COUNT,1,'Plus secret group count');
  const encoded=encodePlusGroupsNative(value);
  rom.set(encoded.normal,PLUS_GROUP_TABLE_BASE);
  rom.set(encoded.secret,PLUS_SECRET_GROUP_BASE);
  rom[PLUS_SECRET_TERMINATOR]=encoded.terminator;
  rom[PLUS_SECRET_GROUP_COUNT]=encoded.secretCount;
  return rom;
}
