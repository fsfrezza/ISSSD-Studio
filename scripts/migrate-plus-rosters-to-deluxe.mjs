import fs from 'node:fs';import {migratePlusRostersToDeluxe} from '../src/core/deluxe-roster-migration.mjs';
const [deluxeRom,plusRom,plusProject,deluxeProject,output,...backups]=process.argv.slice(2);if(!output)throw Error('Uso: node scripts/migrate-plus-rosters-to-deluxe.mjs Deluxe.smc Plus.sfc Plus.issdproj Deluxe.issdproj Saida.issdproj');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const {project,report}=await migratePlusRostersToDeluxe(new Uint8Array(fs.readFileSync(deluxeRom)),new Uint8Array(fs.readFileSync(plusRom)),read(plusProject),read(deluxeProject),{fallbackProjects:backups.map(read)});
fs.writeFileSync(output,JSON.stringify(project,null,2)+'\n');console.log(JSON.stringify(report,null,2));
