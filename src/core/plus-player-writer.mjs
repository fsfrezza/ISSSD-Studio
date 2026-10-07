import {
  playerOffset,decodePlayerRecord,writeSkill,writeNaturalPosition,writeJersey,surgicalWritesForRecord
} from './plus-player.mjs';
import {writePlusPlayerName} from './plus-player-name.mjs';

const SKILLS=['acceleration','speed','shot','curve','balance','intelligence','dribbling','jump','energy'];

function validateEdit(edit){
  if(!edit || !Number.isInteger(edit.team) || !Number.isInteger(edit.player)) throw new TypeError('player edit requires team and player');
  if(edit.skills!==undefined && (edit.skills===null || typeof edit.skills!=='object' || Array.isArray(edit.skills))) throw new TypeError('skills must be an object');
  if(edit.name!==undefined&&typeof edit.name!=='string')throw new TypeError('player name must be a string');
  return edit;
}

export function plusPlayerWriter(rom,state={}){
  if(!(rom instanceof Uint8Array)) throw new TypeError('Uint8Array ROM required');
  const edits=state.playerEdits ?? [];
  if(!Array.isArray(edits)) throw new TypeError('playerEdits must be an array');

  for(const rawEdit of edits){
    const edit=validateEdit(rawEdit);

    if(edit.name!==undefined){
      writePlusPlayerName(rom,{
        team:edit.team,
        player:edit.player,
        name:edit.name,
        alignment:edit.alignment,
        manualFixed:edit.manualFixed,
      });
    }

    const off=playerOffset(edit.team,edit.player);
    if(off+7>rom.length) throw new RangeError('player record outside ROM');
    const before=rom.slice(off,off+7);
    const after=before.slice();

    for(const field of SKILLS){
      if(edit.skills?.[field]!==undefined) writeSkill(after,field,edit.skills[field]);
    }
    if(edit.naturalPosition!==undefined) writeNaturalPosition(after,edit.naturalPosition);
    if(edit.jersey!==undefined) writeJersey(after,edit.jersey);

    // Appearance is intentionally not writable until byte 6 semantics are validated.
    const writes=surgicalWritesForRecord(edit.team,edit.player,before,after);
    for(const write of writes) rom[write.off]=write.value;
  }
  return rom;
}

export function readPlusPlayer(rom,team,player){
  const off=playerOffset(team,player);
  return decodePlayerRecord(rom.slice(off,off+7));
}
