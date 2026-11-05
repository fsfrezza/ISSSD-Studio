import test from 'node:test';
import assert from 'node:assert/strict';
import {repairGhanaPlayerName} from '../scripts/repair-ghana-player-name.mjs';
import {decodeFixedPlayerName} from '../src/core/plus-player-name.mjs';
test('repairs Ghana only, preserving attributes and Brazilian Pele',()=>{
 const custom={name:"Pele'",nameHex:'77868D8600000000',skills:{speed:7},number:8};
 const project={state:{semantic:{teamsV1:{teams:{46:{players:[{playerId:'46:8',baseSlot:8,custom}]},30:{players:[{custom:{name:"Pele'"}}]}}}}}};
 const before=structuredClone(project);
 assert.equal(repairGhanaPlayerName(project),true);
 assert.equal(custom.name,'Abedi P.');
 assert.equal(decodeFixedPlayerName(Uint8Array.from(Buffer.from(custom.nameHex,'hex'))),'Abedi P.');
 before.state.semantic.teamsV1.teams[46].players[0].custom.name=custom.name;
 before.state.semantic.teamsV1.teams[46].players[0].custom.nameHex=custom.nameHex;
 assert.deepEqual(project,before);
 assert.equal(repairGhanaPlayerName(project),false);
});
