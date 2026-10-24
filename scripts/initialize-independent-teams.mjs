import{editIndependentFlag}from'../src/core/independent-team-fields.mjs';
import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{buildPlusProjectRom}from'../src/core/project-build.mjs';
import{createIndependentTeams,independentTeamLabelsNeedRecovery}from'../src/core/independent-teams.mjs';
import{readPlusGroupIdentity}from'../src/core/plus-group-identity.mjs';
export function initializeIndependentTeams(base,project){
 const out=structuredClone(project);out.state??={};out.state.semantic??={};if(out.state.semantic.independentTeamsV1)throw Error('Projeto já contém as seis equipes GG; suas edições foram preservadas.');
 const source=structuredClone(project);if(independentTeamLabelsNeedRecovery(source))source.state.ui.teamNames=source.state.ui.teamNames.slice(0,56);
 const rom=buildPlusProjectRom(base,source,{forceTacticalInfrastructure:true}).rom;
 out.state.semantic.independentTeamsV1=createIndependentTeams(rom);
 const refs=JSON.parse(fs.readFileSync(new URL('../assets/team-flags/gg-flags.json',import.meta.url),'utf8'));
 for(const[id,ref]of Object.entries(refs.teams)){let t=out.state.semantic.independentTeamsV1.teams[id];t=editIndependentFlag(editIndependentFlag(t,ref.pixels,'selectionFlags'),ref.pixels,'fieldFlags');t.data.palettes.fieldFlag=[7,0,...ref.colorsBgr555.flatMap(c=>[c&255,c>>8])];out.state.semantic.independentTeamsV1.teams[id]=t;}
 out.state.ui??={};out.state.ui.teamNames=[...(project.state.ui?.teamNames??[]).slice(0,54),...Object.values(out.state.semantic.independentTeamsV1.teams).map(t=>t.name)];
 const groups=out.state.semantic.plusGroups??readPlusGroupIdentity(base);groups.secret=[54,55,56,57,58,59];groups.labels??=['AMERICA 1','AMERICA 2','AMERICA 3','EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA','AFRICA','GG'];groups.labels[9]='GG';out.state.semantic.plusGroups=groups;return out;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const[rom,file]=process.argv.slice(2);if(!rom||!file)throw Error('Uso: node scripts/initialize-independent-teams.mjs ROM projeto.issdproj');const value=initializeIndependentTeams(new Uint8Array(fs.readFileSync(rom)),JSON.parse(fs.readFileSync(file,'utf8')));fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');console.log('Seis equipes GG criadas como cópias independentes no projeto.');
}
