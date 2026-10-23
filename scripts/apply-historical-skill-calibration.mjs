import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
import{applyHistoricalSkillCalibration}from'../src/core/historical-skills.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),arg=process.argv.indexOf('--project');
const target=arg>=0?path.resolve(process.argv[arg+1]):path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'project-data/historical-skill-calibration.json'),'utf8')),project=JSON.parse(fs.readFileSync(target,'utf8'));
const next=applyHistoricalSkillCalibration(project,catalog);next.savedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(next,null,2)+'\n');console.log('Skills individuais aplicados a '+catalog.players.length+' jogadores; notas revisadas e equipes especiais preservadas.');
