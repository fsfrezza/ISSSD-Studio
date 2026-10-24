import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {editIndependentFlag} from '../src/core/independent-team-fields.mjs';
import {validateIndependentTeams} from '../src/core/independent-teams.mjs';
// Explicit migration only: opening a project never replaces the user's edited flags.
const path=process.argv[2]??fileURLToPath(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',import.meta.url));
const project=JSON.parse(fs.readFileSync(path,'utf8'));
const refs=JSON.parse(fs.readFileSync(new URL('../assets/team-flags/gg-flags.json',import.meta.url),'utf8'));
const model=validateIndependentTeams(project.state.semantic.independentTeamsV1);
for(const[id,flag]of Object.entries(refs.teams)){
 let team=editIndependentFlag(model.teams[id],flag.pixels,'selectionFlags');
 team=editIndependentFlag(team,flag.pixels,'fieldFlags');
 team.data.palettes.fieldFlag=[7,0,...flag.colorsBgr555.flatMap(c=>[c&255,c>>8])];
 model.teams[id]=team;
}
project.state.semantic.independentTeamsV1=validateIndependentTeams(model);
fs.writeFileSync(path,JSON.stringify(project,null,2)+'\n');
console.log('Six GG reference flags embedded in project: selection and match, 24 × 16, 4bpp.');
