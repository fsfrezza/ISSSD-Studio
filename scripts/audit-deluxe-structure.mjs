// Read-only inventory. No Plus patches are applied to the Deluxe ROM.
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {identifyDeluxe,splitRom} from '../src/core/deluxe-project.mjs';
import {PLUS_BASELINE} from '../src/core/plus-baseline.mjs';
import {readDeluxeGroups,DELUXE_TO_PLUS_TEAM} from '../src/core/deluxe-groups.mjs';
import {readPlusGroups} from '../src/core/plus-groups.mjs';
const [deluxePath,plusPath]=process.argv.slice(2);if(!deluxePath||!plusPath)throw Error('Uso: node scripts/audit-deluxe-structure.mjs Deluxe.smc Plus.sfc');
const deluxeFile=new Uint8Array(fs.readFileSync(deluxePath)),plusFile=new Uint8Array(fs.readFileSync(plusPath));await identifyDeluxe(deluxeFile);
const d=splitRom(deluxeFile).rom,p=splitRom(plusFile).rom;if(createHash('sha256').update(p).digest('hex')!==PLUS_BASELINE.sha256)throw Error('Referência Plus incompatível');
const hex=a=>Buffer.from(a).toString('hex'),consumers=[0x2aea1,0x2aef2,0x2af4a,0x2af7d,0x2af87].map(pc=>({pc,deluxe:hex(d.slice(pc,pc+3)),plus:hex(p.slice(pc,pc+3)),confirmed:d[pc]===0xbd&&d[pc+1]===0x3f&&d[pc+2]===0xda&&p[pc]===0xbd&&p[pc+1]===0xf2&&p[pc+2]===0xe7}));
const report={schema:'isssd-deluxe-structure-audit-v1',scope:'Static inventory only; runtime expansion remains unimplemented',deluxe:{normalTeams:36,specialCarriers:6,normalGroups:6,groupTable:0xda3f,groups:readDeluxeGroups(d),attributeBank:0x50000,nameBank:0x30000},plus:{normalTeams:54,otherCarriers:2,normalGroups:9,groupTable:0xe7f2,groups:readPlusGroups(p),attributeBank:0x150000,nameBank:0x170000},countryCorrespondence:DELUXE_TO_PLUS_TEAM,groupConsumers:consumers,pending:['Page navigation and group title tables','Native vs expanded normal/special team boundaries','All selection, match, palette, kit, flag and name consumers','Relocation of original assets occupying the target Plus data banks','Independent roster/name/tactics capacity and collision checks','Editor/project shared expansion writer and emulator validation']};
if(consumers.some(c=>!c.confirmed))throw Error('Consumidor de grupos divergente');console.log(JSON.stringify(report,null,2));
