import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const projectPath=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
if(!fs.existsSync(projectPath))throw new Error('Projeto canônico Plus não encontrado: '+projectPath);

const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
if(project?.base?.profile!=='iss-deluxe-plus')throw new Error('O projeto canônico não é do perfil iss-deluxe-plus.');
project.state=project.state||{};
project.state.semantic=project.state.semantic||{};
project.state.semantic.plusPreparationV1={
 schema:'isssd-plus-preparation-v1',
 version:1,
 expanded4MiB:true,
 bodyLength:0x400000,
 expansionMode:4,
 tacticsIndividualized:true
};
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n','utf8');
console.log('Projeto Plus: expansão para 4 MiB e individualização de táticas registradas em state.semantic.plusPreparationV1.');
