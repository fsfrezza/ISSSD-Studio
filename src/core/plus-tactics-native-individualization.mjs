import {
  PLUS_TACTICAL_POINTER_TABLE_PC,
  PLUS_TACTICAL_RECORD_SIZE,
  resolvePlusTacticalRecord,
} from './plus-tactics-address.mjs';

// Verified free space in the original 2 MiB Deluxe Plus bank $8B.
// 0x5FE9F..0x5FEF8 is a 90-byte 0xFF run; two 31-byte tactical records fit
// without expanding the ROM or patching any runtime loader.
export const PLUS_TACTICAL_NATIVE_SLOTS=Object.freeze([0x5FE9F,0x5FEBE]);
const BANK_8B_PC_BASE=0x58000;

function usersOfRecord(rom,recordPc){
  const users=[];
  for(let team=0;team<56;team++){
    const rec=resolvePlusTacticalRecord(rom,team);
    if(rec?.recordPc===recordPc)users.push(team);
  }
  return users;
}

function pointerForPc(pc){
  const delta=pc-BANK_8B_PC_BASE;
  if(delta<0||delta>0x7FFF)throw new RangeError('native tactical slot is outside bank 8B');
  return 0x8000+delta;
}

function slotIsBlank(rom,pc){
  if(pc<0||pc+PLUS_TACTICAL_RECORD_SIZE>rom.length)return false;
  for(let i=0;i<PLUS_TACTICAL_RECORD_SIZE;i++)if(rom[pc+i]!==0xFF)return false;
  return true;
}

export function ensureExclusivePlusTacticalRecords(rom,teamIds,{slots=PLUS_TACTICAL_NATIVE_SLOTS}={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  if(rom.length!==0x200000)throw new RangeError('native tactical individualization requires canonical 2 MiB Plus ROM');
  const teams=[...new Set((teamIds||[]).map(Number))].sort((a,b)=>a-b);
  const allocations=[];
  const reserved=new Set();

  for(const team of teams){
    if(!Number.isInteger(team)||team<0||team>=56)throw new RangeError('tactical team must be 0..55');
    let rec=resolvePlusTacticalRecord(rom,team);
    if(!rec)throw new Error(`Plus tactical record could not be resolved for team ${team}`);
    let users=usersOfRecord(rom,rec.recordPc);
    if(users.length===1&&users[0]===team)continue;

    const targetPc=slots.find(pc=>!reserved.has(pc)&&slotIsBlank(rom,pc));
    if(targetPc==null)throw new Error(`no verified native tactical slot available for team ${team}`);
    const pointer=pointerForPc(targetPc);
    rom.set(rec.raw,targetPc);
    const pointerPc=PLUS_TACTICAL_POINTER_TABLE_PC+team*2;
    rom[pointerPc]=pointer&0xFF;
    rom[pointerPc+1]=(pointer>>>8)&0xFF;
    reserved.add(targetPc);

    const resolved=resolvePlusTacticalRecord(rom,team);
    users=resolved?usersOfRecord(rom,resolved.recordPc):[];
    if(!resolved||resolved.recordPc!==targetPc||users.length!==1||users[0]!==team){
      throw new Error(`failed to individualize native tactical record for team ${team}`);
    }
    allocations.push({team,fromPc:rec.recordPc,toPc:targetPc,pointer,previousUsers:usersOfRecordBefore(team,rec.recordPc)});
  }
  return {rom,allocations};

  function usersOfRecordBefore(currentTeam,recordPc){
    // The pointer for currentTeam has already moved. Reconstruct the previous user list
    // for diagnostics without mutating the ROM again.
    const remaining=usersOfRecord(rom,recordPc);
    return [...new Set([currentTeam,...remaining])].sort((a,b)=>a-b);
  }
}
