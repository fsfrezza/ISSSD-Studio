import fs from'node:fs';
import{fileURLToPath}from'node:url';
import{buildPlusProjectRom}from'../src/core/project-build.mjs';
import{createIndependentTeams}from'../src/core/independent-teams.mjs';
import{readPlusGroupIdentity}from'../src/core/plus-group-identity.mjs';
export function initializeIndependentTeams(base,project){
 const out=structuredClone(project);out.state??={};out.state.semantic??={};if(out.state.semantic.independentTeamsV1)throw Error('Projeto já contém as seis equipes GG; suas edições foram preservadas.');
 const rom=buildPlusProjectRom(base,project,{forceTacticalInfrastructure:true}).rom;
 out.state.semantic.independentTeamsV1=createIndependentTeams(rom);
 const groups=out.state.semantic.plusGroups??readPlusGroupIdentity(base);groups.secret=[54,55,56,57,58,59];groups.labels??=['AMERICA 1','AMERICA 2','AMERICA 3','EUROPE 1','EUROPE 2','EUROPE 3','EUROPE 4','ASIA','AFRICA','GG'];groups.labels[9]='GG';out.state.semantic.plusGroups=groups;return out;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const[rom,file]=process.argv.slice(2);if(!rom||!file)throw Error('Uso: node scripts/initialize-independent-teams.mjs ROM projeto.issdproj');const value=initializeIndependentTeams(new Uint8Array(fs.readFileSync(rom)),JSON.parse(fs.readFileSync(file,'utf8')));fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');console.log('Seis equipes GG criadas como cópias independentes no projeto.');
}
