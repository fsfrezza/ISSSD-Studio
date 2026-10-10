import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const recovery=path.join(root,'project-recovery');
const output=path.join(root,'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
const force=process.argv.includes('--force');
const clone=v=>JSON.parse(JSON.stringify(v));

function readJoined(names){return names.map(n=>fs.readFileSync(path.join(recovery,n),'utf8').trim()).join('')}
function gunzipJson(names){return JSON.parse(zlib.gunzipSync(Buffer.from(readJoined(names),'base64')).toString('utf8'))}
function countTeams(project){return Object.keys(project?.state?.semantic?.teamsV1?.names?.teams||{}).length}
function countPlayers(project){return Object.values(project?.state?.semantic?.teamsV1?.names?.teams||{}).reduce((n,t)=>n+(t?.players?.length||0),0)}
function countAssets(project){return Object.keys(project?.state?.titleComposerV2?.assets||{}).length}
function structurallyGood(project){return countTeams(project)>=54&&countPlayers(project)>=1080&&countAssets(project)>=7}

if(fs.existsSync(output)&&!force){
 try{
  const current=JSON.parse(fs.readFileSync(output,'utf8'));
  if(structurallyGood(current)){
   console.log(`Projeto canônico já íntegro: ${countTeams(current)} equipes / ${countPlayers(current)} jogadores / ${countAssets(current)} assets.`);
   process.exit(0);
  }
 }catch(_){}
}

const project=gunzipJson(['skeleton.part1.b64']);
project.state.semantic.teamsV1=gunzipJson(['teamsv1.part1.b64','teamsv1.part2.b64','teamsv1.part3.b64']);

const ws=project.state.semantic.textWorkspaceV2;
if(!ws?.sections)throw new Error('Recuperação: textWorkspaceV2 ausente no skeleton.');
const sec=ws.sections;
const direct=sec.direct?.byProfile?.['iss-deluxe-plus']||(sec.direct.byProfile['iss-deluxe-plus']={});
Object.assign(direct,{friendly:'JOGATINA',friendlyDesc:'X1 maroto',league:'LIGA CURTA',leagueDesc:'Max: 6 jogadores',tournament:'TORNEIO CURTO',tournamentDesc:'Max: 8 jogadores'});
const menu=sec.mainMenu?.values||(sec.mainMenu={values:{}}).values;
Object.assign(menu,{openGame:'JOGATINA',scenario:'CENÁRIOS',championship:'CAMPEONATO',penalty:'PÊNALTIS',megaCup:'MEGACOPA',training:'TREINOS',password:'SENHA',options:'OPÇÕES'});
const pre=sec.preKickoff?.values||(sec.preKickoff={values:{}}).values;
Object.assign(pre,{formation:'FORMACAO',substitutions:'SUBSTITUICOES',teamStrategy:'TATICA DO TIME',markChange:'MARCACAO',viewData:'VER DADOS',kickOff:'INICIAR JOGO',formationDesc:'Ajuste a formacao.',substitutionsDesc:'Faca substituicoes.',teamStrategyDesc:'Defina a tatica.',markChangeDesc:'Defina a marcacao.',viewDataDesc:'Veja dados do time.',kickOffDesc:'Comece a partida.'});
const gfx=sec.graphicIntents?.values||(sec.graphicIntents={values:{}}).values;
Object.assign(gfx,{
 'strategy.screen.v614.alloutatk':'TODOS AO ATAQUE',
 'strategy.screen.v614.center':'ATAQUE PELO MEIO',
 'strategy.screen.v614.wings':'ATAQUE PELAS ALAS',
 'strategy.screen.v614.counteratk':'CONTRA ATAQUE',
 'strategy.screen.v614.alloutdef':'TODOS PRA DEFESA',
 'strategy.screen.v614.pressup':'PRESSAO INDIVIDUAL',
 'strategy.screen.v614.zonepress':'MARCACAO POR ZONA',
 'strategy.screen.v614.offtrap':'LINHA DE IMPEDIMENTO'
});
project.state.semantic.romInternalTitle='INTERNETSSSUCKERRELAX';
project.state.semantic.romInternalTitleDesired='INTERNETSSSUCKERRELAX';

const imageDir=path.join(root,'.editor-vendor','legacy-ui','assets','images');
const imageFiles={
 title:'image-009-9e0edce2d6.png',photo1:'image-010-de2d4744aa.png',photo2:'image-011-2022b32062.png',photo3:'image-012-dc866d5cc4.png',photo4:'image-013-de832796c3.png',photo5:'image-014-d630dd1337.png',ball:'image-015-960bb2fd15.png'
};
project.state.titleComposerV2=project.state.titleComposerV2||{state:{elements:[]},assets:{}};
project.state.titleComposerV2.assets={};
for(const [role,name] of Object.entries(imageFiles)){
 const p=path.join(imageDir,name);
 if(!fs.existsSync(p))throw new Error(`Recuperação cancelada: asset da Tela Inicial ausente: ${p}`);
 project.state.titleComposerV2.assets[role]='data:image/png;base64,'+fs.readFileSync(p).toString('base64');
}
for(const el of project.state.titleComposerV2.state?.elements||[]){
 if(project.state.titleComposerV2.assets[el.role]){el.imageSource='embedded';el.assetKey=el.role;el.imageData=null;el.assetDefinition='customizada'}
}
project.state.semantic.titleComposerV2={storedIn:'state.titleComposerV2',embeddedAssets:true};
project.name='International-Superstar-Soccer-Deluxe-Plus-projeto';
project.createdAt=new Date().toISOString();
project.notes=Array.isArray(project.notes)?project.notes:[];
project.notes.unshift('Projeto canônico recuperado deterministicamente do Git: textos PT-BR + Tela Inicial + teamsV1 com nomes de jogadores.');

if(countTeams(project)!==54)throw new Error(`Recuperação cancelada: esperado 54 equipes; obtido ${countTeams(project)}.`);
if(countPlayers(project)!==1080)throw new Error(`Recuperação cancelada: esperado 1080 jogadores; obtido ${countPlayers(project)}.`);
if(countAssets(project)!==7)throw new Error(`Recuperação cancelada: esperado 7 assets; obtido ${countAssets(project)}.`);

if(fs.existsSync(output)){
 const backup=output.replace(/\.issdproj$/i,'.before-recovery.issdproj');
 if(!fs.existsSync(backup))fs.copyFileSync(output,backup);
}
fs.writeFileSync(output,JSON.stringify(project,null,2),'utf8');
console.log(`Projeto canônico recuperado: ${output}`);
console.log(`54 equipes / 1080 jogadores / 7 assets / título ${project.state.semantic.romInternalTitle}`);
